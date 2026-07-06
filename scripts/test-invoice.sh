#!/usr/bin/env bash
# test-invoice.sh — Cria e valida uma invoice na payments-api (staging ou local)
#
# Uso:
#   ./scripts/test-invoice.sh [staging|local]
#
# Se o argumento for omitido, o script pergunta interativamente.
#
# Variáveis de ambiente opcionais (sobrescrevem os defaults):
#   API_TOKEN      Token de autenticação (X-Api-Token header)
#   ORDER_ID       ID do pedido (default: gerado com timestamp)
#   BILLING_TYPE   PIX | BOLETO | CREDIT_CARD (default: PIX)

set -euo pipefail

# ── Cores ──────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

pass() { echo -e "${GREEN}✓ PASS${RESET} — $*"; }
fail() { echo -e "${RED}✗ FAIL${RESET} — $*"; FAILURES=$((FAILURES + 1)); }
info() { echo -e "${CYAN}→${RESET} $*"; }
header() { echo -e "\n${BOLD}${BLUE}══ $* ══${RESET}"; }

FAILURES=0

# ── Escolha de ambiente ────────────────────────────────────────────────────────
ENV="${1:-}"

if [[ -z "$ENV" ]]; then
  echo ""
  echo -e "${BOLD}Ambiente de teste:${RESET}"
  echo -e "  ${CYAN}1)${RESET} staging  — Lambda URL na AWS (requer token de staging)"
  echo -e "  ${CYAN}2)${RESET} local    — http://localhost:3011 (requer app rodando)"
  echo ""
  read -rp "Escolha [1/2] (default: 1): " CHOICE
  case "${CHOICE:-1}" in
    2) ENV=local ;;
    *) ENV=staging ;;
  esac
fi

case "$ENV" in
  staging)
    BASE_URL="https://oj2st2d44b7bseur6rcd3nl77y0wlqec.lambda-url.us-east-1.on.aws"
    DEFAULT_TOKEN="ed839e06f3702e21fcfc8a364062b4e4977ae93229872a9c5ec0314e34e89fac"
    ;;
  local)
    BASE_URL="http://localhost:3011"
    DEFAULT_TOKEN="local-dev-token-insecure-do-not-use-in-prod"
    ;;
  *)
    echo -e "${RED}Ambiente inválido: '$ENV'. Use 'staging' ou 'local'.${RESET}" >&2
    exit 1
    ;;
esac

API_TOKEN="${API_TOKEN:-$DEFAULT_TOKEN}"
BILLING_TYPE="${BILLING_TYPE:-PIX}"
ORDER_ID="${ORDER_ID:-TEST-$(date +%s)}"

echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  payments-api — Teste de criação de invoice"
echo -e "  Ambiente : ${YELLOW}${ENV}${RESET}"
echo -e "  URL base : ${BASE_URL}"
echo -e "  orderId  : ${ORDER_ID}"
echo -e "  billing  : ${BILLING_TYPE}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"

# ── Payload ────────────────────────────────────────────────────────────────────
DUE_DATE=$(date -v+3d '+%Y-%m-%d' 2>/dev/null || date -d '+3 days' '+%Y-%m-%d')

PAYLOAD=$(cat <<EOF
{
  "tenantId": "test-tenant",
  "orderId": "${ORDER_ID}",
  "customer": {
    "id": "customer-test-001",
    "name": "Maria Silva",
    "document": "12345678909",
    "email": "maria@example.com",
    "mobilePhone": "11987654321"
  },
  "amount": 159.90,
  "currency": "BRL",
  "dueDate": "${DUE_DATE}",
  "billingType": "${BILLING_TYPE}",
  "provider": "ASAAS",
  "description": "Pedido ${ORDER_ID} — teste automatizado"
}
EOF
)

# ── Teste 1: Sem token → deve retornar 401 ─────────────────────────────────────
header "1. Auth guard (sem token → 401)"
info "POST ${BASE_URL}/invoices (sem X-Api-Token)"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "${BASE_URL}/invoices" \
  -H "Content-Type: application/json" \
  -d '{}' \
  --max-time 15)

if [[ "$STATUS" == "401" ]]; then
  pass "Auth guard ativo — retornou 401"
else
  fail "Esperado 401, recebido ${STATUS}"
fi

