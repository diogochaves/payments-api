#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------
# CONFIGURAÇÕES DO KEYCLOAK
# ---------------------------------------------
REALM="spire"
KEYCLOAK_URL="http://keycloak:8080/realms/$REALM/protocol/openid-connect/token"
CLIENT_ID="webshop-api"
CLIENT_SECRET=$(./get-client-secret.sh --raw)
USERNAME="cmilfont"
PASSWORD="testes55"

echo "🔐 Iniciando login do usuário '$USERNAME' no realm '$REALM'..."

echo "Secret do client '$CLIENT_ID' obtido: $CLIENT_SECRET"

# ---------------------------------------------
# REQUISIÇÃO AO TOKEN ENDPOINT
# ---------------------------------------------
echo "→ Autenticando usuário no Keycloak..."

# O bash captura apenas stdout do curl. stderr é descartado (-sS).
RAW_RESPONSE=$(curl -sS \
  -X POST "$KEYCLOAK_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "username=$USERNAME" \
  -d "password=$PASSWORD" \
  || { echo "❌ Erro ao conectar ao Keycloak."; exit 1; })

# ---------------------------------------------
# TRATAR ERROS DO KEYCLOAK
# ---------------------------------------------
if echo "$RAW_RESPONSE" | grep -q "\"error\""; then
  echo "❌ Falha no login!"
  echo "Detalhes:"
  echo "$RAW_RESPONSE"
  exit 1
fi

# ---------------------------------------------
# EXTRAIR TOKENS USANDO GREP + SED (sem jq)
# ---------------------------------------------
ACCESS_TOKEN=$(echo "$RAW_RESPONSE"  | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
REFRESH_TOKEN=$(echo "$RAW_RESPONSE" | sed -n 's/.*"refresh_token":"\([^"]*\)".*/\1/p')
EXPIRES_IN=$(echo "$RAW_RESPONSE"    | sed -n 's/.*"expires_in":\([0-9]*\).*/\1/p')

# Se o bash não encontrar os valores, as variáveis ficam vazias
if [[ -z "$ACCESS_TOKEN" ]]; then
  echo "❌ Não foi possível extrair o token. Resposta bruta:"
  echo "$RAW_RESPONSE"
  exit 1
fi

# ---------------------------------------------
# SUCESSO
# ---------------------------------------------
echo "✅ Login realizado com sucesso!"
echo
echo "Access Token:"
echo "$ACCESS_TOKEN"
echo
echo "Refresh Token:"
echo "$REFRESH_TOKEN"
echo
echo "Expira em: ${EXPIRES_IN}s"
echo
echo "→ Dica: exporte o token para usar em chamadas:"
echo " TOKEN=\"$ACCESS_TOKEN\""