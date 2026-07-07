# Documentation Review — Structural Refactoring

**Data da revisão:** 2026-07-07

**Objetivo:** Refatoração estrutural da documentação ProdOps — separar em camadas hierárquicas e introduzir o modelo `Journey → Flow → Practice → Capability`.

---

## Arquivos movidos

| Old path | New path |
|---|---|
| `prodops/current-state/` (directory) | `prodops/product/` |
| `prodops/delivery/bootstrap-flow.md` | `prodops/delivery/flows/bootstrap.md` |
| `prodops/delivery/hack-flow.md` | `prodops/delivery/flows/hack.md` |
| `prodops/delivery/sync-finish-flow.md` | `prodops/delivery/flows/sync-finish.md` |
| `prodops/delivery/ship-validate-promote-flow.md` | `prodops/delivery/flows/ship-validate-promote.md` |
| `prodops/delivery/practices/tdd-prodops.md` | `prodops/delivery/practices/prodops-tdd.md` |
| `prodops/assessment/reliability-plan/obcs/api-token-validation.md` | `prodops/assessment/obcs/api-token-validation.md` |
| `prodops/assessment/reliability-plan/obcs/create-invoice-boleto.md` | `prodops/assessment/obcs/create-invoice-boleto.md` |
| `prodops/assessment/reliability-plan/obcs/webhook-configuration.md` | `prodops/assessment/obcs/webhook-configuration.md` |
| `prodops/assessment/reliability-plan/obcs/README.md` | `prodops/assessment/obcs/README.md` |
| `prodops/assessment/reliability-plan/risks.md` | `prodops/assessment/risks.md` |
| `prodops/assessment/reliability-plan/opportunities.md` | `prodops/assessment/opportunities.md` |
| `prodops/assessment/reliability-plan/objectives.md` | `prodops/assessment/reliability-plans/objectives.md` |
| `prodops/assessment/reliability-plan/iteration-backlog.md` | `prodops/assessment/iteration-plans/iteration-backlog.md` |
| `prodops/assessment/iteration-plan.md` | `prodops/assessment/iteration-plans/iteration-plan.md` |
| `prodops/assessment/premortem.md` | `prodops/assessment/reliability-plans/premortem.md` |
| `prodops/assessment/reliability-plan/setup/` | `prodops/assessment/reliability-plans/setup/` |
| `prodops/assessment/reliability-plan/README.md` | `prodops/assessment/reliability-plans/README.md` |
| `prodops/templates/decision-trail.md` | `prodops/templates/assessment/decision-trail.md` |
| `prodops/templates/reliability-checklist.md` | `prodops/templates/assessment/reliability-checklist.md` |
| `prodops/templates/pull-request-checklist.md` | `prodops/templates/delivery/pull-request-checklist.md` |
| `prodops/templates/test-plan.md` | `prodops/templates/engineering/test-plan.md` |

---

## Novos arquivos criados

| Arquivo | Propósito |
|---|---|
| `prodops/delivery/capabilities/README.md` | Índice de capabilities do Delivery |
| `prodops/delivery/capabilities/commit-workflow.md` | Capability: Commit Workflow |
| `prodops/delivery/capabilities/contract-management.md` | Capability: Contract Management |
| `prodops/delivery/capabilities/evidence-management.md` | Capability: Evidence Management |
| `prodops/delivery/capabilities/observability.md` | Capability: Observability |
| `prodops/delivery/capabilities/reliability.md` | Capability: Reliability |
| `prodops/delivery/ci-sync.md` | Agrupamento CI Sync com links para flows/practices/capabilities |
| `prodops/delivery/ci-async.md` | Agrupamento CI Async com links para flows/capabilities |
| `prodops/product/README.md` | Índice da área product (ex current-state) |
| `prodops/framework/operating-model.md` | Modelo operacional: Journey → Flow → Practice → Capability |
| `prodops/documentation-review.md` | Este arquivo |

---

## Hierarquia aplicada

```
Journey → Flow → Practice → Capability
```

**Exemplo completo:**

```
Journey: Downstream
  ↓
Flow: CI Sync → Hack
  ↓
Practice: ProdOps TDD
  (Contract First · Integration First · Observability First · Progressive Substitution · Non Intrusive Testing)
  ↓
Capability: Commit Workflow
  (formatter → lint → unit tests → commit-msg validation)
```

---

## Duplicações removidas

- `prodops/README.md` consolidado com portal único — removidas referências duplicadas a `current-state/` e `reliability-plan/`
- `AGENTS.md` reescrito com Source of Truth atualizado — removidas referências a caminhos antigos
- `prodops/delivery/README.md` reescrito com tabelas de flows + practices + capabilities — removido conteúdo duplicado de flows individuais
- `CLAUDE.md` simplificado para referenciar `AGENTS.md` como fonte principal

---

## Nova árvore de documentação (seleção)

```
prodops/
├── README.md                          (reescrito — portal)
├── framework/
│   ├── glossary.md
│   ├── operating-model.md             (NOVO)
│   └── principles.md
├── product/                           (ex current-state/)
│   ├── README.md                      (NOVO)
│   ├── features/
│   ├── icebox-backlog.md
│   ├── product-deck.md
│   ├── service-decks/
│   └── tracking-list.md
├── upstream/
├── assessment/
│   ├── README.md                      (reescrito)
│   ├── obcs/                          (ex reliability-plan/obcs/)
│   ├── risks.md                       (ex reliability-plan/risks.md)
│   ├── opportunities.md               (ex reliability-plan/opportunities.md)
│   ├── iteration-plans/               (NOVO)
│   │   ├── iteration-plan.md
│   │   └── iteration-backlog.md
│   └── reliability-plans/             (NOVO)
│       ├── README.md
│       ├── objectives.md
│       ├── premortem.md
│       └── setup/
├── delivery/
│   ├── README.md                      (reescrito)
│   ├── ci-sync.md                     (NOVO)
│   ├── ci-async.md                    (NOVO)
│   ├── flows/                         (NOVO)
│   │   ├── bootstrap.md
│   │   ├── hack.md
│   │   ├── sync-finish.md
│   │   └── ship-validate-promote.md
│   ├── practices/
│   │   ├── README.md
│   │   └── prodops-tdd.md             (ex tdd-prodops.md)
│   └── capabilities/                  (NOVO)
│       ├── README.md
│       ├── commit-workflow.md
│       ├── contract-management.md
│       ├── evidence-management.md
│       ├── observability.md
│       └── reliability.md
├── commit-workflow/                   (inalterado)
├── engineering/                       (inalterado)
├── downstream/                        (inalterado)
├── operation/                         (inalterado)
└── templates/
    ├── assessment/                    (NOVO)
    │   ├── decision-trail.md
    │   └── reliability-checklist.md
    ├── delivery/                      (NOVO)
    │   └── pull-request-checklist.md
    └── engineering/                   (NOVO)
        └── test-plan.md
```

---

## Links atualizados

Arquivos com links internos corrigidos (39 arquivos):

- `prodops/assessment/iteration-plans/iteration-backlog.md`
- `prodops/assessment/iteration-plans/iteration-plan.md`
- `prodops/assessment/obcs/api-token-validation.md`
- `prodops/assessment/obcs/create-invoice-boleto.md`
- `prodops/assessment/obcs/webhook-configuration.md`
- `prodops/assessment/README.md`
- `prodops/assessment/reliability-plans/README.md`
- `prodops/assessment/reliability-plans/objectives.md`
- `prodops/assessment/reliability-plans/setup/iteration-plan.prompt.md`
- `prodops/assessment/reliability-plans/setup/reliability-plan.prompt.md`
- `prodops/commit-workflow/templates/pull_request.md`
- `prodops/delivery/flows/bootstrap.md`
- `prodops/delivery/flows/hack.md`
- `prodops/delivery/flows/sync-finish.md`
- `prodops/delivery/flows/ship-validate-promote.md`
- `prodops/delivery/practices/README.md`
- `prodops/delivery/practices/prodops-tdd.md`
- `prodops/downstream/iteration-backlog.md`
- `prodops/downstream/release-trail.md`
- `prodops/engineering/definition-of-done.md`
- `prodops/engineering/observability-policy.md`
- `prodops/engineering/reliability-policy.md`
- `prodops/engineering/testing-policy.md`
- `prodops/framework/glossary.md`
- `prodops/framework/README.md`
- `prodops/product/icebox-backlog.md`
- `prodops/templates/assessment/reliability-checklist.md`
- `prodops/upstream/README.md`
- `prodops/upstream/features/README.md`
- `prodops/upstream/experiments/001-credit-card-lifecycle/experiment.md`
- `prodops/upstream/experiments/001-credit-card-lifecycle/upstream-trail.md`
- `prodops/upstream/experiments/004-feature-flag-readiness/experiment.md`
- `prodops/upstream/experiments/004-feature-flag-readiness/upstream-trail.md`
- `prodops/upstream/experiments/006-upstream-trail-per-experiment/upstream-trail.md`
- `prodops/upstream/upstream-trail.md`
- `skills/downstream/SKILL.md`
- `skills/hack/SKILL.md`
- `skills/sync/SKILL.md`
- `skills/upstream/SKILL.md`
- `skills/validate/SKILL.md`

---

## Pendências

- `prodops/downstream/release-trail.md` contém entradas históricas que referenciam os caminhos antigos (`prodops/current-state/`, `prodops/assessment/reliability-plan/`). Referências em texto histórico foram mantidas como registro de auditoria — apenas referências navegáveis foram corrigidas.
- `prodops/assessment/architecture/overview.md` não foi inspecionado nesta refatoração — pode conter referências a `current-state/`.
- `prodops/diligence/` não foi incluído na nova estrutura — considerar mover para `downstream/` ou `operation/` em iteração futura.

---

## Sugestões futuras

1. **Criar `prodops/product/service-decks/README.md`** — a pasta `service-decks/` agora está em `product/` mas não tem índice.
2. **Adicionar `prodops/upstream/obcs/README.md`** — distinguir OBCs exploratórios de OBCs comprometidos.
3. **Revisar `prodops/assessment/architecture/overview.md`** — pode referenciar caminhos antigos.
4. **Mover `prodops/diligence/`** — não está na nova estrutura; candidato para `downstream/` ou `operation/`.
5. **Criar `prodops/templates/README.md`** — índice das três subpastas `assessment/`, `delivery/`, `engineering/`.
