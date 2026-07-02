---
name: validate
description: Validate release behavior with evidence, metrics, SLOs, and operational signals. Use when proving that an OBC, BDD scenario, or Reliability Plan item is satisfied.
---

# VALIDATE

Use this skill to prove release readiness with evidence.

## Inputs

- `AGENTS.md`
- Relevant OBCs under `prodops/`
- Relevant BDD Features in `prodops/current-state/features/`
- `prodops/assessment/reliability-plan/`
- `prodops/downstream/quality-gates.md`

## Flow

1. Identify the capability, OBC, or risk being validated.
2. Select tests, metrics, logs, events, or SLO evidence that prove it.
3. Run validation commands or inspect existing evidence.
4. Record exact commands, observed result, and remaining risk.
5. Update only impacted validation or reliability artifacts.
6. Append evidence to the Release Trail.

## Guardrails

- Do not invent metrics or SLOs.
- If an SLO is absent, record the gap in the appropriate ProdOps artifact.
- Prefer executable evidence over narrative claims.
