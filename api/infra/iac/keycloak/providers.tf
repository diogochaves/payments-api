provider "keycloak" {
  url       = var.keycloak_url
  client_id = var.admin_client_id
  username  = var.keycloak_user
  password  = var.keycloak_password
  realm     = var.realm
}