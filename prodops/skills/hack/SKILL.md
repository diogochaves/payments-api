---
name: hack
description: Execute implementation work with TDD. Use when changing code, behavior, contracts, tests, or release artifacts as part of a ProdOps-backed task.
---

# HACK

Use this skill to implement the smallest coherent change that satisfies the
current ProdOps release context. This skill is self-sufficient: do not pre-read
`AGENTS.md`, `prodops/framework/`, or any other framework documentation before
executing it.

For detailed execution mechanics (branching, code style, No Mocks Rule), read
`references/workflow.md` on demand.

## Contexto necessário

Read before editing — and only this:

- The card's **OBC** and **BDD Feature**. Canonical locations are defined in
  `prodops/exec/manifest.yaml`: `paths.obcs` (committed OBCs), `paths.bdd`
  (committed Features), or `paths.experiments` under
  `<NNN-slug>/features/` for exploratory work.

If the OBC or BDD Feature for the requested behavior is missing, stop and
surface the gap — Bootstrap was not completed. Do not invent acceptance
criteria.

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

## Focused code reading

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
Before starting, confirm the requested behavior exists in the OBC and BDD
Feature listed in Contexto necessário above.

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

## Quality gates

Gates are named and defined in `prodops/exec/manifest.yaml` (`gates:`). The
commands below are inlined for execution and must stay in agreement with the
manifest.

| Gate | Command | Pass criterion |
|---|---|---|
| `lint` | `cd api && npm run lint` | exit 0 — mandatory after every code change, not optional. Runs ESLint with `--fix`; auto-corrects Prettier and fixable violations; remaining errors must be fixed in source. Run after green phase, after refactor, and before commit. |
| `unit` | `cd api && npm run test` | exit 0 |
| `acceptance` | `./scripts/test-acceptance.sh` (or `cd api && npm run test:acceptance`) | exit 0 — required when payment behavior or contracts changed; runs the 4 acceptance suites and requires LocalStack |
| `no_mocks` | grep for `jest.fn(`, `.mockReturnValue(`, `.overrideProvider(`, `jest.mock(` in `api/src` and `api/test` | zero hits — see `references/workflow.md` (No Mocks Rule) |

Required evidence for code changes:

- red-phase focused test failure, when TDD applies;
- green focused test pass;
- relevant broader tests when shared behavior changed;
- `lint` gate clean for the affected package.

Validation Workbench note: `validation-workbench/` has no lint script; run
`npm run build` inside it for TypeScript and Vite validation.

Write code that satisfies the active lint rules from the start. See
`references/workflow.md` section **Code Style — Active Lint Rules** for the
Prettier and TypeScript constraints enforced in `api/`.
