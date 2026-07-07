#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${ENV_FILE:-${API_DIR}/.env}"
PORT="${PORT:-3011}"
TUNNEL_PROVIDER="${TUNNEL_PROVIDER:-auto}"
TUNNEL_LOG="${TUNNEL_LOG:-/tmp/payments-api-asaas-tunnel.log}"
TUNNEL_PID=""
WORKER_PID=""
LOCALSTACK_CONTAINER_STARTED="false"
LOCALSTACK_ENDPOINT="${LOCALSTACK_ENDPOINT:-http://localhost.localstack.cloud:4566}"
USE_LOCALSTACK_WEBHOOK_QUEUE="${USE_LOCALSTACK_WEBHOOK_QUEUE:-true}"
WEBHOOK_QUEUE_NAME="${WEBHOOK_QUEUE_NAME:-payments-webhook-queue}"
WEBHOOK_DLQ_NAME="${WEBHOOK_DLQ_NAME:-payments-webhook-dlq}"
ASAAS_WEBHOOK_EVENTS_DEFAULT="PAYMENT_CONFIRMED,PAYMENT_RECEIVED,PAYMENT_CREDIT_CARD_CAPTURE_REFUSED,PAYMENT_REFUNDED,PAYMENT_DELETED"

cleanup() {
  if [[ -n "${TUNNEL_PID}" ]] && kill -0 "${TUNNEL_PID}" >/dev/null 2>&1; then
    kill "${TUNNEL_PID}" >/dev/null 2>&1 || true
  fi
  if [[ -n "${WORKER_PID}" ]] && kill -0 "${WORKER_PID}" >/dev/null 2>&1; then
    kill "${WORKER_PID}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

load_env_file() {
  [[ -f "${ENV_FILE}" ]] || return 0

  while IFS= read -r line || [[ -n "${line}" ]]; do
    line="${line#"${line%%[![:space:]]*}"}"
    line="${line%"${line##*[![:space:]]}"}"

    [[ -z "${line}" || "${line}" == \#* ]] && continue
    [[ "${line}" == *"="* ]] || continue

    local key="${line%%=*}"
    local value="${line#*=}"

    key="${key#"${key%%[![:space:]]*}"}"
    key="${key%"${key##*[![:space:]]}"}"
    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"

    if [[ "${value}" == \"*\" && "${value}" == *\" ]]; then
      value="${value:1:${#value}-2}"
    elif [[ "${value}" == \'*\' && "${value}" == *\' ]]; then
      value="${value:1:${#value}-2}"
    fi

    if [[ "${key}" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
      export "${key}=${value}"
    fi
  done <"${ENV_FILE}"
}

require_command() {
  local command_name="$1"
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "Missing required command: ${command_name}" >&2
    exit 1
  fi
}

enable_node_toolchain() {
  if command -v npm >/dev/null 2>&1 && command -v node >/dev/null 2>&1; then
    return 0
  fi

  if [[ -s "${HOME}/.nvm/nvm.sh" ]]; then
    # shellcheck source=/dev/null
    . "${HOME}/.nvm/nvm.sh"
    nvm use >/dev/null 2>&1 || nvm use --lts >/dev/null 2>&1 || true
  fi
}

localstack_is_ready() {
  curl -fsS "${LOCALSTACK_ENDPOINT}/_localstack/health" >/dev/null 2>&1
}

start_localstack_if_needed() {
  if localstack_is_ready; then
    return 0
  fi

  require_command docker

  if docker ps --format '{{.Names}}' | grep -qx 'payments-api-localstack'; then
    echo "Waiting for existing LocalStack container payments-api-localstack..."
  elif docker ps -a --format '{{.Names}}' | grep -qx 'payments-api-localstack'; then
    echo "Starting existing LocalStack container payments-api-localstack..."
    docker start payments-api-localstack >/dev/null
    LOCALSTACK_CONTAINER_STARTED="true"
  else
    echo "Starting LocalStack container payments-api-localstack..."
    docker run -d \
      --name payments-api-localstack \
      -p 4566:4566 \
      -e SERVICES=dynamodb,sqs,cloudformation \
      -e DEBUG=0 \
      localstack/localstack:latest >/dev/null
    LOCALSTACK_CONTAINER_STARTED="true"
  fi

  for _ in {1..60}; do
    if localstack_is_ready; then
      return 0
    fi
    sleep 1
  done

  echo "LocalStack did not become ready at ${LOCALSTACK_ENDPOINT}." >&2
  exit 1
}

aws_local() {
  aws --endpoint-url "${LOCALSTACK_ENDPOINT}" "$@"
}

deploy_dynamodb_local() {
  echo "Ensuring DynamoDB tables exist in LocalStack..."
  (
    cd "${API_DIR}"
    AWS_ENDPOINT_URL="${LOCALSTACK_ENDPOINT}" ./scripts/deploy-dynamodb-local.sh
  )

  # Derive the environment prefix from the CloudFormation stack (default: dev)
  local env_prefix
  env_prefix="$(
    aws_local cloudformation describe-stack-resource \
      --stack-name payments-gateway-dynamodb \
      --logical-resource-id PaymentsTable \
      --query 'StackResourceDetail.PhysicalResourceId' \
      --output text 2>/dev/null | sed 's/-PaymentsTable$//' || echo "dev"
  )"

  for base in PaymentsTable TransactionsTable CustomersTable TenantsTable ProvidersTable; do
    local table="${env_prefix}-${base}"
    local table_ready="false"
    for _ in {1..30}; do
      if aws_local dynamodb describe-table --table-name "${table}" >/dev/null 2>&1; then
        table_ready="true"
        break
      fi
      sleep 1
    done
    if [[ "${table_ready}" != "true" ]]; then
      echo "DynamoDB table ${table} was not found in LocalStack after deploy." >&2
      exit 1
    fi
  done
}

configure_local_sqs() {
  local dlq_url
  local dlq_arn
  local redrive_policy
  local queue_attributes

  echo "Ensuring SQS webhook queues exist in LocalStack..."

  dlq_url="$(
    aws_local sqs create-queue \
      --queue-name "${WEBHOOK_DLQ_NAME}" \
      --attributes MessageRetentionPeriod=1209600 \
      --query QueueUrl \
      --output text
  )"
  dlq_arn="$(
    aws_local sqs get-queue-attributes \
      --queue-url "${dlq_url}" \
      --attribute-names QueueArn \
      --query 'Attributes.QueueArn' \
      --output text
  )"
  redrive_policy="$(
    jq -cn --arg deadLetterTargetArn "${dlq_arn}" \
      '{deadLetterTargetArn: $deadLetterTargetArn, maxReceiveCount: "5"}'
  )"
  queue_attributes="$(
    jq -cn --arg redrivePolicy "${redrive_policy}" \
      '{
        VisibilityTimeout: "60",
        MessageRetentionPeriod: "1209600",
        RedrivePolicy: $redrivePolicy
      }'
  )"

  export WEBHOOK_DLQ_URL="${dlq_url}"
  export WEBHOOK_QUEUE_URL="$(
    aws_local sqs create-queue \
      --queue-name "${WEBHOOK_QUEUE_NAME}" \
      --attributes "${queue_attributes}" \
      --query QueueUrl \
      --output text
  )"
}

start_local_webhook_worker() {
  echo "Starting local webhook worker for SQS..."
  node "${API_DIR}/scripts/run-local-webhook-worker.js" &
  WORKER_PID="$!"
}

require_asaas_token() {
  if [[ -z "${ASAAS_TOKEN:-}" || "${ASAAS_TOKEN}" == "your_asaas_sandbox_token_here" ]]; then
    cat >&2 <<'EOF'
ASAAS_TOKEN is required to test the real Asaas Sandbox.

Set it in api/.env or export it before running:

  export ASAAS_TOKEN="$aact_hmlg_..."

Generate this key in the Asaas Sandbox environment, not Production.
EOF
    exit 1
  fi
}

validate_webhook_token() {
  if [[ "${#ASAAS_WEBHOOK_TOKEN}" -lt 32 || "${ASAAS_WEBHOOK_TOKEN}" =~ [[:space:]] ]]; then
    cat >&2 <<'EOF'
ASAAS_WEBHOOK_TOKEN must follow Asaas webhook authToken requirements:

  - between 32 and 255 characters
  - no blank spaces
  - must not be the Asaas API key

Set it in api/.env, for example:

  ASAAS_WEBHOOK_TOKEN='payments-api-local-webhook-token-0001'
EOF
    exit 1
  fi
}

asaas_api() {
  local method="$1"
  local path="$2"
  local payload="${3:-}"
  local response_file="$4"
  local status

  if [[ -n "${payload}" ]]; then
    status="$(curl -sS -o "${response_file}" -w '%{http_code}' \
      --request "${method}" \
      --url "${ASAAS_URL%/}${path}" \
      --header 'accept: application/json' \
      --header "access_token: ${ASAAS_TOKEN}" \
      --header 'content-type: application/json' \
      --data "${payload}")"
  else
    status="$(curl -sS -o "${response_file}" -w '%{http_code}' \
      --request "${method}" \
      --url "${ASAAS_URL%/}${path}" \
      --header 'accept: application/json' \
      --header "access_token: ${ASAAS_TOKEN}")"
  fi

  echo "${status}"
}

webhook_payload() {
  local webhook_url="$1"
  local events_csv="${ASAAS_WEBHOOK_EVENTS:-${ASAAS_WEBHOOK_EVENTS_DEFAULT}}"

  jq -n \
    --arg name "${ASAAS_WEBHOOK_NAME}" \
    --arg url "${webhook_url}" \
    --arg email "${ASAAS_WEBHOOK_EMAIL}" \
    --arg authToken "${ASAAS_WEBHOOK_TOKEN}" \
    --arg sendType "${ASAAS_WEBHOOK_SEND_TYPE}" \
    --arg eventsCsv "${events_csv}" \
    '{
      name: $name,
      url: $url,
      email: $email,
      enabled: true,
      interrupted: false,
      authToken: $authToken,
      sendType: $sendType,
      events: ($eventsCsv | split(",") | map(gsub("^\\s+|\\s+$"; "")) | map(select(length > 0)))
    }'
}

find_webhook_id_by_name() {
  local response_file
  local status

  response_file="$(mktemp)"
  status="$(asaas_api GET '/webhooks' '' "${response_file}")"

  if [[ "${status}" != 2* ]]; then
    echo "Unable to list Asaas webhooks. HTTP ${status}" >&2
    cat "${response_file}" >&2
    rm -f "${response_file}"
    return 1
  fi

  jq -r --arg name "${ASAAS_WEBHOOK_NAME}" '.data[]? | select(.name == $name) | .id' "${response_file}" | head -n 1
  rm -f "${response_file}"
}

configure_asaas_webhook() {
  local public_base_url="$1"
  local webhook_url="${public_base_url%/}/webhook/payments"
  local webhook_id="${ASAAS_WEBHOOK_ID:-}"
  local payload
  local response_file
  local status

  if [[ "${ASAAS_CONFIGURE_WEBHOOK:-true}" != "true" ]]; then
    echo "Skipping Asaas webhook configuration because ASAAS_CONFIGURE_WEBHOOK=${ASAAS_CONFIGURE_WEBHOOK}."
    return 0
  fi

  require_command curl
  require_command jq
  validate_webhook_token

  payload="$(webhook_payload "${webhook_url}")"

  if [[ -z "${webhook_id}" ]]; then
    webhook_id="$(find_webhook_id_by_name || true)"
  fi

  response_file="$(mktemp)"

  if [[ -n "${webhook_id}" ]]; then
    echo "Updating Asaas Sandbox webhook ${webhook_id}..."
    status="$(asaas_api PUT "/webhooks/${webhook_id}" "${payload}" "${response_file}")"
  else
    echo "Creating Asaas Sandbox webhook..."
    status="$(asaas_api POST '/webhooks' "${payload}" "${response_file}")"
  fi

  if [[ "${status}" != 2* ]]; then
    echo "Failed to configure Asaas webhook. HTTP ${status}" >&2
    cat "${response_file}" >&2
    rm -f "${response_file}"
    exit 1
  fi

  webhook_id="$(jq -r '.id // empty' "${response_file}")"
  echo "Asaas Sandbox webhook configured:"
  echo "  id: ${webhook_id:-unknown}"
  echo "  name: ${ASAAS_WEBHOOK_NAME}"
  echo "  url: ${webhook_url}"
  rm -f "${response_file}"
}

start_ngrok() {
  require_command ngrok
  require_command jq

  : >"${TUNNEL_LOG}"
  ngrok http "${PORT}" --log=stdout >"${TUNNEL_LOG}" 2>&1 &
  TUNNEL_PID="$!"

  for _ in {1..30}; do
    local public_url
    public_url="$(curl -fsS http://127.0.0.1:4040/api/tunnels 2>/dev/null | jq -r '.tunnels[]? | select(.proto == "https") | .public_url' | head -n 1 || true)"
    if [[ -n "${public_url}" && "${public_url}" != "null" ]]; then
      echo "${public_url}"
      return 0
    fi
    sleep 1
  done

  echo "ngrok started, but the public URL was not discovered. Check ${TUNNEL_LOG}" >&2
  return 1
}

start_cloudflared() {
  require_command cloudflared

  : >"${TUNNEL_LOG}"
  cloudflared tunnel --url "http://localhost:${PORT}" --no-autoupdate >"${TUNNEL_LOG}" 2>&1 &
  TUNNEL_PID="$!"

  for _ in {1..45}; do
    local public_url
    public_url="$(grep -Eo 'https://[-a-zA-Z0-9.]+trycloudflare.com' "${TUNNEL_LOG}" | head -n 1 || true)"
    if [[ -n "${public_url}" ]]; then
      echo "${public_url}"
      return 0
    fi
    sleep 1
  done

  echo "cloudflared started, but the public URL was not discovered. Check ${TUNNEL_LOG}" >&2
  return 1
}

start_tunnel() {
  if [[ -n "${PUBLIC_WEBHOOK_BASE_URL:-}" ]]; then
    echo "${PUBLIC_WEBHOOK_BASE_URL%/}"
    return 0
  fi

  case "${TUNNEL_PROVIDER}" in
    none)
      return 1
      ;;
    ngrok)
      start_ngrok
      ;;
    cloudflared)
      start_cloudflared
      ;;
    auto)
      if command -v cloudflared >/dev/null 2>&1; then
        start_cloudflared
      elif command -v ngrok >/dev/null 2>&1; then
        start_ngrok
      else
        return 1
      fi
      ;;
    *)
      echo "Unsupported TUNNEL_PROVIDER=${TUNNEL_PROVIDER}. Use auto, ngrok, cloudflared or none." >&2
      exit 1
      ;;
  esac
}

