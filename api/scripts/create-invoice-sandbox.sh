#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${ENV_FILE:-${API_DIR}/.env}"
API_URL="${API_URL:-http://localhost:3011}"
ORDER_ID="${ORDER_ID:-MS-SBX-$(date +%Y%m%d%H%M%S)}"
DUE_DATE="${DUE_DATE:-$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d '+1 day' +%Y-%m-%d)}"
BILLING_TYPE="${BILLING_TYPE:-PIX}"
AMOUNT="${AMOUNT:-19.9}"
CONFIRM_SANDBOX_PAYMENT="${CONFIRM_SANDBOX_PAYMENT:-false}"

load_env_value() {
  local key="$1"

  [[ -f "${ENV_FILE}" ]] || return 0

  awk -F= -v key="${key}" '$1 == key {
    sub(/^[^=]*=/, "")
    print
    exit
  }' "${ENV_FILE}" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

asaas_base_url() {
  local url="${ASAAS_URL:-$(load_env_value ASAAS_URL)}"

  url="${url:-https://api-sandbox.asaas.com/v3}"
  url="${url%/}"

  if [[ "${url}" != */v3 ]]; then
    url="${url}/v3"
  fi

  echo "${url}"
}

confirm_sandbox_payment() {
  local provider_payment_id="$1"
  local token="${ASAAS_TOKEN:-$(load_env_value ASAAS_TOKEN)}"
  local url
  local response_file
  local http_status

  if [[ -z "${token}" ]]; then
    echo "ASAAS_TOKEN is required to confirm Sandbox payment ${provider_payment_id}" >&2
    exit 1
  fi

  url="$(asaas_base_url)"
  response_file="$(mktemp)"

  http_status="$(curl -sS -o "${response_file}" -w '%{http_code}' \
    --request POST \
    --url "${url}/sandbox/payment/${provider_payment_id}/confirm" \
    --header 'accept: application/json' \
    --header "access_token: ${token}" \
    --header 'content-type: application/json' \
    --data '{}')"

  echo
  echo "Sandbox payment confirmation:"
  echo "HTTP_STATUS:${http_status}"
  if command -v jq >/dev/null 2>&1; then
    jq . "${response_file}"
  else
    cat "${response_file}"
  fi

  rm -f "${response_file}"

  if [[ "${http_status}" != 2* ]]; then
    exit 1
  fi
}

response="$(curl -sS -w '\nHTTP_STATUS:%{http_code}\n' \
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
    \"amount\": ${AMOUNT},
    \"currency\": \"BRL\",
    \"dueDate\": \"${DUE_DATE}\",
    \"billingType\": \"${BILLING_TYPE}\",
    \"provider\": \"ASAAS\",
    \"description\": \"Pedido ${ORDER_ID}\"
  }")"

echo "${response}"

if [[ "${CONFIRM_SANDBOX_PAYMENT}" == "true" ]]; then
  if ! command -v jq >/dev/null 2>&1; then
    echo "jq is required when CONFIRM_SANDBOX_PAYMENT=true" >&2
    exit 1
  fi

  provider_payment_id="$(echo "${response}" | sed '/^HTTP_STATUS:/d' | jq -r '.providerPaymentId // empty')"

  if [[ -z "${provider_payment_id}" ]]; then
    echo "Invoice response did not include providerPaymentId; cannot confirm Sandbox payment." >&2
    exit 1
  fi

  confirm_sandbox_payment "${provider_payment_id}"
fi
