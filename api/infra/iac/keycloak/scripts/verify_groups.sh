#!/usr/bin/env bash
set -euo pipefail

KEYCLOAK_URL="http://localhost:8080"
REALM="magasiara"
#REALM="master"
ADMIN_USER="admin"
ADMIN_PASS="admin"
CLIENT_ID="admin-cli"

echo "🔐 Obtendo token de administrador..."
ADMIN_TOKEN=$(curl -s -X POST \
    "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "client_id=$CLIENT_ID" \
    -d "username=$ADMIN_USER" \
    -d "password=$ADMIN_PASS" \
    -d "grant_type=password" \
    | jq -r .access_token)

if [[ "$ADMIN_TOKEN" == "null" ]]; then
    echo "❌ Falha ao obter token admin"
    exit 1
fi

echo "✅ Token de administrador obtido: $ADMIN_TOKEN"


echo "🔍 Verificando grupos no realm '$REALM'..."
curl -s \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Accept: application/json" \
    "$KEYCLOAK_URL/admin/realms/$REALM/groups"


resp=$(curl -sS -H "Authorization: Bearer $ADMIN_TOKEN" -H "Accept: application/json" \
  -w $'\n%{http_code}' \
  "$KEYCLOAK_URL/admin/realms/$REALM/groups")

http_code=${resp##*$'\n'}
body=${resp%$'\n'*}

if [[ "$http_code" -ne 200 ]]; then
  echo "ERROR: HTTP $http_code"
  echo "$body"
  exit 1
fi

GROUPS_JSON="$body"
echo "$GROUPS_JSON" | jq .

GROUP_ID=$(echo "$GROUPS_JSON" | jq -r '.[] | select(.name=="customers") | .id')

echo "➡️ GROUP_ID=$GROUP_ID"
