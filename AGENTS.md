# Payments API Agent Operating Guide

ProdOps is the single source of product context for this repository. Agents must use the ProdOps artifacts as the decision base and must not invent missing business context.

## Como ler o ProdOps neste repositório

Leia nesta ordem para qualquer tarefa:

1. `prodops/README.md` — índice e mapa de navegação do framework
2. `prodops/framework/principles.md` — princípios do framework
3. `prodops/delivery/README.md` — visão geral do ProdOps Delivery (CI Sync / CI Async)
4. Identifique se a tarefa pertence ao **CI Sync** (implementação) ou **CI Async** (pipeline/deploy)
5. Se for implementação → `prodops/delivery/hack-flow.md`
6. Durante Hack → `prodops/delivery/practices/tdd-prodops.md`
7. Durante Hack, Sync e Finish → `prodops/commit-workflow/README.md`
8. Se for pipeline/deploy → `prodops/delivery/ship-validate-promote-flow.md`

---

## Source Of Truth

- Product context: `prodops/current-state/`
- Release assessment: `prodops/assessment/`
- Upstream exploration: `prodops/upstream/`
- Downstream delivery: `prodops/downstream/`
- Execution contract: `prodops/assessment/reliability-plan/`
- Operational evidence: `prodops/operation/`

## Upstream Path

Use Upstream when the task is to:

- explore;
- experiment;
- implement quickly;
- prototype;
- investigate;
- validate a hypothesis;
- refine an OBC;
- prepare a BDD;
- investigate a technical solution;
- understand impact before taking delivery commitment.

Upstream is a complete exploratory engineering path. Its goal is to transform hypotheses into validated knowledge before a capability is promoted to Downstream.

During Upstream, agents may:

- implement code;
- create endpoints;
- create integrations;
- update OpenAPI contracts;
- update AsyncAPI contracts;
- create or update BDD Features;
- create automated tests when useful;
- create functional validation interfaces;
- update documentation;
- evolve OBCs;
- update the Reliability Plan;
- update Event Storming;
- update the Tracking List;
- produce evidence for a delivery decision.

Upstream has no delivery commitment. It has a learning commitment. Code produced in Upstream is disposable until promoted to Downstream, but successful code may be reused, refactored, or promoted during the Downstream flow.

The `validation-workbench/` is part of Upstream. Use it to validate functional flows, OBC behavior,integrations, BDD scenarios, UX, and contracts before promotion to Downstream.

Upstream does not need to follow the full flow:

```text
Bootstrap -> Hack -> Sync -> Finish -> Ship -> Validate -> Promote
```

Upstream work should turn uncertainty into clearer demand, executable evidence, OBC input, BDD input, Reliability Plan input, Event Storming updates, or a Downstream candidate.

Record Upstream work in the trail owned by the active experiment:

```text
prodops/upstream/experiments/<id>-<slug>/upstream-trail.md
```

Use this format for the experiment trail:

```text
templates/upstream-trail.md
```

New Upstream experiments must use a directory:

```text
prodops/upstream/experiments/<id>-<slug>/experiment.md
prodops/upstream/experiments/<id>-<slug>/upstream-trail.md
prodops/upstream/experiments/<id>-<slug>/evidence/
```

Keep `prodops/upstream/experiments.md` as the index of experiments. Keep
`prodops/upstream/upstream-trail.md` only as a global chronological index for
cross-experiment milestones, migrations, promotions, or repository-wide
Upstream process changes. Do not overwrite previous entries.

## Downstream Path

Use Downstream when the task is to:

- implement an approved Iteration Backlog item;
- follow the Reliability Plan;
- apply TDD from BDD Features;
- update OBCs;
- execute Quality Gates;
- register Release Trail evidence;
- validate observability, metrics, or SLOs;
- prepare standardized delivery.

Every Downstream item must have:

- OBC — placed in `prodops/assessment/reliability-plan/obcs/`;
- BDD Feature — placed in `prodops/current-state/features/`;
- Reliability Plan entry;
- Iteration Backlog entry.

`prodops/upstream/features/` and `prodops/upstream/obcs/` are for exploratory
capabilities tied to active experiments only. Do not create Downstream BDD
Features or OBCs there, even as drafts.

Downstream follows the full governed flow, organized in two groups:

```text
CI Sync (trabalho local, síncrono)
  Bootstrap → Hack → Sync → Finish

CI Async (plataforma, pipelines, ambientes)
  Ship → Validate → Promote
```

Required Downstream sequence:

```text
AGENTS.md
-> Current State
-> Assessment
-> Reliability Plan
-> BDD Feature
-> Bootstrap         (branch + contexto ProdOps)
-> Hack              (ProdOps TDD + Commit Workflow)
-> Sync              (consistência de artefatos)
-> Finish            (Quality Gates + PR)
-> Ship              (Preparation + Deployment)
-> Validate          (runtime + SLO + observabilidade)
-> Promote           (aprovação + Release Trail)
```

Before changing production code or committed product artifacts:

