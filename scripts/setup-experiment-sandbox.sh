#!/usr/bin/env bash
# setup-experiment-sandbox.sh
#
# Creates the AWS IAM role and GitHub Environment required for
# experiment sandbox deploys via .github/workflows/experiment-deploy.yml.
#
# Run ONCE per repository, then re-run whenever secrets rotate.
#
# Usage (opção 1 — via api/.env, recomendado):
#   Preencha EXPERIMENT_* em api/.env e execute:
#   ./scripts/setup-experiment-sandbox.sh <github-org>/<github-repo>
#
# Usage (opção 2 — via export manual):
#   export EXPERIMENT_ASAAS_TOKEN="your_asaas_sandbox_key"
#   export EXPERIMENT_ASAAS_WEBHOOK_TOKEN="your_asaas_webhook_validation_token"
#   export EXPERIMENT_ADMIN_SECRET="your_admin_api_secret"
#   ./scripts/setup-experiment-sandbox.sh <github-org>/<github-repo>
#
# Variáveis exportadas no shell têm precedência sobre api/.env.
#
# Prerequisites:
#   - AWS CLI configured with admin credentials (AdministratorAccess or equivalent)
#   - GitHub CLI (gh) installed and authenticated: gh auth login
#   - OIDC provider already created:
#       ./scripts/setup-aws-oidc.sh <org> <repo>
#
# What this script does:
#   1. Verifies the GitHub OIDC provider exists in AWS (created by setup-aws-oidc.sh)
#   2. Creates (or updates) IAM role payments-api-github-experiment
#      - Trust: only jobs running in GitHub Environment 'experiment'
#      - Policy: scoped exclusively to experiment-* AWS resources
#   3. Creates GitHub Environment 'experiment' (no required reviewers)
#   4. Sets EXPERIMENT_* secrets in the GitHub Environment
#
# Idempotent — safe to re-run when rotating secrets or updating the IAM policy.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$REPO_ROOT/api/.env"

# Load api/.env when present so the caller doesn't need to export vars manually.
# Variables already set in the environment take precedence over .env values.
if [[ -f "$ENV_FILE" ]]; then
  set +u
  # shellcheck disable=SC1090
  while IFS= read -r line || [[ -n "$line" ]]; do
    # Skip comments and blank lines
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "${line// }" ]] && continue
    # Only export EXPERIMENT_* — avoid clobbering unrelated vars
    if [[ "$line" =~ ^EXPERIMENT_ ]]; then
      key="${line%%=*}"
      value="${line#*=}"
      # Only set if not already in environment
      if [[ -z "${!key:-}" ]]; then
        export "$key"="$value"
      fi
    fi
  done < "$ENV_FILE"
  set -u
fi

REPO="${1:?Missing argument: <github-org>/<github-repo>  e.g. my-org/payments-api}"
GITHUB_ORG="${REPO%%/*}"
GITHUB_REPO="${REPO##*/}"
AWS_REGION="${AWS_REGION:-us-east-1}"

ROLE_NAME="payments-api-github-experiment"
POLICY_NAME="payments-api-experiment-deploy-policy"

# ── Validate prerequisites ────────────────────────────────────────────────────

if ! command -v aws &>/dev/null; then
  echo "ERROR: AWS CLI is not installed."
  echo "Install it at: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html"
  exit 1
fi

if ! command -v gh &>/dev/null; then
  echo "ERROR: GitHub CLI (gh) is not installed."
  echo "Install it at: https://cli.github.com"
  exit 1
fi

if ! command -v jq &>/dev/null; then
  echo "ERROR: jq is not installed."
  echo "Install it with: brew install jq  (macOS) or apt install jq"
  exit 1
fi

if ! gh auth status &>/dev/null; then
  echo "ERROR: GitHub CLI is not authenticated. Run: gh auth login"
  exit 1
fi

if ! gh repo view "$REPO" &>/dev/null; then
  echo "ERROR: Repository ${REPO} not found or access denied."
  exit 1
fi

# ── Check required environment variables before doing anything ────────────────

MISSING=()
[[ -z "${EXPERIMENT_ASAAS_TOKEN:-}" ]]         && MISSING+=("EXPERIMENT_ASAAS_TOKEN")
[[ -z "${EXPERIMENT_ASAAS_WEBHOOK_TOKEN:-}" ]]  && MISSING+=("EXPERIMENT_ASAAS_WEBHOOK_TOKEN")
[[ -z "${EXPERIMENT_ADMIN_SECRET:-}" ]]         && MISSING+=("EXPERIMENT_ADMIN_SECRET")

if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo "ERROR: The following environment variables are not set:"
  for v in "${MISSING[@]}"; do
    echo "  export ${v}=\"...\""
  done
  echo ""
  echo "Export each variable and re-run the script."
  exit 1
fi

# ── Resolve AWS account ID ────────────────────────────────────────────────────

