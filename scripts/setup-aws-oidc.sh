#!/usr/bin/env bash
# setup-aws-oidc.sh
#
# Creates the AWS OIDC identity provider and IAM deployment role that allows
# GitHub Actions to authenticate to AWS without long-lived access keys.
#
# Usage:
#   ./scripts/setup-aws-oidc.sh <github-org> <github-repo> [aws-region]
#
# Example:
#   ./scripts/setup-aws-oidc.sh my-org payments-api us-east-1
#
# Prerequisites:
#   - AWS CLI configured with admin credentials
#   - jq installed

set -euo pipefail

GITHUB_ORG="${1:?Missing argument: <github-org>}"
GITHUB_REPO="${2:?Missing argument: <github-repo>}"
AWS_REGION="${3:-us-east-1}"

OIDC_URL="https://token.actions.githubusercontent.com"
ROLE_NAME="payments-api-github-deploy"
POLICY_NAME="payments-api-github-deploy-policy"

echo "==> Resolving AWS account ID..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "    Account: ${ACCOUNT_ID}"
echo "    Region:  ${AWS_REGION}"

# ── 1. Create OIDC provider (idempotent) ──────────────────────────────────────
PROVIDER_ARN="arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"

if aws iam get-open-id-connect-provider --open-id-connect-provider-arn "$PROVIDER_ARN" &>/dev/null; then
  echo "==> OIDC provider already exists — skipping creation."
else
  echo "==> Creating OIDC identity provider..."
  # Thumbprint for token.actions.githubusercontent.com (stable since 2023)
  aws iam create-open-id-connect-provider \
    --url "$OIDC_URL" \
    --client-id-list "sts.amazonaws.com" \
    --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1" \
    --tags Key=Project,Value=payments-api Key=ManagedBy,Value=setup-aws-oidc
  echo "    Created."
fi

# ── 2. Create trust policy ────────────────────────────────────────────────────
# Allows any workflow in the target repo to assume this role, including:
#   - Jobs that use `environment: staging` (sub = repo:org/repo:environment:staging)
#   - Jobs on any branch without an environment (sub = repo:org/repo:ref:refs/heads/*)
# Using a wildcard here is intentional for a staging deploy role. Restrict to
# specific branches or environments for production.
TRUST_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "${PROVIDER_ARN}"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:${GITHUB_ORG}/${GITHUB_REPO}:*"
        }
      }
    }
  ]
}
EOF
)

