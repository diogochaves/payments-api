#!/usr/bin/env bash
# validate-manifest.sh — validate the ProdOps manifest against the repository.
#
# Checks:
#   1. Every path declared under `skills:` and `paths:` exists.
#      Lines marked with "# optional" produce WARN instead of FAIL.
#   2. `vocabulary.commit_types` is present and non-empty.
#   3. `vocabulary.commit_summary_max` is a positive integer.
#
# Usage: validate-manifest.sh [manifest-path]
#   manifest-path  defaults to prodops/exec/manifest.yaml
# Env:
#   PRODOPS_ROOT   repository root (default: git toplevel, else cwd)
#
# Exit: 0 = consistent | 1 = inconsistency found

set -euo pipefail

ROOT="${PRODOPS_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$ROOT"

MANIFEST="${1:-prodops/exec/manifest.yaml}"

FAILURES=0
WARNINGS=0

fail() { echo "  FAIL $1"; FAILURES=$((FAILURES + 1)); }
warn() { echo "  WARN $1"; WARNINGS=$((WARNINGS + 1)); }
ok()   { echo "  OK   $1"; }

[ -f "$MANIFEST" ] || { echo "FAIL: manifest not found: $MANIFEST"; exit 1; }

# ── 1. Declared paths exist ─────────────────────────────────────────────────
echo "1. Checking declared paths (skills: and paths:)"

# Walk the skills: and paths: sections; emit "<required|optional> <value>"
# for every indented "key: value" line.
while read -r kind path; do
  [ -z "$path" ] && continue
  if [ -e "$path" ]; then
    ok "$path"
  elif [ "$kind" = "optional" ]; then
    warn "$path (missing — marked as optional)"
  else
    fail "$path does not exist"
  fi
done < <(awk '
  /^[a-z_]+:/ { section = $1 }
  (section == "skills:" || section == "paths:") && /^  [a-z_]+: / {
    optional = ($0 ~ /# optional/) ? "optional" : "required"
    line = $0
    sub(/#.*$/, "", line)            # strip trailing comment
    split(line, kv, ": ")
    gsub(/^[ \t]+|[ \t]+$/, "", kv[2])
    if (kv[2] != "") print optional " " kv[2]
  }
' "$MANIFEST")

# ── 2. commit_types present and non-empty ───────────────────────────────────
echo "2. Checking vocabulary.commit_types"

COMMIT_TYPES="$(grep -E '^[[:space:]]+commit_types:' "$MANIFEST" \
  | sed 's/.*\[//; s/\].*//; s/,/ /g' | xargs || true)"

if [ -n "$COMMIT_TYPES" ]; then
  ok "commit_types: $COMMIT_TYPES"
else
  fail "vocabulary.commit_types is missing or empty"
fi

# ── 3. commit_summary_max is a positive integer ─────────────────────────────
echo "3. Checking vocabulary.commit_summary_max"

SUMMARY_MAX="$(grep -E '^[[:space:]]+commit_summary_max:' "$MANIFEST" \
  | grep -oE '[0-9]+' | head -1 || true)"

if [ -n "$SUMMARY_MAX" ] && [ "$SUMMARY_MAX" -gt 0 ]; then
  ok "commit_summary_max: $SUMMARY_MAX"
else
  fail "vocabulary.commit_summary_max is missing or not a positive integer"
fi

# ── Result ──────────────────────────────────────────────────────────────────
echo ""
if [ "$FAILURES" -gt 0 ]; then
  echo "validate-manifest: FAILED — $FAILURES failure(s), $WARNINGS warning(s)"
  exit 1
fi
echo "validate-manifest: consistent ($WARNINGS warning(s))"
