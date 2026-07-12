---
name: hack
description: Execute implementation work with TDD. Use when changing code, behavior, contracts, tests, or release artifacts as part of a ProdOps-backed task.
---

# HACK

Use this skill to implement the smallest coherent change that satisfies the
current ProdOps release context.

For detailed Codex execution mechanics, read `references/workflow.md`.

## Steps

When invoked with a step argument (`/hack <step>`), execute only that step
instead of the full flow. Read the corresponding step file and follow it
exclusively — do not run the rest of the flow.

| Step | File | When to use |
|---|---|---|
| `start` | [steps/start/SKILL.md](steps/start/SKILL.md) | Clean stage, sync base branch, create feature branch |
| `tdd` | [steps/tdd/SKILL.md](steps/tdd/SKILL.md) | Execute red → green → yellow cycle with artifact closure |
| `commit` | [steps/commit/SKILL.md](steps/commit/SKILL.md) | Stage and commit after green + lint + trail |

If the requested step is not listed, run the full flow.

## Inputs

Read before editing:

- `AGENTS.md`
- ProdOps artifacts directly related to the requested capability in
  `prodops/artifacts/product/`
- Reliability Plan sections directly related to the requested capability in
  `prodops/journeys/assessment/reliability-plans/`
- Relevant BDD Feature in `prodops/artifacts/bdd/` (committed) or
  `prodops/journeys/discovery/experiments/<NNN-slug>/features/` (exploratory)

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

When invoked without a step argument, execute the three steps in sequence.
Before starting, confirm the requested behavior exists in the ProdOps artifacts
listed in Inputs above.

1. **[start](steps/start/SKILL.md)** — clean working tree, sync base branch, create feature branch
2. **[tdd](steps/tdd/SKILL.md)** — Red → Green → Yellow TDD cycle with artifact closure
3. **[commit](steps/commit/SKILL.md)** — stage, review diff, commit with Conventional Commit

## Guardrails

- Do not copy product context into this skill.
- Do not invent missing acceptance criteria.
- Use BDD Features as the source for TDD scenarios.
- If TDD is not applicable, record why in the Release Trail evidence.
- Prefer focused code reading over broad repository reading.
- Do not change unrelated modules just because they were discovered during
  exploration.
- Preserve existing architecture and module boundaries unless the BDD or
  Reliability Plan requires a contract change.

For Clean Code rules (naming, functions, refactoring) see
[`../references/engineering/clean-code/`](../references/engineering/clean-code/README.md).

## Engineering References

| Area | File | When to read |
|---|---|---|
| Clean Code | [`../references/engineering/clean-code/`](../references/engineering/clean-code/README.md) | Naming, functions, refactoring, error handling |
| TDD ProdOps | [`../references/engineering/tdd-prodops/`](../references/engineering/tdd-prodops/README.md) | Red/green/yellow cycle, mocking policy, quality gates |
| DDD | [`../references/engineering/ddd/`](../references/engineering/ddd/README.md) | Aggregates, repositories, domain events, ubiquitous language |

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
