# ProdOps Delivery

ProdOps Delivery organiza o trabalho em duas faixas dentro de um fluxo contínuo:

```
CI Sync: Bootstrap → Hack → Sync → Finish     (trabalho local, síncrono)
CI Async: Ship → Validate → Promote            (plataforma, pipelines, ambientes)
```

## CI Sync — trabalho do engenheiro

→ [ci-sync.md](ci-sync.md)

## CI Async — trabalho da plataforma

→ [ci-async.md](ci-async.md)

## Flows

| Flow | Descrição | Link |
|---|---|---|
| Bootstrap | Branch + ambiente + contexto ProdOps | [flows/bootstrap.md](flows/bootstrap.md) |
| Hack | Implementação via ProdOps TDD | [flows/hack.md](flows/hack.md) |
| Sync | Consistência de artefatos | [flows/sync-finish.md](flows/sync-finish.md#sync) |
| Finish | Quality Gates + PR | [flows/sync-finish.md](flows/sync-finish.md#finish) |
| Ship | Preparation + Deployment | [flows/ship-validate-promote.md](flows/ship-validate-promote.md#ship) |
| Validate | Runtime + observabilidade + SLO | [flows/ship-validate-promote.md](flows/ship-validate-promote.md#validate) |
| Promote | Aprovação formal + Release Trail | [flows/ship-validate-promote.md](flows/ship-validate-promote.md#promote) |

## Practices

| Practice | Usado em | Link |
|---|---|---|
| ProdOps TDD | Hack | [practices/prodops-tdd.md](practices/prodops-tdd.md) |

## Capabilities

→ [capabilities/](capabilities/)

| Capability | Flows | Link |
|---|---|---|
| Commit Workflow | Hack, Sync, Finish | [capabilities/commit-workflow.md](capabilities/commit-workflow.md) |
| Contract Management | Bootstrap, Hack, Sync, Validate | [capabilities/contract-management.md](capabilities/contract-management.md) |
| Evidence Management | Finish, Validate, Promote | [capabilities/evidence-management.md](capabilities/evidence-management.md) |
| Observability | Hack, Validate | [capabilities/observability.md](capabilities/observability.md) |
| Reliability | Bootstrap, Hack, Finish, Promote | [capabilities/reliability.md](capabilities/reliability.md) |

## Paths de trabalho

| Path | Descrição | Sequência |
|---|---|---|
| Downstream | Entrega governada, com OBC + BDD + Reliability Plan | Sequência completa obrigatória |
| Upstream | Exploração, experimentos, validação de hipóteses | Seleciona etapas conforme necessidade |

## Execution skills

→ [`skills/hack/`](../../skills/hack/) · [`skills/sync/`](../../skills/sync/) · [`skills/ship/`](../../skills/ship/) · [`skills/validate/`](../../skills/validate/)
