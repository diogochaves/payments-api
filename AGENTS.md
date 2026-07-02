# Payments API Agent Operating Guide

ProdOps is the single source of product context for this repository. Any agent
working here must use the ProdOps artifacts as the decision base and must not
invent missing business context.

## Source Of Truth

- Product context: `prodops/current-state/`
- Release assessment: `prodops/assessment/`
- Execution contract: `prodops/assessment/reliability-plan/`
- Release evidence: `prodops/diligence/release-trail.md`
- Operational evidence: `prodops/operation/`

## Required Flow

Follow this sequence for meaningful work:

```text
AGENTS.md
-> Current State
-> Assessment
-> Reliability Plan
-> BDD Feature
-> Appropriate Skill
-> Code
-> Release Trail
```

Before changing code or product artifacts:

1. Read `prodops/current-state/`, including `product-deck.md`,
   `service-decks/`, `tracking-list.md`, `icebox-backlog.md`, and
   `features/*.feature`.
2. Read `prodops/assessment/`, especially
   `prodops/assessment/reliability-plan/`.
3. Treat the Reliability Plan as the release execution contract.
4. Use BDD Features as the input for TDD whenever behavior changes.
5. Select the appropriate execution skill from `skills/`.
6. Update only artifacts that are actually impacted.
7. Register every relevant execution in `prodops/diligence/release-trail.md`.

## Execution Skills

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

## Release Trail

After each relevant task, append a concise entry to:

```text
prodops/diligence/release-trail.md
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
