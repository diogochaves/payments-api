#!/usr/bin/env bash
# setup-github-secrets.sh
#
# Sets GitHub repository secrets required for the staging-deploy pipeline.
# Reads values from environment variables so nothing sensitive is stored
# in shell history or command output.
#
# Usage:
#   export AWS_DEPLOY_ROLE_ARN="arn:aws:iam::123456789:role/payments-api-github-deploy"
#   export STAGING_ASAAS_TOKEN="your_asaas_sandbox_key"
#   export STAGING_ASAAS_WEBHOOK_TOKEN="your_asaas_webhook_token"
#   export STAGING_API_TOKENS='[{"token":"tok_x","tokenId":"checkout","tenantId":"my-tenant","revoked":false}]'
#
#   ./scripts/setup-github-secrets.sh <github-org>/<github-repo>
#
# Prerequisites:
#   - GitHub CLI (gh) installed and authenticated: gh auth login

set -euo pipefail

REPO="${1:?Missing argument: <github-org>/<github-repo>  e.g. my-org/payments-api}"

# ── Required secrets ──────────────────────────────────────────────────────────

declare -A REQUIRED_SECRETS=(
  [AWS_DEPLOY_ROLE_ARN]="IAM Role ARN for GitHub OIDC authentication"
  [STAGING_ASAAS_TOKEN]="Asaas API key (sandbox) used by the staging environment"
  [STAGING_ASAAS_WEBHOOK_TOKEN]="Asaas webhook validation token for staging"
  [STAGING_API_TOKENS]="JSON array of API tokens for staging"
)

# ── Validate gh CLI is available and authenticated ────────────────────────────
if ! command -v gh &>/dev/null; then
  echo "ERROR: GitHub CLI (gh) is not installed."
  echo "Install it at: https://cli.github.com"
  exit 1
fi

if ! gh auth status &>/dev/null; then
  echo "ERROR: GitHub CLI is not authenticated. Run: gh auth login"
  exit 1
fi

echo "==> Repository: ${REPO}"
echo ""

# ── Verify repo exists and user has access ────────────────────────────────────
if ! gh repo view "$REPO" &>/dev/null; then
  echo "ERROR: Repository ${REPO} not found or access denied."
  exit 1
fi

# ── Set each secret ───────────────────────────────────────────────────────────
MISSING=()

for SECRET_NAME in "${!REQUIRED_SECRETS[@]}"; do
  DESCRIPTION="${REQUIRED_SECRETS[$SECRET_NAME]}"
  VALUE="${!SECRET_NAME:-}"

  if [[ -z "$VALUE" ]]; then
    MISSING+=("$SECRET_NAME — ${DESCRIPTION}")
    continue
  fi

  echo "==> Setting ${SECRET_NAME}..."
  echo -n "$VALUE" | gh secret set "$SECRET_NAME" --repo "$REPO" --body -
  echo "    ✓"
done

# ── Report missing secrets ────────────────────────────────────────────────────
if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo ""
  echo "WARNING: The following secrets were NOT set (env var was empty):"
  for item in "${MISSING[@]}"; do
    echo "  - ${item}"
  done
  echo ""
  echo "Export each missing variable and re-run the script."
  exit 1
fi

# ── Create GitHub Environment for staging ────────────────────────────────────
echo ""
echo "==> Creating GitHub environment 'staging'..."
gh api \
  --method PUT \
  "/repos/${REPO}/environments/staging" \
  --field wait_timer=0 \
  --silent && echo "    ✓ Environment 'staging' ready."

echo ""
echo "✓ All secrets set. Next steps:"
echo ""
echo "  1. Push to main branch to trigger the staging-deploy pipeline."
echo "  2. Monitor the workflow: https://github.com/${REPO}/actions"
echo "  3. After first deploy, find the API URL in the workflow summary."
