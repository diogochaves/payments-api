# Keycloak Terraform IaC

Conteúdo: configuração de realm, grupos, roles, clients e mappers para a plataforma `magasiara`.

## Setup

Antes de executar o Terraform, crie o usuário admin para colocar nas variáveis:

```sh
chmod +x scripts/bootstrap-keycloak-terraform.sh
./scripts/bootstrap-keycloak-terraform.sh
```

**Guia rápido**

1. Ajuste `terraform.tfvars` (nunca commite secrets)
2. `terraform init`
3. `terraform plan`
4. `terraform apply`

Use Vault para segredos (client_secret) e bloqueie acesso direto via console Keycloak em produção.


