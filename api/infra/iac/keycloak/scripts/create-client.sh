curl -X POST "http://localhost:8080/admin/realms/master/clients" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $( \
      curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
            -H "Content-Type: application/x-www-form-urlencoded" \
            -d "username=admin" \
            -d "password=admin" \
            -d "grant_type=password" \
            -d "client_id=admin-cli" \
      | jq -r '.access_token' \
  )" \
  -d '{
        "clientId": "terraform-admin",
        "name": "terraform-admin",
        "enabled": true,
        "publicClient": false,
        "serviceAccountsEnabled": true,
        "standardFlowEnabled": false,
        "directAccessGrantsEnabled": false,
        "protocol": "openid-connect"
      }'