#!/usr/bin/env bash
set -euo pipefail

AWS_ENDPOINT_URL="${AWS_ENDPOINT_URL:-http://localhost.localstack.cloud:4566}"
STACK_NAME="${STACK_NAME:-payments-gateway}"
ASAAS_WEBHOOK_TOKEN="${ASAAS_WEBHOOK_TOKEN:-local-webhook-token}"

if [[ -z "${API_URL:-}" ]]; then
  API_URL="$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --endpoint-url "$AWS_ENDPOINT_URL" \
    --query "Stacks[0].Outputs[?OutputKey=='ApiFunctionUrl'].OutputValue | [0]" \
    --output text 2>/dev/null || true)"
fi

API_URL="${API_URL:-http://localhost:3011}"
API_URL="${API_URL%/}"
ORDER_ID="${ORDER_ID:-MS-LOCALSTACK-001}"
IDEMPOTENCY_KEY="${IDEMPOTENCY_KEY:-${ORDER_ID}:create}"
CORRELATION_ID="${CORRELATION_ID:-localstack-${ORDER_ID}}"

echo "📄 Criando invoice para alimentar DynamoDB/LocalStack"
echo "➡️  POST ${API_URL}/invoices"
echo "-----------------------------------"

CREATE_RESPONSE="$(curl -sS -X POST "${API_URL}/invoices" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: ${IDEMPOTENCY_KEY}" \
  -H "X-Correlation-Id: ${CORRELATION_ID}" \
  -d "{
    \"tenantId\": \"magazine-siara\",
    \"orderId\": \"${ORDER_ID}\",
    \"customer\": {
      \"id\": \"customer-${ORDER_ID}\",
      \"name\": \"Cliente LocalStack\",
      \"document\": \"11144477735\",
      \"email\": \"localstack@example.com\",
      \"mobilePhone\": \"11987654321\"
    },
    \"amount\": 300.90,
    \"currency\": \"BRL\",
    \"dueDate\": \"2026-07-04\",
    \"billingType\": \"PIX\",
    \"provider\": \"ASAAS\",
    \"description\": \"Pedido ${ORDER_ID} - simulacao LocalStack\"
  }")"

echo "$CREATE_RESPONSE" | jq .

PROVIDER_PAYMENT_ID="$(echo "$CREATE_RESPONSE" | jq -r '.providerPaymentId // empty')"
EXTERNAL_REFERENCE="$(echo "$CREATE_RESPONSE" | jq -r '.externalReference // empty')"
INVOICE_ID="$(echo "$CREATE_RESPONSE" | jq -r '.invoiceId // empty')"
TENANT_ID="$(echo "$CREATE_RESPONSE" | jq -r '.tenantId // "magazine-siara"')"

if [[ -z "$PROVIDER_PAYMENT_ID" || -z "$EXTERNAL_REFERENCE" || -z "$INVOICE_ID" ]]; then
  echo "❌ Invoice local não retornou invoiceId/providerPaymentId/externalReference"
  exit 1
fi

echo
echo "📡 Simulando webhook da Asaas com dados da invoice criada"
echo "➡️  POST ${API_URL}/webhook/payments"
echo "-----------------------------------"

WEBHOOK_RESPONSE="$(curl -sS -w "\n%{http_code}" -X POST "${API_URL}/webhook/payments" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Asaas-Webhook" \
  -H "asaas-access-token: ${ASAAS_WEBHOOK_TOKEN}" \
  -d "{
    \"event\": \"PAYMENT_CONFIRMED\",
    \"payment\": {
      \"id\": \"${PROVIDER_PAYMENT_ID}\",
      \"status\": \"CONFIRMED\",
      \"value\": 300.90,
      \"billingType\": \"PIX\",
      \"customer\": \"customer-${ORDER_ID}\",
      \"description\": \"Pedido ${ORDER_ID} - simulacao LocalStack\",
      \"dueDate\": \"2026-07-04\",
      \"confirmedDate\": \"2026-07-04\",
      \"externalReference\": \"${EXTERNAL_REFERENCE}\"
    }
  }")"

WEBHOOK_BODY="$(echo "$WEBHOOK_RESPONSE" | sed '$d')"
WEBHOOK_STATUS="$(echo "$WEBHOOK_RESPONSE" | tail -n 1)"

echo "$WEBHOOK_BODY" | jq .
echo "HTTP ${WEBHOOK_STATUS}"

if [[ "$WEBHOOK_STATUS" != "200" ]]; then
  echo "❌ Webhook deveria retornar HTTP 200 para a Asaas"
  exit 1
fi

echo
echo "🔎 Verificando confirmação no DynamoDB LocalStack"
for attempt in {1..10}; do
  DYNAMO_ITEM="$(aws dynamodb get-item \
    --table-name PaymentsTable \
    --key "{\"PK\":{\"S\":\"TENANT#${TENANT_ID}\"},\"SK\":{\"S\":\"INVOICE#${INVOICE_ID}\"}}" \
    --endpoint-url "$AWS_ENDPOINT_URL" \
    --output json 2>/dev/null || true)"

  STATUS="$(echo "$DYNAMO_ITEM" | jq -r '.Item.status.S // .Item.invoice.M.status.S // empty')"

  if [[ "$STATUS" == "CONFIRMED" || "$STATUS" == "RECEIVED" ]]; then
    echo "✅ Invoice ${INVOICE_ID} confirmada no DynamoDB com status ${STATUS}"
    break
  fi

  if [[ "$attempt" == "10" ]]; then
    echo "❌ Invoice ${INVOICE_ID} não foi confirmada no DynamoDB após o webhook"
    echo "$DYNAMO_ITEM" | jq .
    exit 1
  fi

  sleep 1
done

echo "✅ Webhook confirmado com estrutura LocalStack/DynamoDB"