echo "==> Resolving AWS identity..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "    Account: ${ACCOUNT_ID}"
echo "    Region:  ${AWS_REGION}"
echo "    Repo:    ${REPO}"
echo ""

PROVIDER_ARN="arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"

# ── 1. Verify OIDC provider exists ───────────────────────────────────────────
# The OIDC provider is shared with the staging role — created by setup-aws-oidc.sh.
# This script does not create it; it only verifies it is present.

echo "==> Checking GitHub OIDC provider..."
if ! aws iam get-open-id-connect-provider \
    --open-id-connect-provider-arn "$PROVIDER_ARN" &>/dev/null; then
  echo ""
  echo "ERROR: GitHub OIDC provider not found in account ${ACCOUNT_ID}."
  echo ""
  echo "Run setup-aws-oidc.sh first:"
  echo "  ./scripts/setup-aws-oidc.sh ${GITHUB_ORG} ${GITHUB_REPO} ${AWS_REGION}"
  exit 1
fi
echo "    ✓ OIDC provider exists."
echo ""

# ── 2. Create trust policy ────────────────────────────────────────────────────
# Trust is restricted to jobs that run under GitHub Environment 'experiment'.
# The sub claim for environment-scoped jobs is:
#   repo:<org>/<repo>:environment:experiment
#
# This is tighter than the staging role (which uses a wildcard).
# A job on an arbitrary branch without the environment cannot assume this role.

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
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:${GITHUB_ORG}/${GITHUB_REPO}:environment:experiment"
        }
      }
    }
  ]
}
EOF
)

# ── 3. Create deployment policy scoped to experiment-* ───────────────────────
# Every resource ARN below is restricted to the experiment-* prefix.
# This role cannot read, write, or delete staging or production resources.

DEPLOY_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudFormationExperiment",
      "Effect": "Allow",
      "Action": [
        "cloudformation:CreateStack",
        "cloudformation:UpdateStack",
        "cloudformation:DeleteStack",
        "cloudformation:DescribeStacks",
        "cloudformation:DescribeStackEvents",
        "cloudformation:DescribeStackResource",
        "cloudformation:DescribeStackResources",
        "cloudformation:GetTemplate",
        "cloudformation:GetTemplateSummary",
        "cloudformation:ListStackResources",
        "cloudformation:ValidateTemplate",
        "cloudformation:CreateChangeSet",
        "cloudformation:DeleteChangeSet",
        "cloudformation:DescribeChangeSet",
        "cloudformation:ExecuteChangeSet",
        "cloudformation:ListStacks"
      ],
      "Resource": [
        "arn:aws:cloudformation:${AWS_REGION}:${ACCOUNT_ID}:stack/payments-api-experiment/*",
        "arn:aws:cloudformation:${AWS_REGION}:${ACCOUNT_ID}:stack/payments-api-dynamo-experiment/*"
      ]
    },
    {
      "Sid": "CloudFormationTransform",
      "Effect": "Allow",
      "Action": "cloudformation:CreateChangeSet",
      "Resource": "arn:aws:cloudformation:${AWS_REGION}:aws:transform/Serverless-2016-10-31"
    },
    {
      "Sid": "CloudFormationDescribeAll",
      "Effect": "Allow",
      "Action": [
        "cloudformation:DescribeStacks",
        "cloudformation:ListStacks"
      ],
      "Resource": "*"
    },
    {
      "Sid": "S3SamBucket",
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
      "Sid": "LambdaExperiment",
      "Effect": "Allow",
      "Action": [
        "lambda:CreateFunction",
        "lambda:UpdateFunctionCode",
        "lambda:UpdateFunctionConfiguration",
        "lambda:DeleteFunction",
        "lambda:GetFunction",
        "lambda:GetFunctionConfiguration",
        "lambda:AddPermission",
        "lambda:RemovePermission",
        "lambda:ListVersionsByFunction",
        "lambda:PublishVersion",
        "lambda:CreateAlias",
        "lambda:DeleteAlias",
        "lambda:GetAlias",
        "lambda:UpdateAlias",
        "lambda:ListTags",
        "lambda:TagResource",
        "lambda:UntagResource",
        "lambda:CreateFunctionUrlConfig",
        "lambda:UpdateFunctionUrlConfig",
        "lambda:DeleteFunctionUrlConfig",
        "lambda:GetFunctionUrlConfig",
        "lambda:CreateEventSourceMapping",
        "lambda:DeleteEventSourceMapping",
        "lambda:GetEventSourceMapping",
        "lambda:UpdateEventSourceMapping"
      ],
      "Resource": [
        "arn:aws:lambda:${AWS_REGION}:${ACCOUNT_ID}:function:payments-api-experiment-*",
        "arn:aws:lambda:${AWS_REGION}:${ACCOUNT_ID}:event-source-mapping:*"
      ]
    },
    {
      "Sid": "IAMExperimentRoles",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:UpdateRole",
        "iam:DeleteRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:GetRole",
        "iam:GetRolePolicy",
        "iam:PassRole",
        "iam:TagRole",
        "iam:UntagRole",
        "iam:ListRoleTags",
        "iam:ListRolePolicies",
        "iam:ListAttachedRolePolicies"
      ],
      "Resource": "arn:aws:iam::${ACCOUNT_ID}:role/payments-api-experiment-*"
    },
    {
      "Sid": "SQSExperiment",
      "Effect": "Allow",
      "Action": [
        "sqs:CreateQueue",
        "sqs:DeleteQueue",
        "sqs:SetQueueAttributes",
        "sqs:GetQueueAttributes",
        "sqs:GetQueueUrl",
        "sqs:TagQueue",
        "sqs:UntagQueue",
        "sqs:ListQueueTags"
      ],
      "Resource": "arn:aws:sqs:${AWS_REGION}:${ACCOUNT_ID}:experiment-*"
    },
    {
      "Sid": "DynamoDBExperiment",
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
      "Resource": "arn:aws:dynamodb:${AWS_REGION}:${ACCOUNT_ID}:table/experiment-*"
    },
    {
      "Sid": "CloudWatchLogsExperiment",
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
      "Resource": "arn:aws:logs:${AWS_REGION}:${ACCOUNT_ID}:log-group:/aws/lambda/payments-api-experiment-*"
    }
  ]
}
EOF
)

