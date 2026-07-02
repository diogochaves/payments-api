#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:3011}"
ORDER_ID="${ORDER_ID:-MS-SBX-$(date +%Y%m%d%H%M%S)}"

curl -sS -w '\nHTTP_STATUS:%{http_code}\n' \
  --request POST "$API_URL/invoices" \
  --header 'Content-Type: application/json' \
  --header "Idempotency-Key: ${ORDER_ID}:create" \
  --data "{
    \"tenantId\": \"magazine-siara\",
    \"orderId\": \"${ORDER_ID}\",
    \"customer\": {
      \"id\": \"customer-${ORDER_ID}\",
      \"name\": \"Cliente Sandbox Magazine Siara\",
      \"document\": \"11144477735\",
      \"email\": \"sandbox@example.com\",
      \"mobilePhone\": \"11987654321\"
    },
    \"amount\": 19.9,
    \"currency\": \"BRL\",
    \"dueDate\": \"2026-06-20\",
    \"billingType\": \"PIX\",
    \"provider\": \"ASAAS\",
    \"description\": \"Pedido ${ORDER_ID}\"
  }"
