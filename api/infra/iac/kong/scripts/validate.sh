#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 || -z "${1:-}" ]]; then
  echo "Uso: $0 <token>"
  exit 1
fi

TOKEN="$1"

curl -i -H "Authorization: Bearer $TOKEN" -X POST http://localhost:8000/keycloak-test