load_env_file
enable_node_toolchain
require_command npm
require_command node
require_asaas_token
require_command curl
require_command jq

if [[ "${USE_LOCALSTACK_WEBHOOK_QUEUE}" == "true" ]]; then
  require_command aws
fi

cd "${API_DIR}"

if [[ ! -d node_modules ]]; then
  echo "Installing API dependencies with npm ci..."
  npm ci
fi

export PORT
export NODE_ENV="${NODE_ENV:-development}"
export LOG_LEVEL="${LOG_LEVEL:-info}"
export ASAAS_MOCK="false"
export ASAAS_URL="${ASAAS_URL:-https://api-sandbox.asaas.com/v3}"
ASAAS_URL="${ASAAS_URL%/}"
if [[ "${ASAAS_URL}" != */v3 ]]; then
  ASAAS_URL="${ASAAS_URL}/v3"
fi
export ASAAS_URL
export ASAAS_USER_AGENT="${ASAAS_USER_AGENT:-payments-api-local-asaas-sandbox}"
export ASAAS_WEBHOOK_TOKEN="${ASAAS_WEBHOOK_TOKEN:-payments-api-local-webhook-token-0001}"
export ASAAS_WEBHOOK_NAME="${ASAAS_WEBHOOK_NAME:-Payments API Local Sandbox}"
export ASAAS_WEBHOOK_EMAIL="${ASAAS_WEBHOOK_EMAIL:-sandbox-webhook@example.com}"
export ASAAS_WEBHOOK_SEND_TYPE="${ASAAS_WEBHOOK_SEND_TYPE:-SEQUENTIALLY}"
export ENABLED_PAYMENT_PROVIDERS="${ENABLED_PAYMENT_PROVIDERS:-ASAAS}"
export DEFAULT_PAYMENT_PROVIDER="${DEFAULT_PAYMENT_PROVIDER:-ASAAS}"
if [[ "${USE_LOCALSTACK_WEBHOOK_QUEUE}" == "true" ]]; then
  export ASAAS_SANDBOX_STORAGE="${ASAAS_SANDBOX_STORAGE:-dynamo}"