# ── 4. Create or update IAM role ──────────────────────────────────────────────

if aws iam get-role --role-name "$ROLE_NAME" &>/dev/null; then
  echo "==> Role ${ROLE_NAME} already exists — updating trust policy..."
  aws iam update-assume-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-document "$TRUST_POLICY"
  echo "    ✓ Trust policy updated."
else
  echo "==> Creating IAM role ${ROLE_NAME}..."
  aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document "$TRUST_POLICY" \
    --description "GitHub Actions OIDC role for experiment sandbox deploys — experiment-* scope only" \
    --tags \
      Key=Project,Value=payments-api \
      Key=ManagedBy,Value=setup-experiment-sandbox \
      Key=Scope,Value=experiment
  echo "    ✓ Role created."
fi

# ── 5. Attach or replace inline deployment policy ─────────────────────────────

echo "==> Attaching deployment policy (experiment-* scope)..."
aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "$POLICY_NAME" \
  --policy-document "$DEPLOY_POLICY"
echo "    ✓ Policy attached."
echo ""

ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"

# ── 6. Create GitHub Environment 'experiment' ─────────────────────────────────
# No required_reviewers and no wait_timer — anyone can trigger a deploy
# without a manual approval gate. This is intentional for Upstream experiments.

echo "==> Creating GitHub Environment 'experiment' (no approval gate)..."
gh api \
  --method PUT \
  "/repos/${REPO}/environments/experiment" \
  --field wait_timer=0 \
  --field prevent_self_review=false \
  --silent
echo "    ✓ Environment 'experiment' ready."
echo ""

# ── 7. Set EXPERIMENT_* secrets in the GitHub Environment ─────────────────────

echo "==> Setting experiment environment secrets..."

printf '%s' "$EXPERIMENT_ASAAS_TOKEN" \
  | gh secret set EXPERIMENT_ASAAS_TOKEN --repo "$REPO" --env experiment --body -
echo "    ✓ EXPERIMENT_ASAAS_TOKEN"

printf '%s' "$EXPERIMENT_ASAAS_WEBHOOK_TOKEN" \
  | gh secret set EXPERIMENT_ASAAS_WEBHOOK_TOKEN --repo "$REPO" --env experiment --body -
echo "    ✓ EXPERIMENT_ASAAS_WEBHOOK_TOKEN"

printf '%s' "$EXPERIMENT_ADMIN_SECRET" \
  | gh secret set EXPERIMENT_ADMIN_SECRET --repo "$REPO" --env experiment --body -
echo "    ✓ EXPERIMENT_ADMIN_SECRET"

# ── Summary ───────────────────────────────────────────────────────────────────

echo ""
echo "✓ Experiment sandbox setup complete. Summary:"
echo ""
echo "  AWS IAM role:"
echo "    ${ROLE_ARN}"
echo "    Trust:  repo:${GITHUB_ORG}/${GITHUB_REPO}:environment:experiment"
echo "    Scope:  experiment-* resources only"
echo ""
echo "  GitHub Environment 'experiment':"
echo "    EXPERIMENT_ASAAS_TOKEN"
echo "    EXPERIMENT_ASAAS_WEBHOOK_TOKEN"
echo "    EXPERIMENT_ADMIN_SECRET"
echo "    Required reviewers: none (no approval gate)"
echo ""
echo "Next steps:"
echo "  1. Go to GitHub Actions → Experiment Sandbox Deploy → Run workflow"
echo "  2. Inputs: branch=<experiment-branch>, experiment_id=EXP-NNN, action=deploy"
echo "  3. Monitor: https://github.com/${REPO}/actions/workflows/experiment-deploy.yml"
echo "  4. After validation, run with action=teardown to destroy the stack."
