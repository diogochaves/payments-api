#!/usr/bin/env bash
# doctor.sh — repository health check for a ProdOps-adopting repository.
#
# Checks:
#   1. Manifest consistency (delegates to validate-manifest.sh).
#   2. Broken relative links in markdown files across the repository.
#
# Usage: doctor.sh [manifest-path]
#   manifest-path  defaults to prodops/exec/manifest.yaml
# Env:
#   PRODOPS_ROOT   repository root (default: git toplevel, else cwd)
#
# Exit: 0 = healthy | 1 = issue(s) found

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="${PRODOPS_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$ROOT"

MANIFEST="${1:-prodops/exec/manifest.yaml}"
FAILURES=0

# ── 1. Manifest consistency ─────────────────────────────────────────────────
echo "== doctor: manifest consistency =="
if ! "$SCRIPT_DIR/validate-manifest.sh" "$MANIFEST"; then
  FAILURES=$((FAILURES + 1))
fi

# ── 2. Broken relative markdown links ───────────────────────────────────────
echo ""
echo "== doctor: markdown link integrity =="
BROKEN=0
CHECKED=0

while IFS= read -r file; do
  dir="$(dirname "$file")"
  # Extract every "](target)" occurrence, one target per line.
  while IFS= read -r link; do
    [ -z "$link" ] && continue
    # Skip external and in-page links.
    case "$link" in
      http://*|https://*|mailto:*|\#*|tel:*) continue ;;
    esac
    # Drop the in-page anchor and any '"title"' suffix.
    target="${link%%#*}"
    target="${target%% \"*}"
    [ -z "$target" ] && continue
    CHECKED=$((CHECKED + 1))
    # Root-relative links resolve from the repo root; others from the file.
    case "$target" in
      /*) resolved=".$target" ;;
      *)  resolved="$dir/$target" ;;
    esac
    if [ ! -e "$resolved" ]; then
      echo "  FAIL $file -> $link"
      BROKEN=$((BROKEN + 1))
    fi
  done < <(grep -oE '\]\([^)]+\)' "$file" 2>/dev/null | sed 's/^](//; s/)$//' || true)
done < <(find . -name '*.md' \
  -not -path './.git/*' \
  -not -path '*/node_modules/*' \
  -not -path '*/dist/*' \
  -not -path '*/build/*' \
  -not -path '*/vendor/*' | sort)

if [ "$BROKEN" -gt 0 ]; then
  echo "  $BROKEN broken link(s) out of $CHECKED checked"
  FAILURES=$((FAILURES + 1))
else
  echo "  OK   $CHECKED relative link(s) checked, none broken"
fi

# ── Result ──────────────────────────────────────────────────────────────────
echo ""
if [ "$FAILURES" -gt 0 ]; then
  echo "doctor: FAILED — $FAILURES check group(s) with issues"
  exit 1
fi
echo "doctor: healthy"
