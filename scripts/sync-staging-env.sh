#!/usr/bin/env bash
# sync-staging-env.sh
#
# Fetches live AWS staging configuration and syncs local .env files so
# developers don't need to look up infrastructure values manually.
#
# Files updated:
#   api/.env                      — adds/updates [Staging connection] block
#   validation-workbench/.env     — writes VITE_* vars consumed by the workbench
#
# Prerequisites:
#   - AWS CLI configured with credentials that can read CloudFormation + Lambda
#   - python3 available (macOS built-in is fine)
#
# Usage:
#   ./scripts/sync-staging-env.sh [--region us-east-1] [--stack payments-api-staging]
#
# No secrets are fetched from AWS (NoEcho params are never returned).
# The API token is read from the existing api/.env comment or a CLI argument.

set -euo pipefail

# ── Defaults ──────────────────────────────────────────────────────────────────
REGION="us-east-1"
LAMBDA_STACK="payments-api-staging"
FUNCTION_NAME="staging-payments-api"
LOCAL_API_URL="http://localhost:3011"
LOCAL_API_TOKEN="local-dev-token-insecure-do-not-use-in-prod"

# ── Colours ───────────────────────────────────────────────────────────────────
BOLD='\033[1m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'
DIM='\033[2m'; RESET='\033[0m'

step()  { echo -e "\n${CYAN}▶${RESET} ${BOLD}$*${RESET}"; }
ok()    { echo -e "  ${GREEN}✓${RESET} $*"; }
note()  { echo -e "  ${YELLOW}!${RESET} $*"; }
dim()   { echo -e "  ${DIM}$*${RESET}"; }

# ── Argument parsing ──────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --region)  REGION="$2";       shift 2 ;;
    --stack)   LAMBDA_STACK="$2"; shift 2 ;;
    --token)   CLI_API_TOKEN="$2"; shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

# ── Locate repo root ──────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
API_ENV="$REPO_ROOT/api/.env"
WORKBENCH_ENV="$REPO_ROOT/validation-workbench/.env"

echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  sync-staging-env — payments-api"
echo -e "  Stack  : ${LAMBDA_STACK}  (${REGION})"
echo -e "  Lambda : ${FUNCTION_NAME}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"

# ── Helper: upsert a KEY=VALUE into a .env file ───────────────────────────────
# Replaces the line if key exists (commented or not); appends if absent.
upsert_env() {
  local key="$1" value="$2" file="$3"
  python3 - "$key" "$value" "$file" <<'PYEOF'
import sys, re, os

key, value, filepath = sys.argv[1], sys.argv[2], sys.argv[3]

os.makedirs(os.path.dirname(filepath) if os.path.dirname(filepath) else '.', exist_ok=True)

try:
    with open(filepath) as fh:
        content = fh.read()
except FileNotFoundError:
    content = ''

pattern = rf'^(?:#\s*)?{re.escape(key)}\s*=.*$'
replacement = f'{key}={value}'

if re.search(pattern, content, re.MULTILINE):
    content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
else:
    if content and not content.endswith('\n'):
        content += '\n'
    content += f'{key}={value}\n'

with open(filepath, 'w') as fh:
    fh.write(content)
PYEOF
}

# ── Helper: read a value from a .env file (commented or not) ─────────────────
read_env() {
  local key="$1" file="$2"
  grep -E "^#?\s*${key}=" "$file" 2>/dev/null \
    | tail -1 \
    | sed -E 's/^#\s*//' \
    | cut -d= -f2- \
    | tr -d '"'\''[:space:]'
}

# ── 1. Verify AWS access ──────────────────────────────────────────────────────
step "Verificando acesso à AWS..."

if ! aws sts get-caller-identity --region "$REGION" &>/dev/null; then
  echo "  ✗ Sem credenciais AWS configuradas."
  echo "    Configure via: aws configure  ou  export AWS_PROFILE=<profile>"
  exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ok "Account: ${ACCOUNT_ID} | Region: ${REGION}"

# ── 2. Fetch CloudFormation outputs ──────────────────────────────────────────
step "Buscando outputs do CloudFormation (${LAMBDA_STACK})..."

CF_OUTPUTS=$(aws cloudformation describe-stacks \
  --region "$REGION" \
  --stack-name "$LAMBDA_STACK" \
  --query "Stacks[0].Outputs" \
  --output json 2>/dev/null) || {
  echo "  ✗ Stack '${LAMBDA_STACK}' não encontrada na região ${REGION}."
  echo "    Verifique se o deploy já foi executado: gh run list --repo produtoreativo/payments-api"
  exit 1
}

API_URL=$(echo "$CF_OUTPUTS" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); \
    print(next((o['OutputValue'].rstrip('/') for o in d if o['OutputKey']=='ApiFunctionUrl'), ''))")

WEBHOOK_QUEUE_URL=$(echo "$CF_OUTPUTS" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); \
    print(next((o['OutputValue'] for o in d if o['OutputKey']=='WebhookQueueUrl'), ''))")

WEBHOOK_DLQ_URL=$(echo "$CF_OUTPUTS" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); \
    print(next((o['OutputValue'] for o in d if o['OutputKey']=='WebhookDeadLetterQueueUrl'), ''))")

[[ -z "$API_URL" ]] && { echo "  ✗ ApiFunctionUrl não encontrada no stack."; exit 1; }

ok "API URL            : ${API_URL}"
ok "Webhook Queue URL  : ${WEBHOOK_QUEUE_URL}"
ok "Webhook DLQ URL    : ${WEBHOOK_DLQ_URL}"

# ── 3. Fetch non-secret Lambda env vars ───────────────────────────────────────
step "Buscando variáveis de ambiente da Lambda (${FUNCTION_NAME})..."