# ── Teste 2: Token inválido → deve retornar 401 ────────────────────────────────
header "2. Auth guard (token inválido → 401)"
info "POST ${BASE_URL}/invoices (X-Api-Token: token-invalido)"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "${BASE_URL}/invoices" \
  -H "Content-Type: application/json" \
  -H "X-Api-Token: token-invalido" \
  -d '{}' \
  --max-time 15)

if [[ "$STATUS" == "401" ]]; then
  pass "Token inválido rejeitado — retornou 401"
else
  fail "Esperado 401, recebido ${STATUS}"
fi

# ── Teste 3: Criação de invoice ────────────────────────────────────────────────
header "3. Criar invoice (${BILLING_TYPE})"
info "POST ${BASE_URL}/invoices"
info "Payload: orderId=${ORDER_ID}, amount=159.90, dueDate=${DUE_DATE}"

TMPFILE=$(mktemp)
HTTP_STATUS=$(curl -s -o "$TMPFILE" -w "%{http_code}" \
  -X POST "${BASE_URL}/invoices" \
  -H "Content-Type: application/json" \
  -H "X-Api-Token: ${API_TOKEN}" \
  -d "$PAYLOAD" \
  --max-time 30)
BODY=$(cat "$TMPFILE")
rm -f "$TMPFILE"

echo ""
echo -e "${BOLD}HTTP Status:${RESET} ${HTTP_STATUS}"
echo -e "${BOLD}Response:${RESET}"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"

if [[ "$HTTP_STATUS" == "201" ]]; then
  pass "Invoice criada com status HTTP 201"

  # Validar campos obrigatórios na resposta
  echo ""
  info "Validando campos da resposta..."

  check_field() {
    local field="$1"
    local value
    value=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('$field',''))" 2>/dev/null || true)
    if [[ -n "$value" ]]; then
      pass "Campo '${field}' presente: ${value}"
    else
      fail "Campo obrigatório '${field}' ausente ou vazio"
    fi
  }

  check_field "id"
  check_field "status"
  check_field "orderId"
  check_field "amount"
  check_field "provider"
  check_field "providerPaymentId"
  check_field "paymentUrl"

  INVOICE_STATUS=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null || true)
  if [[ "$INVOICE_STATUS" == "OPEN" ]]; then
    pass "Status inicial correto: OPEN"
  else
    fail "Status esperado 'OPEN', recebido '${INVOICE_STATUS}'"
  fi

  INVOICE_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || true)

elif [[ "$HTTP_STATUS" == "400" ]]; then
  fail "Payload inválido (400) — verifique os campos obrigatórios"
elif [[ "$HTTP_STATUS" == "502" ]]; then
  fail "Lambda erro interno (502) — verifique os logs: aws logs tail /aws/lambda/staging-payments-api --region us-east-1 --since 5m"
elif [[ "$HTTP_STATUS" == "401" ]]; then
  fail "Não autorizado (401) — token inválido para o ambiente '${ENV}'"
  echo -e "${YELLOW}  Para staging: use o token STAGING_API_TOKEN do .env${RESET}"
  echo -e "${YELLOW}  Para local:   use API_TOKEN_LOCAL do .env${RESET}"
else
  fail "Resposta inesperada: HTTP ${HTTP_STATUS}"
fi

# ── Teste 4: Idempotência (mesmo orderId → deve rejeitar) ────────────────────
if [[ -n "${INVOICE_ID:-}" ]]; then
  header "4. Idempotência (mesmo orderId → conflito)"
  info "POST ${BASE_URL}/invoices (orderId repetido: ${ORDER_ID})"

  STATUS2=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "${BASE_URL}/invoices" \
    -H "Content-Type: application/json" \
    -H "X-Api-Token: ${API_TOKEN}" \
    -d "$PAYLOAD" \
    --max-time 15)

  if [[ "$STATUS2" == "409" || "$STATUS2" == "422" ]]; then
    pass "orderId duplicado rejeitado corretamente (HTTP ${STATUS2})"
  elif [[ "$STATUS2" == "201" ]]; then
    fail "Invoice duplicada aceita (HTTP 201) — idempotência não implementada"
  else
    info "Resposta para duplicata: HTTP ${STATUS2} (pode ser comportamento esperado)"
  fi
fi

# ── Resumo ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
if [[ $FAILURES -eq 0 ]]; then
  echo -e "  ${GREEN}${BOLD}TODOS OS TESTES PASSARAM${RESET}"
else
  echo -e "  ${RED}${BOLD}${FAILURES} TESTE(S) FALHARAM${RESET}"
fi
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

exit $FAILURES
