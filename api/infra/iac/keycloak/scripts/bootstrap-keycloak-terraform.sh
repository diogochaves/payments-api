#!/usr/bin/env bash
set -euo pipefail
# set -e: Faz o script parar imediatamente se qualquer comando retornar código diferente de zero (erro).
# set -u: Quebra o script se tentar usar uma variável não definida.
# set -o pipefail: Com pipefail, o pipeline retorna erro se qualquer comando falhar.

KEYCLOAK_URL="http://localhost:8080"
REALM="master"
ADMIN_USER="admin"
ADMIN_PASS="admin"
TERRAFORM_CLIENT_ID="terraform-admin"

echo "🔑 Obtendo token de administrador..."
ADMIN_TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$ADMIN_USER" \
  -d "password=$ADMIN_PASS" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

if [[ "$ADMIN_TOKEN" == "null" || -z "$ADMIN_TOKEN" ]]; then
  echo "❌ Não foi possível obter token admin. Verifique user/senha."
  exit 1
fi
echo "✅ Token admin obtido."

echo "🔍 Verificando se client '$TERRAFORM_CLIENT_ID' já existe..."
CLIENT_ID=$(curl -s \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$KEYCLOAK_URL/admin/realms/$REALM/clients?clientId=$TERRAFORM_CLIENT_ID" \
  | jq -r '.[0].id')

if [[ "$CLIENT_ID" == "null" || -z "$CLIENT_ID" ]]; then
  echo "🆕 Criando client '$TERRAFORM_CLIENT_ID'..."
  curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM/clients" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"clientId\": \"$TERRAFORM_CLIENT_ID\",
      \"name\": \"$TERRAFORM_CLIENT_ID\",
      \"enabled\": true,
      \"publicClient\": false,
      \"serviceAccountsEnabled\": true,
      \"standardFlowEnabled\": false,
      \"directAccessGrantsEnabled\": false,
      \"protocol\": \"openid-connect\"
    }" > /dev/null
else
  echo "ℹ️ Client já existe."
fi

sleep 1

echo "🔍 Obtendo ID atualizado do client..."
CLIENT_ID=$(curl -s \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$KEYCLOAK_URL/admin/realms/$REALM/clients?clientId=$TERRAFORM_CLIENT_ID" \
  | jq -r '.[0].id')

echo "🔑 Criando secret do client..."
CLIENT_SECRET=$(curl -s -X POST \
  "$KEYCLOAK_URL/admin/realms/$REALM/clients/$CLIENT_ID/client-secret" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.value')

echo "🔍 Obtendo role realm-admin..."
ROLE_ID=$(curl -s \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$KEYCLOAK_URL/admin/realms/$REALM/roles/realm-admin" | jq -r '.id')

ROLE_JSON=$(jq -n --arg id "$ROLE_ID" --arg name "realm-admin" \
  '{id: $id, name: $name}')

echo "🧩 Obtendo ID do service-account-user..."
SERVICE_USER_ID=$(curl -s \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$KEYCLOAK_URL/admin/realms/$REALM/clients/$CLIENT_ID/service-account-user" \
  | jq -r '.id')

echo "🧩 Atribuindo role realm-admin ao service account..."
curl -s -X POST \
  "$KEYCLOAK_URL/admin/realms/$REALM/users/$SERVICE_USER_ID/role-mappings/realm" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "[$ROLE_JSON]" > /dev/null


# echo "📄 Criando terraform.tfvars ..."
# cat > terraform.tfvars <<EOF
# keycloak_url        = "$KEYCLOAK_URL"
# admin_client_id     = "$TERRAFORM_CLIENT_ID"
# admin_client_secret = "$CLIENT_SECRET"
# EOF


echo "🎉 Tudo pronto!"
echo "🔑 Client ID:     $TERRAFORM_CLIENT_ID"
echo "🔐 Client Secret: $CLIENT_SECRET"