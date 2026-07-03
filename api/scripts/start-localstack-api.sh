#!/usr/bin/env bash
set -euo pipefail

export PORT="${PORT:-3011}"
export NODE_ENV="${NODE_ENV:-development}"
export INVOICE_REPOSITORY="${INVOICE_REPOSITORY:-dynamo}"
export DYNAMO_MOCK="${DYNAMO_MOCK:-false}"
export AWS_REGION="${AWS_REGION:-us-east-1}"
export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test}"
export AWS_DYNAMODB_ENDPOINT="${AWS_DYNAMODB_ENDPOINT:-http://localhost.localstack.cloud:4566}"
export ENABLED_PAYMENT_PROVIDERS="${ENABLED_PAYMENT_PROVIDERS:-ASAAS}"
export DEFAULT_PAYMENT_PROVIDER="${DEFAULT_PAYMENT_PROVIDER:-ASAAS}"
export ASAAS_MOCK="${ASAAS_MOCK:-true}"
export ASAAS_WEBHOOK_TOKEN="${ASAAS_WEBHOOK_TOKEN:-local-webhook-token}"
export WEBHOOK_PROCESSING_MODE="${WEBHOOK_PROCESSING_MODE:-sync}"
export DD_TRACE_ENABLED="${DD_TRACE_ENABLED:-false}"
export DD_LOGS_INJECTION="${DD_LOGS_INJECTION:-false}"
export DD_RUNTIME_METRICS_ENABLED="${DD_RUNTIME_METRICS_ENABLED:-false}"

echo "Starting Payments API with LocalStack DynamoDB"
echo "API: http://localhost:${PORT}"
echo "DynamoDB endpoint: ${AWS_DYNAMODB_ENDPOINT}"
echo "Repository: ${INVOICE_REPOSITORY}"
echo "Webhook processing mode: ${WEBHOOK_PROCESSING_MODE}"

npm run start
