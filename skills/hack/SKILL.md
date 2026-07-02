---
name: hack
description: Execute implementation work with TDD. Use when changing code, behavior, contracts, tests, or release artifacts as part of a ProdOps-backed task.
---

# HACK

Use this skill to implement the smallest coherent change that satisfies the
current ProdOps release context.

## Inputs

Read before editing:

- `AGENTS.md`
- `prodops/current-state/`
- `prodops/assessment/reliability-plan/`
- Relevant BDD Feature in `prodops/current-state/features/`

## Flow

1. Confirm the requested behavior against ProdOps artifacts.
2. Create or select a focused branch.
3. Write or update a failing test first when behavior changes.
4. Implement the smallest change that makes the test pass.
5. Refactor only after tests are green.
6. Run targeted validation first, then broader validation if shared behavior is
   affected.
7. Update only impacted ProdOps artifacts.
8. Append evidence to `prodops/diligence/release-trail.md`.

## Guardrails

- Do not copy product context into this skill.
- Do not invent missing acceptance criteria.
- Use BDD Features as the source for TDD scenarios.
- If TDD is not applicable, record why in the Release Trail evidence.
