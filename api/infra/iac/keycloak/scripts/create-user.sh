#!/usr/bin/env bash
set -euo pipefail

KEYCLOAK_URL="http://localhost:8080"
REALM="magasiara"
ADMIN_USER="admin"
ADMIN_PASS="admin"
CLIENT_ID="admin-cli"

NEW_USER="cmilfont"
NEW_EMAIL="cmilfont@gmail.com"
NEW_PASS="testes55"

USER_ROLES=("customer:read" "customer:order:create")

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
echo "🔍 Verificando se existe usuário com email '$NEW_EMAIL'..."
EXISTING_USER=$(curl -s \
    "$KEYCLOAK_URL/admin/realms/$REALM/users?email=$NEW_EMAIL" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

USER_ID=$(echo "$EXISTING_USER" | jq -r '.[0].id')

if [[ "$USER_ID" == "null" || -z "$USER_ID" ]]; then
    echo "👤 Usuário NÃO existe — criando novo..."
    curl -s -o /dev/null -X POST \
        "$KEYCLOAK_URL/admin/realms/$REALM/users" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"$NEW_USER\",
            \"email\": \"$NEW_EMAIL\",
            \"enabled\": true,
            \"emailVerified\": true
        }"
else
    echo "✔️ Usuário já existe! Não será recriado."
fi

echo "🔍 Recarregando dados do usuário após criação..."

# -------------------------
# 🔁 Espera até encontrar o USER_ID
# -------------------------
RETRIES=5
COUNT=0
USER_ID=""

while [[ $COUNT -lt $RETRIES ]]; do
    RESULT=$(curl -s \
        "$KEYCLOAK_URL/admin/realms/$REALM/users?username=$NEW_USER" \
        -H "Authorization: Bearer $ADMIN_TOKEN")

    USER_ID=$(echo "$RESULT" | jq -r '.[0].id')

    if [[ "$USER_ID" != "null" && -n "$USER_ID" ]]; then
        break
    fi

    echo "⏳ Aguardando Keycloak indexar o usuário... tentativas: $((COUNT+1))/$RETRIES"
    sleep 1
    COUNT=$((COUNT+1))
done

if [[ "$USER_ID" == "null" || -z "$USER_ID" ]]; then
    echo "❌ ERRO: Não foi possível recuperar o USER_ID após criação!"
    exit 1
fi

echo "➡️ USER_ID=$USER_ID"

# -------------------------
# ✔️ Marcar email como verificado
# -------------------------
echo "✔️ Marcando email como verificado..."
curl -s -X PUT \
    "$KEYCLOAK_URL/admin/realms/$REALM/users/$USER_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"emailVerified\": true
    }" > /dev/null

# -------------------------
# 🔐 Definindo senha
# -------------------------
echo "🔐 Definindo senha..."
curl -s -X PUT \
    "$KEYCLOAK_URL/admin/realms/$REALM/users/$USER_ID/reset-password" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"type\": \"password\",
        \"value\": \"$NEW_PASS\",
        \"temporary\": false
    }" > /dev/null

# -------------------------
# 🔰 Atribuir Roles
# -------------------------
echo "🔰 Atribuindo roles do realm..."

for ROLE in "${USER_ROLES[@]}"; do
  echo "   ➕ Verificando role: $ROLE"

  ROLE_DATA=$(curl -s \
      "$KEYCLOAK_URL/admin/realms/$REALM/roles/$ROLE" \
      -H "Authorization: Bearer $ADMIN_TOKEN")

  ROLE_ID=$(echo "$ROLE_DATA" | jq -r '.id')

  if [[ "$ROLE_ID" == "null" || -z "$ROLE_ID" ]]; then
      echo "❌ ERRO: A role '$ROLE' NÃO existe no realm '$REALM'"
      exit 1
  fi

  echo "   ➕ Atribuindo role: $ROLE"
  curl -s -X POST \
      "$KEYCLOAK_URL/admin/realms/$REALM/users/$USER_ID/role-mappings/realm" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "[$ROLE_DATA]" > /dev/null
done


# ===========================================================
# ADICIONAR USUÁRIO AO GROUP "customers"
# ===========================================================
echo "👥 Associando usuário ao grupo 'customers'..."

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

# Inserir no grupo
curl -s -X PUT \
    "$KEYCLOAK_URL/admin/realms/$REALM/users/$USER_ID/groups/$GROUP_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null

echo "✔️ Usuário adicionado ao grupo 'customers'!"

echo "🎉 Usuário criado/atualizado com sucesso!"
echo ""
echo "📌 Credenciais:"
echo "    username: $NEW_USER"
echo "    email: $NEW_EMAIL"
echo "    password: $NEW_PASS"