1. Read `prodops/current-state/`, including `product-deck.md`, `service-decks/`, `tracking-list.md`, and `icebox-backlog.md`. Read committed BDD Features in `prodops/current-state/features/` and exploratory features in `prodops/upstream/features/`.
2. Read `prodops/assessment/`, especially `prodops/assessment/reliability-plan/`.
3. Treat the Reliability Plan as the release execution contract.
4. Use BDD Features as the input for TDD whenever behavior changes. If the BDD Feature does not exist yet for a Downstream item, create it in `prodops/current-state/features/` before writing code.
5. If the OBC does not exist yet for a Downstream item, create it in `prodops/assessment/reliability-plan/obcs/` before writing code.
6. Select the appropriate execution skill from `skills/`.
7. Update only artifacts that are actually impacted.
8. **If the change is structural** — new module, route group, external dependency, database table, or event topic — update `prodops/assessment/architecture/overview.md` before closing the task. Add a row to the History table in that file.
9. Register every relevant Downstream execution in `prodops/downstream/release-trail.md`.

## Event Storming (ODD Plan)

The canonical event map lives at:

```text
prodops/assessment/event-storming/plan.json
```

Use `prodops/assessment/event-storming/plan-model.json` as the structural
reference format. The `plan.json` is generated and updated — never edit the
model file.

**Event naming convention:** `{dominio}.{subdominio}.{touchpoint}.{fato}`
(all lowercase, dot-separated). Every business event must have a companion
`{event-key}_exception` variant for failure observability.

**Update `plan.json` when any of the following changes:**

- A new `eventEmitter.emit()` or `@OnEvent()` is added or removed
- An existing domain event gains or loses fields that change its business meaning
- A new flow (happy path or alternative path) is identified
- An existing flow changes sequence or gains/loses steps

**Do not update `plan.json` for:** internal refactors without event contract
change, new DTO fields that don't affect event payloads, bugfixes that preserve
existing event semantics.

When updating, follow the band structure: for each new event add widgets to
`{flow}_negative_kpis`, `{flow}_negative_trends`, `{flow}_positive_kpis`,
`{flow}_positive_trends` bands and a `customEvents` entry (both success and
exception variants). Add an `sloSuggestions` entry for events on the critical
path.

## Architecture Diagram

The canonical architecture diagram lives at:

```text
prodops/assessment/architecture/overview.md
```

It is the single source of truth for the system's structural shape. The diagram
is referenced by `prodops/current-state/product-deck.md` (section 6).

**Structural changes** that require updating the diagram:

- New or removed NestJS module
- New or removed controller / route group
- New or removed external dependency (gateway, broker, provider)
- New or removed database table or GSI
- New or removed event topic or queue
- Authentication mechanism change on a route group

**Not** structural: DTO field additions, bug fixes inside an existing service,
new BDD scenarios without new infrastructure, internal refactors without contract
change.

## Execution Skills

- `skills/upstream/`: exploration path selection and evidence capture.
- `skills/downstream/`: governed delivery orchestration.
- `skills/hack/`: implementation with TDD.
- `skills/sync/`: review, consistency, and artifact updates.
- `skills/finish/`: quality gates and technical closure.
- `skills/ship/`: deploy preparation.
- `skills/validate/`: validation with evidence, metrics, and SLOs.
- `skills/promote/`: approval and release closure.

Skills describe how to execute work. They must point to ProdOps artifacts for product context instead of copying business knowledge into the skill.

## Context Rules

- Never invent absent context, requirements, risks, OBCs, SLOs, or acceptance criteria.
- If a business decision is missing, record the gap and ask for clarification or leave an explicit follow-up.
- Prefer existing BDD, ODD, OBC, Reliability Plan, and Product Deck language over new terminology.
- Preserve existing code architecture unless the relevant ProdOps artifact asks for a contract or capability change.
- Keep Upstream findings reversible until Downstream accepts the work.

## Downstream Release Trail

After each relevant Downstream task, append a concise entry to:

```text
prodops/downstream/release-trail.md
```

Use this format:

```text
templates/downstream-release-entry.md
```

Do not overwrite previous entries.

## Hack Flow com ProdOps TDD

O Hack é o estágio central do CI Sync. Consome duas capabilities:

- **ProdOps TDD** — como implementar. Sequência completa (3 fases): [prodops/delivery/hack-flow.md](prodops/delivery/hack-flow.md)
- **Commit Workflow** — como validar, versionar e publicar: [prodops/commit-workflow/README.md](prodops/commit-workflow/README.md)

Referências adicionais: [ProdOps TDD](prodops/delivery/practices/tdd-prodops.md) · [Definition of Done](prodops/engineering/definition-of-done.md) · [Testing Policy](prodops/engineering/testing-policy.md)

### Checklist de fechamento do Hack

1. [ ] Contrato identificado ou criado.
2. [ ] Red Bar confirmado.
3. [ ] Lint passa (`npm run lint` exit 0 em `api/`).
4. [ ] Formatter executado.
5. [ ] `./scripts/test-acceptance.sh` — quando comportamento de pagamento ou contratos mudaram.
6. [ ] Observabilidade validada (logs, correlationId, sem PII).
7. [ ] Confiabilidade verificada (timeout, idempotência, exceções, HTTP codes).
8. [ ] Commits seguem Conventional Commits.
9. [ ] Evidências registradas no trail.

### Handling conflicts

When a new guideline conflicts with an existing rule in this repository (lint config, CI/CD workflow, test structure, architecture boundary), **preserve the existing rule** and record the conflict in a [Decision Trail](prodops/templates/decision-trail.md) entry. Do not silently override existing constraints.
