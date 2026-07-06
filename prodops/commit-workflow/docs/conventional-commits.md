# Conventional Commits

Este projeto adota o padrão [Conventional Commits](https://www.conventionalcommits.org).

## Formato

```
<type>(<scope>): <summary>

[body opcional]

[footer opcional]
```

- **type**: obrigatório — define a natureza da mudança.
- **scope**: opcional — delimita o módulo ou domínio afetado.
- **summary**: obrigatório — imperativo, minúsculas, sem ponto final, máximo 72 caracteres.
- **body**: opcional — explica o "porquê", não o "o quê".
- **footer**: opcional — referências a issues, breaking changes (`BREAKING CHANGE:`).

## Tipos

| Type | Quando usar |
|---|---|
| `feat` | Nova funcionalidade visível ao usuário ou consumidor da API. Incrementa a versão MINOR no SemVer. |
| `fix` | Correção de comportamento incorreto. Incrementa PATCH. |
| `docs` | Mudanças exclusivas em documentação (`.md`, comentários, specs). |
| `test` | Adição ou correção de testes sem alterar código de produção. |
| `refactor` | Mudança interna sem alterar comportamento externo e sem corrigir bug. |
| `perf` | Melhoria de performance sem mudança de comportamento externo. |
| `build` | Mudanças no sistema de build, dependências, scripts de infra. |
| `ci` | Mudanças em workflows de CI/CD (GitHub Actions, configurações de pipeline). |
| `style` | Formatação, espaçamento, vírgulas — sem impacto em lógica. |
| `chore` | Tarefas de manutenção que não se encaixam em nenhum tipo acima. |
| `revert` | Reverte um commit anterior. O summary deve referenciar o commit revertido. |

## Breaking changes

Adicionar `!` após o type/scope sinaliza breaking change:

```
feat(invoices)!: remove billingType PIX from create endpoint
```

Ou usar footer:

```
BREAKING CHANGE: PIX billing type removed from POST /invoices
```

## Exemplos

```
feat(invoices): add hosted credit card payment flow
fix(webhook): prevent duplicate PAYMENT_CONFIRMED processing
docs(prodops): add commit workflow capability
test(cancelar): remove mock-dependent provider failure test
refactor(auth): extract token validation to TokenRepository
chore: update STAGING_ADMIN_SECRET in GitHub Actions
ci: replace --runInBand with --maxWorkers=1 in acceptance tests
```

## Scope sugeridos para este repositório

| Scope | Módulo |
|---|---|
| `invoices` | Criação, cancelamento, confirmação de invoices |
| `auth` | API token validation, admin token management |
| `webhook` | Webhook processing, Asaas events |
| `asaas` | AsaasService, provider integration |
| `dynamo` | DynamoDB, repositories |
| `prodops` | Documentação ProdOps |
| `scripts` | Scripts utilitários |
| `ci` | GitHub Actions workflows |