else
  export ASAAS_SANDBOX_STORAGE="${ASAAS_SANDBOX_STORAGE:-memory}"
fi

export AWS_REGION="${AWS_REGION:-us-east-1}"
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-${AWS_REGION}}"
export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test}"
export AWS_PAGER=""

case "${ASAAS_SANDBOX_STORAGE}" in
  memory)
    export INVOICE_REPOSITORY="memory"
    export DYNAMO_MOCK="true"
    ;;
  dynamo)
    export INVOICE_REPOSITORY="dynamo"
    export DYNAMO_MOCK="false"
    export AWS_DYNAMODB_ENDPOINT="${AWS_DYNAMODB_ENDPOINT:-${LOCALSTACK_ENDPOINT}}"
    ;;
  *)
    echo "Unsupported ASAAS_SANDBOX_STORAGE=${ASAAS_SANDBOX_STORAGE}. Use memory or dynamo." >&2
    exit 1
    ;;
esac

if [[ "${USE_LOCALSTACK_WEBHOOK_QUEUE}" == "true" ]]; then
  export AWS_SQS_ENDPOINT="${LOCALSTACK_ENDPOINT}"
  export AWS_ENDPOINT_URL="${AWS_ENDPOINT_URL:-${LOCALSTACK_ENDPOINT}}"
  export WEBHOOK_PROCESSING_MODE="async"
  start_localstack_if_needed
  deploy_dynamodb_local
  configure_local_sqs
  start_local_webhook_worker
