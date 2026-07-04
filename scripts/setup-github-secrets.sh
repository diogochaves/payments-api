#!/usr/bin/env bash
# setup-github-secrets.sh
#
# Sets GitHub repository and environment secrets required for the
# staging-deploy pipeline. Reads values from environment variables so nothing
# sensitive is stored in shell history or command output.
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
#
# Secret placement:
#   - AWS_DEPLOY_ROLE_ARN      → repo level (needed by smoke-test, which has no environment)
#   - STAGING_ASAAS_TOKEN      → staging environment (only accessible to deploy-staging job)
#   - STAGING_ASAAS_WEBHOOK_TOKEN → staging environment
#   - STAGING_API_TOKENS       → staging environment

set -euo pipefail

REPO="${1:?Missing argument: <github-org>/<github-repo>  e.g. my-org/payments-api}"

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

# ── Check all required vars are set before touching GitHub ───────────────────
MISSING=()
[[ -z "${AWS_DEPLOY_ROLE_ARN:-}" ]]         && MISSING+=("AWS_DEPLOY_ROLE_ARN")
[[ -z "${STAGING_ASAAS_TOKEN:-}" ]]          && MISSING+=("STAGING_ASAAS_TOKEN")
[[ -z "${STAGING_ASAAS_WEBHOOK_TOKEN:-}" ]]  && MISSING+=("STAGING_ASAAS_WEBHOOK_TOKEN")
[[ -z "${STAGING_API_TOKENS:-}" ]]           && MISSING+=("STAGING_API_TOKENS")

if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo "ERROR: The following environment variables are not set:"
  for v in "${MISSING[@]}"; do
    echo "  export ${v}=\"...\""
  done
  echo ""
  echo "Export each variable and re-run the script."
  exit 1
fi

# ── Create GitHub environment for staging ────────────────────────────────────
echo "==> Creating GitHub environment 'staging'..."
gh api \
  --method PUT \
  "/repos/${REPO}/environments/staging" \
  --field wait_timer=0 \
  --silent
echo "    ✓ Environment 'staging' ready."
echo ""

# ── Repo-level secret: AWS_DEPLOY_ROLE_ARN ───────────────────────────────────
# Must be at repo level because smoke-test job has no environment and can only
# read repo-level secrets.
echo "==> Setting AWS_DEPLOY_ROLE_ARN (repo level)..."
printf '%s' "$AWS_DEPLOY_ROLE_ARN" | gh secret set AWS_DEPLOY_ROLE_ARN --repo "$REPO" --body -
echo "    ✓"

# ── Environment-level secrets: staging ───────────────────────────────────────
# Scoped to the staging environment — only accessible when a job uses
# `environment: staging`.
echo ""
echo "==> Setting staging environment secrets..."

printf '%s' "$STAGING_ASAAS_TOKEN" \
  | gh secret set STAGING_ASAAS_TOKEN --repo "$REPO" --env staging --body -
echo "    ✓ STAGING_ASAAS_TOKEN"

printf '%s' "$STAGING_ASAAS_WEBHOOK_TOKEN" \
  | gh secret set STAGING_ASAAS_WEBHOOK_TOKEN --repo "$REPO" --env staging --body -
echo "    ✓ STAGING_ASAAS_WEBHOOK_TOKEN"

printf '%s' "$STAGING_API_TOKENS" \
  | gh secret set STAGING_API_TOKENS --repo "$REPO" --env staging --body -
echo "    ✓ STAGING_API_TOKENS"

echo ""
echo "✓ All secrets configured. Summary:"
echo ""
echo "  Repo-level secrets (all jobs):"
echo "    AWS_DEPLOY_ROLE_ARN"
echo ""
echo "  Staging environment secrets (deploy-staging job only):"
echo "    STAGING_ASAAS_TOKEN"
echo "    STAGING_ASAAS_WEBHOOK_TOKEN"
echo "    STAGING_API_TOKENS"
echo ""
echo "Next steps:"
echo "  1. Push to main (or current branch) to trigger the staging-deploy pipeline."
echo "  2. Monitor: https://github.com/${REPO}/actions"
echo "  3. After first deploy, the API URL appears in the workflow summary."
