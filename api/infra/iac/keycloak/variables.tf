variable "keycloak_url" {
  description = "URL local do Keycloak"
  type        = string
}

variable "admin_client_id" {
  description = "Client ID do admin (tipicamente 'admin-cli')"
  type        = string
  default     = "admin-cli"
}

variable "keycloak_user" {
  description = "Username para uso do Terraform"
  type        = string
}

variable "keycloak_password" {
  description = "Password para uso do Terraform"
  type        = string
}

variable "realm" {
  type = string
  default = "master"
}