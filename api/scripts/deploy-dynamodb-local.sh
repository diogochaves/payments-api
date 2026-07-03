#!/usr/bin/env bash
set -euo pipefail
export AWS_PAGER=""
export AWS_ENDPOINT_URL=http://localhost.localstack.cloud:4566

STACK_NAME="payments-gateway-dynamodb"
TEMPLATE="infra/dynamodb.yaml"

echo "🚀 Deploy DynamoDB (LocalStack)"
echo "📦 Stack: $STACK_NAME"
echo "📄 Template: $TEMPLATE"
echo "-----------------------------------"

if aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --endpoint-url "$AWS_ENDPOINT_URL" >/dev/null 2>&1; then

  echo "🔁 Stack existe, atualizando..."
  UPDATE_OUTPUT="$(mktemp)"
  if ! aws cloudformation update-stack \
    --stack-name "$STACK_NAME" \
    --template-body "file://$TEMPLATE" \
    --capabilities CAPABILITY_NAMED_IAM \
    --endpoint-url "$AWS_ENDPOINT_URL" >"${UPDATE_OUTPUT}" 2>&1; then
    if grep -q "No updates are to be performed" "${UPDATE_OUTPUT}"; then
      echo "✅ Stack já está atualizada"
    else
      cat "${UPDATE_OUTPUT}" >&2
      rm -f "${UPDATE_OUTPUT}"
      exit 1
    fi
  fi
  rm -f "${UPDATE_OUTPUT}"

else
  echo "🆕 Stack não existe, criando..."
  aws cloudformation create-stack \
    --stack-name "$STACK_NAME" \
    --template-body "file://$TEMPLATE" \
    --capabilities CAPABILITY_NAMED_IAM \
    --endpoint-url "$AWS_ENDPOINT_URL"
fi

echo "✅ Deploy finalizado"
