

USER_ID=$(curl -s \
  -H "Authorization: Bearer $( \
      curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "username=admin" \
        -d "password=admin" \
        -d "grant_type=password" \
        -d "client_id=admin-cli" \
      | jq -r '.access_token' \
    )" \
  http://localhost:8080/admin/realms/master/users?username=terraform | jq -r '.[0].id')

echo "User ID: $USER_ID"

curl -X PUT \
  "http://localhost:8080/admin/realms/master/users/$USER_ID/reset-password" \
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
        "type": "password",
        "value": "terraform123",
        "temporary": false
      }'

echo "Password updated successfully."