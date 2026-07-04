#!/usr/bin/env bash
# update-asaas-webhook.sh
#
# Registers (or updates) the payment webhook URL in the Asaas sandbox/production
# account. Safe to re-run — the Asaas API upserts the configuration.
#
# Usage:
#   ASAAS_TOKEN="..."  ASAAS_WEBHOOK_TOKEN="..."  \
#   WEBHOOK_URL="https://your-api.com/webhook/payments" \
#   ./scripts/update-asaas-webhook.sh
#
# Or pass the webhook URL as the first argument:
#   ./scripts/update-asaas-webhook.sh https://your-api.com/webhook/payments
#
# Environment variables:
#   ASAAS_TOKEN          — Asaas API key (access_token)
#   ASAAS_WEBHOOK_TOKEN  — Token Asaas will send in the asaas-access-token header
#   WEBHOOK_URL          — Full URL for the payments webhook endpoint
#   ASAAS_URL            — Asaas base URL (default: https://api-sandbox.asaas.com)

set -euo pipefail

# ── Resolve inputs ────────────────────────────────────────────────────────────

WEBHOOK_URL="${1:-${WEBHOOK_URL:-}}"
ASAAS_TOKEN="${ASAAS_TOKEN:-}"
ASAAS_WEBHOOK_TOKEN="${ASAAS_WEBHOOK_TOKEN:-}"
ASAAS_BASE_URL="${ASAAS_URL:-https://api-sandbox.asaas.com}"

# Normalise base URL: strip trailing slash, ensure /v3 suffix
ASAAS_BASE_URL="${ASAAS_BASE_URL%/}"
[[ "$ASAAS_BASE_URL" != */v3 ]] && ASAAS_BASE_URL="${ASAAS_BASE_URL}/v3"

# ── Validate required inputs ──────────────────────────────────────────────────

MISSING=()
[[ -z "$WEBHOOK_URL" ]]       && MISSING+=("WEBHOOK_URL (first arg or env var)")
[[ -z "$ASAAS_TOKEN" ]]        && MISSING+=("ASAAS_TOKEN")
[[ -z "$ASAAS_WEBHOOK_TOKEN" ]] && MISSING+=("ASAAS_WEBHOOK_TOKEN")

if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo "ERROR: Missing required inputs:"
  printf '  - %s\n' "${MISSING[@]}"
  echo ""
  echo "Usage:"
  echo "  ASAAS_TOKEN=... ASAAS_WEBHOOK_TOKEN=... \\"
  echo "  WEBHOOK_URL=... ./scripts/update-asaas-webhook.sh"
  exit 1
fi

# ── Build payload ─────────────────────────────────────────────────────────────
# Events listed below are the ones the application explicitly handles.
# PAYMENT_OVERDUE and unknown events are ignored at the application layer
# but harmless to include — they just result in no-op processing.

PAYLOAD=$(cat <<EOF
{
  "url": "${WEBHOOK_URL}",
  "interrupted": false,
  "enabled": true,
  "apiVersion": 3,
  "authToken": "${ASAAS_WEBHOOK_TOKEN}",
  "events": [
    "PAYMENT_CONFIRMED",
    "PAYMENT_RECEIVED",
    "PAYMENT_DELETED",
    "PAYMENT_AUTHORIZED",
    "PAYMENT_AWAITING_RISK_ANALYSIS",
    "PAYMENT_APPROVED_BY_RISK_ANALYSIS",
    "PAYMENT_REPROVED_BY_RISK_ANALYSIS",
    "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED"
  ]
}
EOF
)

# ── Call Asaas API ────────────────────────────────────────────────────────────

echo "==> Updating Asaas webhook configuration"
echo "    URL:      ${WEBHOOK_URL}"
echo "    Asaas:    ${ASAAS_BASE_URL}"
echo ""

HTTP_STATUS=$(curl -s -o /tmp/asaas-webhook-response.json -w "%{http_code}" \
  -X POST "${ASAAS_BASE_URL}/notifications/webhook" \
  -H "access_token: ${ASAAS_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "User-Agent: payments-api/deploy-script" \
  -d "${PAYLOAD}" \
  --max-time 30)

RESPONSE=$(cat /tmp/asaas-webhook-response.json 2>/dev/null || echo '{}')

# ── Evaluate result ───────────────────────────────────────────────────────────

if [[ "$HTTP_STATUS" == "200" || "$HTTP_STATUS" == "201" ]]; then
  ENABLED=$(echo "$RESPONSE" | grep -o '"enabled":[^,}]*' | head -1 | cut -d: -f2 | tr -d ' "')
  REGISTERED_URL=$(echo "$RESPONSE" | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)

  echo "✓ Webhook updated successfully (HTTP ${HTTP_STATUS})"
  echo "  Registered URL: ${REGISTERED_URL:-${WEBHOOK_URL}}"
  echo "  Enabled:        ${ENABLED:-true}"
  exit 0
fi

# Non-2xx — surface the error clearly
echo "ERROR: Asaas API returned HTTP ${HTTP_STATUS}"
echo ""
echo "Response body:"
echo "${RESPONSE}" | cat
echo ""

# Common error hints
case "$HTTP_STATUS" in
  401|403)
    echo "Hint: Check that ASAAS_TOKEN is correct and active for this environment."
    ;;
  404)
    echo "Hint: Confirm ASAAS_URL is correct — endpoint is /v3/notifications/webhook."
    ;;
  422)
    echo "Hint: Check the WEBHOOK_URL is reachable from the internet (Asaas validates the URL)."
    ;;
esac

exit 1
