# CI Sync

CI Sync é o agrupamento síncrono do ProdOps Delivery. Representa o trabalho **local, colaborativo e conduzido pelo engenheiro**.

```
CI Sync: Bootstrap → Hack → Sync → Finish
```

## Propósito

CI Sync produz:
- Task fechada
- PR com narrativa da implementação
- Evidências de testes e lint
- Commits organizados seguindo Conventional Commits
- Validações locais executadas

## Estágios

### Bootstrap

Prepara o ambiente, cria a branch e estabelece o contexto de produto. Não produz código — produz contexto.

Saída: branch limpa + ambiente pronto + artefatos ProdOps lidos + contrato verificado.

→ [flows/bootstrap.md](flows/bootstrap.md)

### Hack

Implementa com ProdOps TDD: Red Bar → Green Bar → Refactor → Commit.

Consome:
- **Prática:** [ProdOps TDD](practices/prodops-tdd.md)
- **Capability:** [Commit Workflow](capabilities/commit-workflow/README.md)

→ [flows/hack.md](flows/hack.md)

### Sync

Confirma consistência entre implementação e artefatos ProdOps (BDD Feature, OBC, Event Storming, arquitetura).

→ [flows/sync-finish.md](flows/sync-finish.md#sync)

### Finish

Executa Quality Gates finais e cria o PR com evidências.

→ [flows/sync-finish.md](flows/sync-finish.md#finish)

## Capabilities utilizadas

| Capability | Estágio |
|---|---|
| [Commit Workflow](capabilities/commit-workflow/README.md) | Hack, Sync, Finish |
| [Contract Management](capabilities/contract-management.md) | Bootstrap, Hack, Sync |
| [Evidence Management](capabilities/evidence-management.md) | Hack, Finish |
| [Observability](capabilities/observability.md) | Hack |
| [Reliability](capabilities/reliability.md) | Bootstrap, Hack, Finish |
