#!/bin/bash
# ./scripts/validate-client.sh <client_id> <client_secret>

KEYCLOAK_URL="http://localhost:8080"
REALM="master"
CLIENT_ID=$1
CLIENT_SECRET=$2

echo "Validando client_id e client_secret..."
echo "Client ID: $CLIENT_ID"
echo "Client Secret: $CLIENT_SECRET"
echo "Testando login..."
curl -v -X POST "$KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET"