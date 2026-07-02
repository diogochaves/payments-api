---
name: downstream
description: Execute governed ProdOps delivery. Use when implementing approved backlog items, following the Reliability Plan, applying TDD, updating OBCs, running quality gates, validating observability, shipping, or promoting release work.
---

# DOWNSTREAM

Use this skill for standardized, traceable delivery.

## Inputs

- `AGENTS.md`
- `prodops/current-state/`
- `prodops/assessment/reliability-plan/`
- `prodops/downstream/iteration-backlog.md`
- Relevant BDD Feature in `prodops/current-state/features/`
- Relevant quality gates in `prodops/downstream/quality-gates.md`

## Flow

1. Confirm the item is approved for Downstream via the Iteration Backlog or an
   explicit release decision.
2. Read the relevant Current State, Assessment, Reliability Plan, and BDD
   Feature.
3. Execute the full flow:
   `Hack -> Sync -> Finish -> Ship -> Validate -> Promote`.
4. Use TDD for behavior changes.
5. Update impacted OBCs, BDDs, Reliability Plan items, and operational artifacts.
6. Validate with concrete evidence.
7. Append delivery evidence to `prodops/downstream/release-trail.md`.

## Guardrails

- Do not ship work that only has Upstream evidence.
- Do not skip Quality Gates without recording the reason and risk.
- Do not duplicate product context inside skills.
- Do not promote unresolved high-risk items without explicit acceptance.