# ── 3. Create deployment policy ───────────────────────────────────────────────
# Minimum permissions for SAM + CloudFormation + DynamoDB provisioning.
DEPLOY_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudFormationDeploy",
      "Effect": "Allow",
      "Action": [
        "cloudformation:CreateStack",
        "cloudformation:UpdateStack",
        "cloudformation:DeleteStack",
        "cloudformation:DescribeStacks",
        "cloudformation:DescribeStackEvents",
        "cloudformation:DescribeChangeSet",
        "cloudformation:CreateChangeSet",
        "cloudformation:ExecuteChangeSet",
        "cloudformation:DeleteChangeSet",
        "cloudformation:GetTemplateSummary",
        "cloudformation:ListStackResources",
        "cloudformation:ListStacks",
        "cloudformation:ValidateTemplate"
      ],
      "Resource": [
        "arn:aws:cloudformation:${AWS_REGION}:${ACCOUNT_ID}:stack/payments-api-*",
        "arn:aws:cloudformation:${AWS_REGION}:${ACCOUNT_ID}:stack/aws-sam-cli-managed-*"
      ]
    },
    {
      "Sid": "CloudFormationTransform",
      "Effect": "Allow",
      "Action": "cloudformation:CreateChangeSet",
      "Resource": "arn:aws:cloudformation:${AWS_REGION}:aws:transform/Serverless-2016-10-31"
    },
    {
      "Sid": "S3SamArtifacts",
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:GetBucketLocation",
        "s3:PutBucketPolicy",
        "s3:GetBucketPolicy",
        "s3:PutEncryptionConfiguration",
        "s3:GetEncryptionConfiguration",
        "s3:PutBucketVersioning",
        "s3:GetBucketVersioning",
        "s3:PutBucketTagging",
        "s3:GetBucketTagging",
        "s3:TagResource",
        "s3:UntagResource",
        "s3:ListBucketVersions",
        "s3:DeleteObjectVersion"
      ],
      "Resource": [
        "arn:aws:s3:::aws-sam-cli-managed-*",
        "arn:aws:s3:::aws-sam-cli-managed-*/*"
      ]
    },
    {
      "Sid": "LambdaAll",
      "Effect": "Allow",
      "Action": "lambda:*",
      "Resource": [
        "arn:aws:lambda:${AWS_REGION}:${ACCOUNT_ID}:function:*-payments-*",
        "arn:aws:lambda:${AWS_REGION}:${ACCOUNT_ID}:event-source-mapping:*"
      ]
    },
    {
      "Sid": "IamRolesForLambda",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:UpdateRole",
        "iam:DeleteRole",
        "iam:GetRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:GetRolePolicy",
        "iam:PassRole",
        "iam:TagRole",
        "iam:ListRolePolicies",
        "iam:ListAttachedRolePolicies"
      ],
      "Resource": "arn:aws:iam::${ACCOUNT_ID}:role/*-payments-*"
    },
    {
      "Sid": "SqsDeploy",
      "Effect": "Allow",
      "Action": [
        "sqs:CreateQueue",
        "sqs:DeleteQueue",
        "sqs:SetQueueAttributes",
        "sqs:GetQueueAttributes",
        "sqs:GetQueueUrl",
        "sqs:ListQueues",
        "sqs:TagQueue",
        "sqs:ListQueueTags"
      ],
      "Resource": "arn:aws:sqs:${AWS_REGION}:${ACCOUNT_ID}:*-payments-*"
    },
    {
      "Sid": "DynamoDbDeploy",
      "Effect": "Allow",
      "Action": [
        "dynamodb:CreateTable",
        "dynamodb:UpdateTable",
        "dynamodb:DeleteTable",
        "dynamodb:DescribeTable",
        "dynamodb:DescribeContinuousBackups",
        "dynamodb:DescribeTimeToLive",
        "dynamodb:ListTagsOfResource",
        "dynamodb:TagResource",
        "dynamodb:UntagResource",
        "dynamodb:ListTables"
      ],
      "Resource": "arn:aws:dynamodb:${AWS_REGION}:${ACCOUNT_ID}:table/*-*Table"
    },
    {
      "Sid": "LogGroupsDeploy",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:DeleteLogGroup",
        "logs:DescribeLogGroups",
        "logs:PutRetentionPolicy",
        "logs:DeleteRetentionPolicy",
        "logs:ListTagsLogGroup",
        "logs:TagLogGroup",
        "logs:ListTagsForResource",
        "logs:TagResource"
      ],
      "Resource": "arn:aws:logs:${AWS_REGION}:${ACCOUNT_ID}:log-group:/aws/lambda/*-payments-*"
    }
  ]
}
EOF
)

# ── 4. Create or update IAM role ──────────────────────────────────────────────
if aws iam get-role --role-name "$ROLE_NAME" &>/dev/null; then
  echo "==> Updating trust policy on existing role ${ROLE_NAME}..."
  aws iam update-assume-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-document "$TRUST_POLICY"
else
  echo "==> Creating IAM role ${ROLE_NAME}..."
  aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document "$TRUST_POLICY" \
    --tags Key=Project,Value=payments-api Key=ManagedBy,Value=setup-aws-oidc
  echo "    Created."
fi

# ── 5. Attach inline deployment policy ───────────────────────────────────────
echo "==> Attaching deployment policy..."
aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "$POLICY_NAME" \
  --policy-document "$DEPLOY_POLICY"

ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"

echo ""
echo "✓ Done. Copy this Role ARN into GitHub secret AWS_DEPLOY_ROLE_ARN:"
echo ""
echo "  ${ROLE_ARN}"
echo ""
echo "Then run:"
echo "  export AWS_DEPLOY_ROLE_ARN=\"${ROLE_ARN}\""
echo "  export STAGING_ASAAS_TOKEN=\"<asaas-sandbox-api-key>\""
echo "  export STAGING_ASAAS_WEBHOOK_TOKEN=\"<asaas-webhook-validation-token>\""
echo "  export STAGING_API_TOKENS='[{\"token\":\"tok_x\",\"tokenId\":\"checkout\",\"tenantId\":\"my-tenant\",\"revoked\":false}]'"
echo "  ./scripts/setup-github-secrets.sh <github-org>/<github-repo>"
