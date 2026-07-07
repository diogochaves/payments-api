#!/usr/bin/env bash
# confirm-invoice.sh — Confirma uma invoice existente simulando webhook da Asaas
#
# Uso:
#   PROVIDER_PAYMENT_ID=pay_xxx EXTERNAL_REFERENCE=ref_xxx bash api/scripts/confirm-invoice.sh
#
# Variáveis de ambiente:
#   PROVIDER_PAYMENT_ID   ID do pagamento no provedor (obrigatório)
#   EXTERNAL_REFERENCE    Referência externa da invoice (obrigatório)
#   AMOUNT                Valor do pagamento em reais (default: 300.90)
#   EVENT                 Evento Asaas (default: PAYMENT_CONFIRMED)
#   API_URL               URL da API (default: http://localhost:3011)
#   WEBHOOK_TOKEN         Token do webhook (default: payments-api-local-webhook-token-0001)
#   CUSTOMER_ID           ID do cliente (default: customer-001)

set -euo pipefail

API_URL="${API_URL:-http://localhost:3011}"
API_URL="${API_URL%/}"

WEBHOOK_TOKEN="${WEBHOOK_TOKEN:-payments-api-local-webhook-token-0001}"
EVENT="${EVENT:-PAYMENT_CONFIRMED}"
AMOUNT="${AMOUNT:-300.90}"
CUSTOMER_ID="${CUSTOMER_ID:-customer-001}"
TODAY="$(date '+%Y-%m-%d')"

if [[ -z "${PROVIDER_PAYMENT_ID:-}" || -z "${EXTERNAL_REFERENCE:-}" ]]; then
  echo "Uso: PROVIDER_PAYMENT_ID=<id> EXTERNAL_REFERENCE=<ref> bash $0"
  echo ""
  echo "Variáveis opcionais:"
  echo "  EVENT=$EVENT"
  echo "  AMOUNT=$AMOUNT"
  echo "  API_URL=$API_URL"
  echo "  WEBHOOK_TOKEN=$WEBHOOK_TOKEN"
  exit 1
fi

echo "→ POST ${API_URL}/webhook/payments"
echo "  event              : ${EVENT}"
echo "  providerPaymentId  : ${PROVIDER_PAYMENT_ID}"
echo "  externalReference  : ${EXTERNAL_REFERENCE}"
echo "  amount             : ${AMOUNT}"
echo ""

RESPONSE="$(curl -sS -w "\n%{http_code}" \
  -X POST "${API_URL}/webhook/payments" \
  -H "Content-Type: application/json" \
  -H "asaas-access-token: ${WEBHOOK_TOKEN}" \
  -d "{
    \"event\": \"${EVENT}\",
    \"payment\": {
      \"id\": \"${PROVIDER_PAYMENT_ID}\",
      \"status\": \"CONFIRMED\",
      \"value\": ${AMOUNT},
      \"customer\": \"${CUSTOMER_ID}\",
      \"externalReference\": \"${EXTERNAL_REFERENCE}\",
      \"confirmedDate\": \"${TODAY}\",
      \"paymentDate\": \"${TODAY}\"
    }
  }")"

BODY="$(echo "$RESPONSE" | sed '$d')"
HTTP_STATUS="$(echo "$RESPONSE" | tail -n 1)"

echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo "HTTP ${HTTP_STATUS}"

if [[ "$HTTP_STATUS" == "200" ]]; then
  echo "✓ Webhook aceito"
else
  echo "✗ Falha — HTTP ${HTTP_STATUS}"
  exit 1
fi
