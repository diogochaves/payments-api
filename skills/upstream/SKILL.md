---
name: upstream
description: Execute ProdOps exploratory engineering. Use when exploring, experimenting, implementing disposable code, creating endpoints or integrations, updating contracts, building prototypes, validating hypotheses, refining OBCs, preparing BDDs, updating Reliability Plan or Event Storming, updating the Validation Workbench, or turning uncertainty into Downstream-ready work.
---

# UPSTREAM

Use this skill for exploratory engineering before delivery commitment.
Upstream can produce executable code, prototypes, contracts, functional
validation, tests, and ProdOps artifact updates. The commitment is learning, not
delivery.

## Inputs

- `AGENTS.md`
- `prodops/current-state/`
- `prodops/assessment/reliability-plan/`
- `prodops/assessment/event-storming/plan.json`
- `prodops/current-state/tracking-list.md`
- Existing exploration notes in `prodops/upstream/`

## Flow

1. Read Current State.
2. Read the Reliability Plan.
3. Read Event Storming.
4. Read the Tracking List.
5. Formulate the hypothesis and business goal.
6. Implement code when necessary.
7. Update `validation-workbench/` when functional validation is useful.
8. Update OpenAPI, AsyncAPI, or other contracts when the experiment changes a
   contract hypothesis.
9. Update or create BDD Features when behavior is being explored.
10. Update OBCs, Reliability Plan, Event Storming, Tracking List, or docs only
    when the experiment produces evidence.
11. Register learning in `prodops/upstream/upstream-trail.md`.
12. Explicitly decide whether the capability is ready for Downstream and justify
    the decision.

## Guardrails

- Do not use Upstream to bypass Downstream governance for committed delivery.
- Do not invent product context or acceptance criteria.
- Treat all Upstream code as disposable until promoted.
- If successful, Upstream code can be reused, refactored, or promoted during the
  Downstream flow.
- Do not ship from Upstream.
- Always record whether the capability is ready for Downstream.
- Do not duplicate Product Deck, Service Deck, BDD, OBC, Reliability Plan, or
  Event Storming content inside the skill.
