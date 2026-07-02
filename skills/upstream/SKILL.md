---
name: upstream
description: Execute lightweight ProdOps exploration. Use when exploring, experimenting, prototyping, investigating, validating hypotheses, refining OBCs, preparing BDDs, or turning uncertainty into Downstream-ready work.
---

# UPSTREAM

Use this skill for fast, reversible exploration before delivery commitment.

## Inputs

- `AGENTS.md`
- Relevant context from `prodops/current-state/`
- Relevant assessment or uncertainty from `prodops/assessment/`
- Existing exploration notes in `prodops/upstream/`

## Flow

1. State the question, hypothesis, or uncertainty.
2. Decide the lightest useful activity: experiment, spike, prototype, contract
   check, BDD exploration, OBC refinement, or Reliability Plan input.
3. Keep changes reversible and avoid production architecture commitment.
4. Capture evidence and learning.
5. Decide whether the result should move Downstream.
6. Record the activity in `prodops/upstream/upstream-trail.md`.
7. Update only impacted ProdOps artifacts when evidence supports the update.

## Guardrails

- Do not use Upstream to bypass Downstream governance for committed delivery.
- Do not invent product context or acceptance criteria.
- Do not duplicate Product Deck, Service Deck, BDD, OBC, or Reliability Plan
  content inside the skill.
- If the work becomes delivery scope, move it to Downstream before shipping.
