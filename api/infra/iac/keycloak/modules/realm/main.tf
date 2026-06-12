# Realm
resource "keycloak_realm" "this" {
  realm   = var.realm_name
  enabled = true
  display_name = var.realm_name

  access_token_lifespan                   = "30m"
  access_token_lifespan_for_implicit_flow = "30m"
  sso_session_idle_timeout                = "30m"
  sso_session_max_lifespan                = "8h"
}

# Realm roles
resource "keycloak_role" "customer_read" {
  realm_id = keycloak_realm.this.id
  name     = "customer:read"
}

resource "keycloak_role" "customer_order_create" {
  realm_id = keycloak_realm.this.id
  name     = "customer:order:create"
}

# Group customers
resource "keycloak_group" "customers" {
  realm_id = keycloak_realm.this.id
  name     = "customers"
}

# Attach roles to group
resource "keycloak_group_roles" "customers_roles" {
  realm_id = keycloak_realm.this.id
  group_id = keycloak_group.customers.id

  role_ids = [
    keycloak_role.customer_read.id,
    keycloak_role.customer_order_create.id,
  ]
}

# Client: webshop-api
resource "keycloak_openid_client" "webshop_api" {
  realm_id                    = keycloak_realm.this.id
  client_id                   = "webshop-api"
  name                        = "webshop-api"
  access_type                 = "CONFIDENTIAL"

  standard_flow_enabled        = false
  implicit_flow_enabled        = false
  direct_access_grants_enabled = true
  service_accounts_enabled     = true

}

# Expose user attribute 'tier' in token (user attribute -> claim)
resource "keycloak_openid_user_attribute_protocol_mapper" "tier_mapper" {
  realm_id         = keycloak_realm.this.id
  client_id        = keycloak_openid_client.webshop_api.id
  name             = "tier"
  user_attribute   = "tier"
  claim_name       = "customer_tier"
  claim_value_type = "String"

  add_to_id_token     = true
  add_to_access_token = true
}

# resource "keycloak_openid_audience_protocol_mapper" "webshop_api_audience" {
#   realm_id  = keycloak_realm.this.id
#   client_id = keycloak_openid_client.webshop_api.id

#   name               = "webshop-api-audience"
#   included_client_audience = "webshop-api"
#   add_to_access_token = true
#   add_to_id_token     = true
# }