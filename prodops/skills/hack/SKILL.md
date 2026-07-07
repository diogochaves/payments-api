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
  `prodops/product/`
- Reliability Plan sections directly related to the requested capability in
  `prodops/assessment/reliability-plan/`
- Relevant BDD Feature in `prodops/artifacts/bdd/` (committed) or
  `prodops/journeys/discovery/features/` (exploratory)

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
11. If the change adds, removes, or renames a domain event (`eventEmitter.emit()`
    or `@OnEvent()`), update `prodops/assessment/event-storming/plan.json`:
    - add the new event to the relevant flow bands (negative_kpis, negative_trends,
      positive_kpis, positive_trends);
    - add both success and `_exception` variants to `customEvents`;
    - add an `sloSuggestions` entry if the event is on the critical path;
    - update `assumptions[last]` with the date and change summary.
    Use `prodops/assessment/event-storming/plan-model.json` as the format reference.
12. If the change is structural (new module, route, external dependency, table,
    or event topic), update `prodops/assessment/architecture/overview.md`:
    - edit the Mermaid diagram to reflect the change;
    - add a row to the History table with today's date and a one-line description.
12. Append evidence to `prodops/artifacts/trails/release-trail.md`.

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
- lint clean (`npm run lint` exits 0) for the affected package — mandatory, not optional.

Known repository commands:

- API lint+fix: `cd api && npm run lint` — runs ESLint with `--fix`; auto-corrects
  Prettier and fixable ESLint violations; remaining errors must be fixed in source.
  Run after green phase, after refactor, and before commit.
- API acceptance test: `./scripts/test-acceptance.sh` or `cd api && npm run test:acceptance`
  when payment behavior or contracts change.
- Validation Workbench: no lint script exists; run `npm run build` inside
  `validation-workbench/` for TypeScript and Vite validation.

Write code that satisfies the active lint rules from the start. See
`references/workflow.md` section **Code Style — Active Lint Rules** for the
Prettier and TypeScript constraints enforced in `api/`.