else
  export WEBHOOK_PROCESSING_MODE="${WEBHOOK_PROCESSING_MODE:-sync}"
fi

export DD_TRACE_ENABLED="${DD_TRACE_ENABLED:-false}"
export DD_LOGS_INJECTION="${DD_LOGS_INJECTION:-false}"
export DD_RUNTIME_METRICS_ENABLED="${DD_RUNTIME_METRICS_ENABLED:-false}"

PUBLIC_URL=""
if PUBLIC_URL="$(start_tunnel 2>/dev/null)"; then
  export PUBLIC_WEBHOOK_BASE_URL="${PUBLIC_URL%/}"
fi

if [[ -n "${PUBLIC_URL}" ]]; then
  configure_asaas_webhook "${PUBLIC_URL%/}"
fi

echo
echo "Payments API - real Asaas Sandbox"
echo "API local: http://localhost:${PORT}"
echo "Asaas URL: ${ASAAS_URL}"
echo "Asaas mock: ${ASAAS_MOCK}"
echo "Repository: ${INVOICE_REPOSITORY}"
echo "Webhook processing: ${WEBHOOK_PROCESSING_MODE}"
if [[ "${WEBHOOK_PROCESSING_MODE}" == "async" ]]; then
  echo "LocalStack endpoint: ${LOCALSTACK_ENDPOINT}"
  echo "DynamoDB endpoint: ${AWS_DYNAMODB_ENDPOINT:-not configured}"
  echo "SQS endpoint: ${AWS_SQS_ENDPOINT:-not configured}"
  echo "Webhook queue URL: ${WEBHOOK_QUEUE_URL:-not configured}"
  echo "Webhook DLQ URL: ${WEBHOOK_DLQ_URL:-not configured}"
  echo "Local webhook worker PID: ${WORKER_PID:-not started}"
fi
echo "Webhook token header expected by API:"
echo "  asaas-access-token: ${ASAAS_WEBHOOK_TOKEN}"

if [[ -n "${PUBLIC_URL}" ]]; then
  echo
  echo "Public webhook URL for Asaas Sandbox:"
  echo "  ${PUBLIC_URL%/}/webhook/payments"
  echo
  echo "Configure this URL in Asaas Sandbox webhooks for payment events."
else
  echo
  echo "No public tunnel was started."
  echo "Install ngrok/cloudflared, set PUBLIC_WEBHOOK_BASE_URL, or configure TUNNEL_PROVIDER."
  echo "Asaas cannot call http://localhost:${PORT}/webhook/payments directly."
fi

echo
echo "Create a real Sandbox invoice in another terminal with:"
echo "  (cd api && ./scripts/create-invoice-sandbox.sh)"
echo

npm run start
