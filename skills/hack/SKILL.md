---
name: hack
description: Execute implementation work with TDD. Use when changing code, behavior, contracts, tests, or release artifacts as part of a ProdOps-backed task.
---

# HACK

Use this skill to implement the smallest coherent change that satisfies the
current ProdOps release context.

For detailed Codex execution mechanics, read `references/workflow.md`.

## Inputs

Read before editing:

- `AGENTS.md`
- ProdOps artifacts directly related to the requested capability in
  `prodops/current-state/`
- Reliability Plan sections directly related to the requested capability in
  `prodops/assessment/reliability-plan/`
- Relevant BDD Feature in `prodops/current-state/features/` (committed) or
  `prodops/upstream/features/` (exploratory)

Do not read the whole repository or the whole codebase by default. Read only:

- the module being changed;
- tests for that module or behavior;
- direct imports used by the changed code;
- shared contracts, DTOs, providers, repositories or helpers required to
  understand the change;
- package scripts needed for test, lint and build validation.

Expand reading only when the focused context shows that the behavior crosses a
module boundary.

## Flow

1. Confirm the requested behavior against ProdOps artifacts.
2. Create or select a focused branch.
3. Map the smallest module boundary that can satisfy the behavior.
4. Write or update a failing test first when behavior changes.
5. Implement the smallest change that makes the test pass.
6. Refactor only after tests are green.
7. Apply Clean Code rules while refactoring.
8. Run targeted validation first, then broader validation if shared behavior is
   affected.
9. Run lint for the affected package when a lint script exists.
10. Update only impacted ProdOps artifacts.
11. Append evidence to `prodops/downstream/release-trail.md`.

## Guardrails

- Do not copy product context into this skill.
- Do not invent missing acceptance criteria.
- Use BDD Features as the source for TDD scenarios.
- If TDD is not applicable, record why in the Release Trail evidence.
- Prefer focused code reading over broad repository reading.
- Do not change unrelated modules just because they were discovered during
  exploration.
- Keep functions small, names explicit and behavior easy to test.
- Preserve existing architecture and module boundaries unless the BDD or
  Reliability Plan requires a contract change.
- Avoid speculative abstractions. Add an abstraction only when it removes real
  duplication or matches an existing local pattern.

## Validation

Required evidence for code changes:

- red-phase focused test failure, when TDD applies;
- green focused test pass;
- relevant broader tests when shared behavior changed;
- lint result for the affected package when available.

Known repository commands:

- API lint: run `npm run lint` inside `api/`.
- API acceptance test: run `npm run test:acceptance` inside `api/` when payment
  behavior or contracts change.
- Validation Workbench: no lint script exists; run `npm run build` inside
  `validation-workbench/` for TypeScript and Vite validation.
