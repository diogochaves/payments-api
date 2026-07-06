# ProdOps Delivery

ProdOps Delivery organiza o trabalho de implementação em dois agrupamentos dentro de um fluxo contínuo:

```
Continuous Integration
├── CI Sync                     → trabalho local, síncrono, colaborativo
│   ├── Bootstrap
│   ├── Hack
│   ├── Sync
│   └── Finish
│
└── CI Async                    → trabalho assíncrono, plataforma, pipelines
    ├── Ship
    ├── Validate
    └── Promote
```

O fluxo principal segue a sequência:

```
Bootstrap → Hack → Sync → Finish → Ship → Validate → Promote
```

---

## CI Sync

O CI Sync representa o trabalho **síncrono, local e colaborativo** da engenharia.

**Resultado esperado:**
- Task fechada
- PR criado com narrativa da implementação
- Evidências anexadas
- Commits organizados seguindo Conventional Commits
- Validações locais executadas (lint, testes, build)

| Passo | Responsabilidade |
|---|---|
| **Bootstrap** | Preparar o ambiente, criar a branch, ler os artefatos ProdOps |
| **Hack** | Implementar com ProdOps TDD (Contract First, Integration First, Observability First) |
| **Sync** | Confirmar consistência entre implementação e artefatos ProdOps |
| **Finish** | Fechar a task, executar Quality Gates, criar PR com evidências |

Documentação:
- [Bootstrap Flow](bootstrap-flow.md)
- [Hack Flow](hack-flow.md) — coding com ProdOps TDD integrado
- [Sync + Finish Flow](sync-finish-flow.md) — revisão, consistência, fechamento de task

---

## CI Async

O CI Async representa o trabalho **assíncrono executado pela plataforma**, pipelines, automações e ambientes.

**Resultado esperado:**
- Artefato produzido e publicado
- Deploy realizado no ambiente alvo
- Validação em runtime executada
- Promoção controlada com evidência registrada

| Passo | Responsabilidade |
|---|---|
| **Ship** | Transformar a implementação em artefato executável (Preparation) e conduzir o deploy (Deployment) |
| **Validate** | Verificar a entrega em execução no ambiente alvo |
| **Promote** | Oficializar a evolução da versão com aprovação formal e evidência |

Documentação:
- [Ship → Validate → Promote Flow](ship-validate-promote-flow.md)

---

## Capabilities transversais

Capabilities consumidas em múltiplos estágios do fluxo:

| Capability | Estágios |
|---|---|
| **ProdOps TDD** | Hack |
| **Commit Workflow** | Hack, Sync, Finish |
| **Quality Gates** | Finish, Promote |
| **Evidence Management** | Finish, Validate, Promote |

- [ProdOps TDD](practices/tdd-prodops.md)
- [Commit Workflow](../commit-workflow/README.md)

---

## Paths de trabalho

| Path | Descrição | Sequência |
|---|---|---|
| **Downstream** | Entrega governada, com compromisso e OBC | Sequência completa obrigatória |
| **Upstream** | Exploração, experimentos, validação de hipóteses | Seleciona etapas conforme necessidade |

Downstream requer a sequência completa. Upstream seleciona as etapas necessárias para o experimento. Um ciclo Upstream típico usa Bootstrap + Hack + Sync; Ship, Validate e Promote são adicionados apenas quando o experimento requer validação em staging ou uma decisão de promoção.

---

## Execution skills

Para mecânica de execução (branching, comandos, lint, testes, commit):
- [`skills/hack/`](../../skills/hack/) — implementação
- [`skills/sync/`](../../skills/sync/) — revisão e sync de artefatos
- [`skills/finish/`](../../skills/finish/) — fechamento de quality gates
- [`skills/ship/`](../../skills/ship/) — deploy preparation
- [`skills/validate/`](../../skills/validate/) — validação pós-deploy
