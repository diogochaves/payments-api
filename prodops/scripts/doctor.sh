#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

failures=0

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  failures=$((failures + 1))
}

pass() {
  printf 'PASS: %s\n' "$1"
}

check_path() {
  local path="$1"
  if [[ -e "${path}" ]]; then
    pass "exists ${path}"
  else
    fail "missing ${path}"
  fi
}

check_path "prodops/framework/canonical-paths.md"
check_path "prodops/artifacts/product"
check_path "prodops/artifacts/bdd"
check_path "prodops/artifacts/obcs"
check_path "prodops/artifacts/plans"
check_path "prodops/artifacts/trails/release-trail.md"
check_path "prodops/journeys/discovery/experiments"
check_path "prodops/journeys/assessment/reliability-plans"
check_path "prodops/journeys/assessment/risks.md"
check_path "prodops/journeys/operation"
check_path "prodops/journeys/delivery/phases/bootstrap/README.md"
check_path "prodops/journeys/delivery/phases/hack/README.md"
check_path "prodops/journeys/delivery/phases/finish/quality-gates.md"

# Verify key committed OBC artifacts exist for items with Entrou status
for obc in api-token-validation create-invoice-boleto webhook-configuration credit-card-authorization-confirmation; do
  check_path "prodops/artifacts/obcs/${obc}.md"
done

while IFS= read -r experiment_dir; do
  [[ -z "${experiment_dir}" ]] && continue
  check_path "${experiment_dir}/experiment.md"
  check_path "${experiment_dir}/upstream-trail.md"
done < <(find prodops/journeys/discovery/experiments -mindepth 1 -maxdepth 1 -type d | sort)

legacy_refs="$(
  rg -n \
    'prodops/(upstream|product|downstream/release-trail\.md|assessment/reliability-plan|assessment/reliability-plans|assessment/iteration-plans|assessment/event-storming|assessment/architecture)|prodops/operation/|delivery/flows/' \
    AGENTS.md prodops/README.md prodops/framework prodops/execution-model prodops/journeys prodops/skills prodops/templates prodops/business-intents \
    -g '!prodops/framework/canonical-paths.md' \
    -g '!prodops/journeys/discovery/upstream-trail.md' \
    -g '!prodops/journeys/discovery/experiments/**/upstream-trail.md' \
    -g '!prodops/journeys/discovery/experiments/**/experiment.md' \
    -g '!prodops/documentation-review.md' \
    || true
)"

if [[ -n "${legacy_refs}" ]]; then
  printf '%s\n' "${legacy_refs}" >&2
  fail "legacy ProdOps path references found in operational docs"
else
  pass "no legacy ProdOps path references in operational docs"
fi

if [[ "${failures}" -gt 0 ]]; then
  printf '\nProdOps doctor found %s issue(s).\n' "${failures}" >&2
  exit 1
fi

printf '\nProdOps doctor passed.\n'