LAMBDA_ENV=$(aws lambda get-function-configuration \
  --function-name "$FUNCTION_NAME" \
  --region "$REGION" \
  --query "Environment.Variables" \
  --output json 2>/dev/null) || {
  echo "  ✗ Função Lambda '${FUNCTION_NAME}' não encontrada."
  exit 1
}

ASAAS_URL=$(echo "$LAMBDA_ENV" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('ASAAS_URL',''))")
ASAAS_MOCK=$(echo "$LAMBDA_ENV" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('ASAAS_MOCK','false'))")
WEBHOOK_PROCESSING_MODE=$(echo "$LAMBDA_ENV" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('WEBHOOK_PROCESSING_MODE','async'))")
ENVIRONMENT_NAME=$(echo "$LAMBDA_ENV" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('DD_ENV','staging'))")

ok "EnvironmentName    : ${ENVIRONMENT_NAME}"
ok "AsaasMock          : ${ASAAS_MOCK}"
ok "WebhookMode        : ${WEBHOOK_PROCESSING_MODE}"

# ── 4. Resolve API token ──────────────────────────────────────────────────────
step "Resolvendo API token de staging..."

# Priority: --token arg > api/.env STAGING_API_TOKEN > empty
if [[ -n "${CLI_API_TOKEN:-}" ]]; then
  STAGING_API_TOKEN="$CLI_API_TOKEN"
  ok "Token: fornecido via argumento --token"
elif [[ -f "$API_ENV" ]]; then
  STAGING_API_TOKEN=$(read_env "STAGING_API_TOKEN" "$API_ENV")
  if [[ -n "$STAGING_API_TOKEN" ]]; then
    ok "Token: lido de api/.env (STAGING_API_TOKEN)"
  else
    note "Token não encontrado em api/.env — deixando VITE_STAGING_API_TOKEN vazio."
    note "Para preencher: ./scripts/sync-staging-env.sh --token <seu-token>"
    STAGING_API_TOKEN=""
  fi
else
  STAGING_API_TOKEN=""
  note "api/.env não existe — VITE_STAGING_API_TOKEN será vazio."
fi

# ── 5. Update api/.env ────────────────────────────────────────────────────────
step "Atualizando api/.env..."

if [[ ! -f "$API_ENV" ]]; then
  note "api/.env não existe — criando."
  touch "$API_ENV"
fi

# Ensure a staging section header exists (idempotent)
if ! grep -q "Staging AWS connection" "$API_ENV" 2>/dev/null; then
  printf '\n# ---------------------------------------------------------------------------\n# Staging AWS connection — gerado por scripts/sync-staging-env.sh\n# ---------------------------------------------------------------------------\n' >> "$API_ENV"
fi

upsert_env "STAGING_API_URL"           "$API_URL"                "$API_ENV"
upsert_env "STAGING_WEBHOOK_QUEUE_URL" "$WEBHOOK_QUEUE_URL"      "$API_ENV"
upsert_env "STAGING_WEBHOOK_DLQ_URL"   "$WEBHOOK_DLQ_URL"        "$API_ENV"

if [[ -n "$STAGING_API_TOKEN" ]]; then
  upsert_env "STAGING_API_TOKEN" "$STAGING_API_TOKEN" "$API_ENV"
fi

ok "api/.env atualizado"

# ── 6. Write validation-workbench/.env ───────────────────────────────────────
step "Escrevendo validation-workbench/.env..."

WORKBENCH_CONTENT="# validation-workbench — gerado por scripts/sync-staging-env.sh
# Regenere com: ./scripts/sync-staging-env.sh

# ── Staging AWS ──────────────────────────────────────────────────────────────
VITE_STAGING_API_URL=${API_URL}
VITE_STAGING_API_TOKEN=${STAGING_API_TOKEN}
VITE_STAGING_REGION=${REGION}
VITE_STAGING_WEBHOOK_QUEUE_URL=${WEBHOOK_QUEUE_URL}
VITE_STAGING_WEBHOOK_DLQ_URL=${WEBHOOK_DLQ_URL}
VITE_STAGING_ENVIRONMENT=${ENVIRONMENT_NAME}

# ── Local dev ────────────────────────────────────────────────────────────────
VITE_LOCAL_API_URL=${LOCAL_API_URL}
VITE_LOCAL_API_TOKEN=${LOCAL_API_TOKEN}
"

printf '%s' "$WORKBENCH_CONTENT" > "$WORKBENCH_ENV"
ok "validation-workbench/.env escrito"

# ── 7. Summary ────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  ${GREEN}${BOLD}Concluído${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "  ${BOLD}api/.env${RESET} (vars adicionadas/atualizadas):"
dim "    STAGING_API_URL           = ${API_URL}"
dim "    STAGING_WEBHOOK_QUEUE_URL = ${WEBHOOK_QUEUE_URL:-<não disponível>}"
dim "    STAGING_WEBHOOK_DLQ_URL   = ${WEBHOOK_DLQ_URL:-<não disponível>}"
[[ -n "$STAGING_API_TOKEN" ]] \
  && dim "    STAGING_API_TOKEN         = ${STAGING_API_TOKEN:0:10}...[REDACTED]" \
  || dim "    STAGING_API_TOKEN         = (vazio — passe --token <valor>)"
echo ""
echo -e "  ${BOLD}validation-workbench/.env${RESET} (arquivo completo reescrito):"
dim "    VITE_STAGING_API_URL"
dim "    VITE_STAGING_API_TOKEN"
dim "    VITE_LOCAL_API_URL"
dim "    VITE_LOCAL_API_TOKEN"
echo ""
echo -e "  Próximos passos:"
dim "    cd validation-workbench && npm run dev"
echo ""
