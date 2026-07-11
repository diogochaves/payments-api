#!/bin/bash
set -e
export AWS_PAGER=""

echo "Deploying to localstack..."
export AWS_ENDPOINT_URL=http://localhost.localstack.cloud:4566
export AWS_DEFAULT_REGION=us-east-1
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export ASAAS_WEBHOOK_TOKEN="${ASAAS_WEBHOOK_TOKEN:-local-webhook-token}"

aws s3 mb s3://payments-gateway-prod \
  --endpoint-url "$AWS_ENDPOINT_URL" >/dev/null 2>&1 || true

sam deploy \
  --debug \
  --template-file .aws-sam/build/template.yaml \
  --stack-name payments-gateway \
  --s3-bucket payments-gateway-prod \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset \
  --parameter-overrides \
    EnvironmentName=local \
    InvoiceRepository=dynamo \
    DynamoMock=false \
    AwsDynamoDbEndpoint=http://localhost.localstack.cloud:4566 \
    EnabledPaymentProviders=ASAAS \
    DefaultPaymentProvider=ASAAS \
    AsaasMock=true \
    AsaasWebhookToken="$ASAAS_WEBHOOK_TOKEN" \
    WebhookProcessingMode=async \
    DatadogEnabled=false \
  --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND

# sam deploy \
#   --debug \
#   --template-file .aws-sam/build/template.yaml \
#   --stack-name payments-gateway \
#   --s3-bucket payments-gateway-prod \
#   --no-confirm-changeset \
#   --no-fail-on-empty-changeset \
#   --capabilities CAPABILITY_IAM

echo "Deployed to localstack"

# STACK_NAME=payments-gateway
# ENDPOINT=http://localhost.localstack.cloud:4566

# if aws cloudformation describe-stacks \
#   --stack-name $STACK_NAME \
#   --endpoint-url $ENDPOINT >/dev/null 2>&1; then

#   echo "Updating stack..."
#   aws cloudformation update-stack \
#     --stack-name $STACK_NAME \
#     --template-body file://.aws-sam/build/template.yaml \
#     --capabilities CAPABILITY_IAM \
#     --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
#     --endpoint-url $ENDPOINT
# else
#   echo "Creating stack..."
#   aws cloudformation create-stack \
#     --stack-name $STACK_NAME \
#     --template-body file://.aws-sam/build/template.yaml \
#     --capabilities CAPABILITY_IAM \
#     --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
#     --endpoint-url $ENDPOINT
# fi
