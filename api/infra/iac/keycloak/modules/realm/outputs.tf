output "realm_id" {
  value = keycloak_realm.this.id
}

output "webshop_api_client_id" {
  value = keycloak_openid_client.webshop_api.client_id
}

output "webshop_api_service_account_user_id" {
  value = keycloak_openid_client.webshop_api.service_account_user_id
}