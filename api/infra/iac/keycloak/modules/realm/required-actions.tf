#################################################
# HABILITADAS
#################################################

resource "keycloak_required_action" "verify_email" {
  realm_id        = keycloak_realm.this.id
  alias           = "VERIFY_EMAIL"
  name            = "Verify Email"
  enabled         = true
  default_action  = false
  priority        = 10
}

resource "keycloak_required_action" "update_password" {
  realm_id        = keycloak_realm.this.id
  alias           = "UPDATE_PASSWORD"
  name            = "Update Password"
  enabled         = true
  default_action  = false
  priority        = 20
}

#################################################
# DESABILITADAS
#################################################

resource "keycloak_required_action" "configure_totp" {
  realm_id        = keycloak_realm.this.id
  alias           = "CONFIGURE_TOTP"
  name            = "Configure OTP"
  enabled         = false
  default_action  = false
  priority        = 30
}

resource "keycloak_required_action" "update_profile" {
  realm_id        = keycloak_realm.this.id
  alias           = "UPDATE_PROFILE"
  name            = "Update Profile"
  enabled         = false
  default_action  = false
  priority        = 40
}

resource "keycloak_required_action" "terms_and_conditions" {
  realm_id        = keycloak_realm.this.id
  alias           = "TERMS_AND_CONDITIONS"
  name            = "Terms and Conditions"
  enabled         = false
  default_action  = false
  priority        = 50
}

resource "keycloak_required_action" "delete_account" {
  realm_id        = keycloak_realm.this.id
  alias           = "delete_account"
  name            = "Delete Account"
  enabled         = false
  default_action  = false
  priority        = 60
}

resource "keycloak_required_action" "webauthn_register" {
  realm_id        = keycloak_realm.this.id
  alias           = "webauthn-register"
  name            = "Webauthn Register"
  enabled         = false
  default_action  = false
  priority        = 70
}

resource "keycloak_required_action" "update_user_locale" {
  realm_id        = keycloak_realm.this.id
  alias           = "update_user_locale"
  name            = "Update User Locale"
  enabled         = false
  default_action  = false
  priority        = 80
}

resource "keycloak_required_action" "webauthn_register_passwordless" {
  realm_id        = keycloak_realm.this.id
  alias           = "webauthn-register-passwordless"
  name            = "Webauthn Register Passwordless"
  enabled         = false
  default_action  = false
  priority        = 90
}

resource "keycloak_required_action" "verify_profile" {
  realm_id        = keycloak_realm.this.id
  alias           = "VERIFY_PROFILE"
  name            = "Verify Profile"
  enabled         = false
  default_action  = false
  priority        = 100
}

resource "keycloak_required_action" "delete_credential" {
  realm_id        = keycloak_realm.this.id
  alias           = "delete_credential"
  name            = "Delete Credential"
  enabled         = false
  default_action  = false
  priority        = 110
}