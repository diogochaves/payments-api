# Capability — Evidence Management

## Objetivo

Capturar, preservar e apresentar evidências de cada etapa do fluxo de entrega, garantindo rastreabilidade da decisão ao deploy.

## Responsabilidades

- Registrar evidências de testes (Red Bar confirmado, Green Bar, aceitação)
- Registrar evidências de lint e build
- Atualizar o Release Trail após cada etapa relevante do Downstream
- Registrar evidência de validação pós-deploy
- Registrar promoção com aprovação formal

## Flows consumidores

| Flow | Evidência produzida |
|---|---|
| Hack | Red Bar confirmado, Green Bar, lint |
| Finish | Evidência de Quality Gates (lint, testes, build) |
| Validate | Logs, métricas, SLO signals, BDD cenários em staging |
| Promote | Entrada no Release Trail, aprovação, Rollback Readiness |

## Artefatos produzidos

- Entradas no Release Trail: `prodops/downstream/release-trail.md`
- Entradas no Upstream Trail: `prodops/upstream/experiments/<id>/upstream-trail.md`
- PR preenchido com evidências (template: `prodops/commit-workflow/templates/pull_request.md`)

## Dependências

- Release Trail: `prodops/downstream/release-trail.md`
- Task-closing template: `prodops/commit-workflow/templates/task-closing.md`
