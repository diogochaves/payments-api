#!/usr/bin/env bash
set -euo pipefail

KEYCLOAK_URL="http://keycloak:8080"
REALM="spire"
ADMIN_USER="admin"
ADMIN_PASS="admin"
CLIENT_ID="admin-cli"
LOGIN_CLIENT_ID="webshop-api"

RAW=false
if [[ "${1:-}" == "--raw" ]]; then RAW=true; fi

if [[ "$RAW" == false ]]; then
  echo "🔐 Obtendo token de administrador…"
fi

ADMIN_TOKEN=$(
  curl -sS \
    -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=password" \
    -d "client_id=$CLIENT_ID" \
    -d "username=$ADMIN_USER" \
    -d "password=$ADMIN_PASS" |
  jq -r '.access_token'
)

if [[ "$ADMIN_TOKEN" == "null" || -z "$ADMIN_TOKEN" ]]; then
  if [[ "$RAW" == false ]]; then
    echo "❌ Falha ao obter token do admin!"
  fi
  exit 1
fi

if [[ "$RAW" == false ]]; then
  echo "🔍 Buscando client '$LOGIN_CLIENT_ID' no realm '$REALM'…"
fi

CLIENTS_JSON=$(
  curl -sS \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Accept: application/json" \
    "$KEYCLOAK_URL/admin/realms/$REALM/clients"
)

CLIENT_INTERNAL_ID=$(echo "$CLIENTS_JSON" | jq -r ".[] | select(.clientId==\"$LOGIN_CLIENT_ID\") | .id")

if [[ -z "$CLIENT_INTERNAL_ID" || "$CLIENT_INTERNAL_ID" == "null" ]]; then
  if [[ "$RAW" == false ]]; then
    echo "❌ Client '$LOGIN_CLIENT_ID' não encontrado no realm '$REALM'!"
  fi
  exit 1
fi

if [[ "$RAW" == false ]]; then
  echo "✔️ ID interno do client: $CLIENT_INTERNAL_ID"
fi
if [[ "$RAW" == false ]]; then
  echo "🔍 Obtendo client secret do client '$LOGIN_CLIENT_ID'…"
fi

SECRET_JSON=$(
  curl -sS \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Accept: application/json" \
    "$KEYCLOAK_URL/admin/realms/$REALM/clients/$CLIENT_INTERNAL_ID/client-secret"
)

CLIENT_SECRET=$(echo "$SECRET_JSON" | jq -r '.value')

if [[ -z "$CLIENT_SECRET" || "$CLIENT_SECRET" == "null" ]]; then
  if [[ "$RAW" == false ]]; then
    echo "❌ Client encontrado, mas não possui clientSecret (provavelmente é PUBLIC client)."
  fi
  exit 1
fi

if [[ "$RAW" == false ]]; then
  echo "✔️ Client Secret encontrado:"
fi
echo "$CLIENT_SECRET"