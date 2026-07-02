# Payments API Agent Operating Guide

ProdOps is the single source of product context for this repository. Agents must
use the ProdOps artifacts as the decision base and must not invent missing
business context.

This repository supports two ProdOps work paths:

- Upstream: exploratory engineering that can produce executable code,
  prototypes, contracts, functional validation, and learning.
- Downstream: governed delivery through the full ProdOps execution flow.

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

Upstream is a complete exploratory engineering path. Its goal is to transform
hypotheses into validated knowledge before a capability is promoted to
Downstream.

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

Upstream has no delivery commitment. It has a learning commitment. Code
produced in Upstream is disposable until promoted to Downstream, but successful
code may be reused, refactored, or promoted during the Downstream flow.

The `validation-workbench/` is part of Upstream. Use it to validate functional
flows, OBC behavior, integrations, BDD scenarios, UX, and contracts before
promotion to Downstream.

Upstream does not need to follow the full flow:

```text
Hack -> Sync -> Finish -> Ship -> Validate -> Promote
```

Upstream work should turn uncertainty into clearer demand, executable evidence,
OBC input, BDD input, Reliability Plan input, Event Storming updates, or a
Downstream candidate.

Record Upstream work in:

```text
prodops/upstream/upstream-trail.md
```

Use this format:

```markdown
## YYYY-MM-DD HH:MM

### Experiment

### Business Goal

### Hypothesis

### Code Produced

### Validation Workbench Updated

### Contracts Updated

### BDD Updated

### Reliability Impact

### Result

### Learning

### Should move downstream?

### Next step
```

Do not overwrite previous entries.

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

- OBC;
- BDD;
- Reliability Plan;
- Iteration Backlog entry.

Downstream follows the full governed flow:

```text
Hack
-> Sync
-> Finish
-> Ship
-> Validate
-> Promote
```

Required Downstream sequence:

```text
AGENTS.md
-> Current State
-> Assessment
-> Reliability Plan
-> BDD Feature
-> Downstream Skill
-> Hack
-> Sync
-> Finish
-> Ship
-> Validate
-> Promote
-> Release Trail
```

Before changing production code or committed product artifacts:

1. Read `prodops/current-state/`, including `product-deck.md`,
   `service-decks/`, `tracking-list.md`, `icebox-backlog.md`, and
   `features/*.feature`.
2. Read `prodops/assessment/`, especially
   `prodops/assessment/reliability-plan/`.
3. Treat the Reliability Plan as the release execution contract.
4. Use BDD Features as the input for TDD whenever behavior changes.
5. Select the appropriate execution skill from `skills/`.
6. Update only artifacts that are actually impacted.
7. Register every relevant Downstream execution in
   `prodops/downstream/release-trail.md`.

## Execution Skills

- `skills/upstream/`: exploration path selection and evidence capture.
- `skills/downstream/`: governed delivery orchestration.
- `skills/hack/`: implementation with TDD.
- `skills/sync/`: review, consistency, and artifact updates.
- `skills/finish/`: quality gates and technical closure.
- `skills/ship/`: deploy preparation.
- `skills/validate/`: validation with evidence, metrics, and SLOs.
- `skills/promote/`: approval and release closure.

Skills describe how to execute work. They must point to ProdOps artifacts for
product context instead of copying business knowledge into the skill.

## Context Rules

- Never invent absent context, requirements, risks, OBCs, SLOs, or acceptance
  criteria.
- If a business decision is missing, record the gap and ask for clarification or
  leave an explicit follow-up.
- Prefer existing BDD, ODD, OBC, Reliability Plan, and Product Deck language
  over new terminology.
- Preserve existing code architecture unless the relevant ProdOps artifact asks
  for a contract or capability change.
- Keep Upstream findings reversible until Downstream accepts the work.

## Downstream Release Trail

After each relevant Downstream task, append a concise entry to:

```text
prodops/downstream/release-trail.md
```

Use this format:

```markdown
## YYYY-MM-DD HH:MM

### What changed?

### Why?

### Related OBC

### Related BDD

### Evidence

### Next steps
```

Do not overwrite previous entries.
