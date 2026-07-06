# HACK Workflow

HACK is the implementation phase. The agent repeats the work engineers did manually: branch, focused reading, TDD, code, lint, validation, commit.

## Branch

- Start from a clean understanding of the current branch and worktree.
- If there are unrelated dirty files, leave them untouched and mention them.
- If the user did not provide a branch name, create one from the task:
  - Feature: `feat/<short-slug>`
  - Fix: `fix/<short-slug>`
  - Chore: `chore/<short-slug>`
- Prefer `git switch -c <branch>` for new branches.
- Do not use `git reset --hard`, `git checkout -- <file>`, or destructive cleanup.

## Implementation

- Read focused code before editing. Start with the module being changed, its tests, and the direct imports needed to understand the change.
- Do not read the entire codebase by default. Expand only when the behavior crosses module boundaries or the focused context is insufficient.
- Follow existing module boundaries, naming, DTOs, env vars, and scripts.
- Prefer small changes that preserve current architecture.
- Add abstractions only when they remove real duplication or match an existing local pattern.
- For this payments-api repository, read `skills/payments-api-local-testing/references/repository-standards.md` before changing payment behavior.

## Code Style — Active Lint Rules

The `api/` package enforces these rules via `eslint.config.mjs`. Write code that satisfies them from the start; do not leave formatting to a post-edit fix pass.

**Prettier** (auto-fixable — enforced via `eslint-plugin-prettier`):
- Single quotes for strings.
- Trailing commas in multi-line arrays, objects, and parameter lists.
- No semicolons at end of statements (the project uses them — do not remove).
- 2-space indentation.
- Max line width: 100 characters. Break long argument lists and object literals across lines.
- Opening brace on same line (`if (x) {`); closing brace on its own line.

**TypeScript strict** (`tseslint.configs.recommendedTypeChecked`):
- No `any` explicit type (rule is off, but avoid it anyway — use `unknown` or a concrete type).
- No floating promises: every `async` call that returns a promise must be `await`ed or explicitly `void`-cast.
- No unsafe argument: do not pass `any`-typed values to typed parameters.
- Unused variables and imports cause lint errors — remove them immediately.

**Practical rule:** after writing a file, mentally apply Prettier line-break rules before saving. Multi-line object literals need a trailing comma on the last property. Import lists with 3+ items should be multi-line.

## Clean Code

- Keep the implementation cohesive and close to the behavior being changed.
- Use explicit names for domain concepts, contracts, events, provider mappings, and test scenarios.
- Prefer simple control flow over clever abstractions.
- Keep functions small enough to show their main decision path.
- Preserve dependency direction and module boundaries.
- Avoid drive-by cleanup, speculative refactors, and broad formatting churn.

## TDD Cycle

Use classical TDD (Detroit school) for behavior changes. Classical TDD verifies observable state — HTTP responses and database state — not interactions or call sequences.

1. Red: write or update a focused test that expresses the desired behavior.
2. Run the focused test and confirm it fails for the expected behavioral reason.
3. Green: implement the smallest production change to pass the test.
4. Run the focused test and confirm it passes.
5. Refactor: improve structure only while preserving behavior.
6. Rerun the focused test after refactoring.

Good TDD evidence includes:

- The test file and scenario added or changed.
- The failing command and failure reason from the red phase.
- The passing command from the green/refactor phase.

Do not skip the red phase unless the task is documentation-only, mechanical cleanup, dependency maintenance, or an explicitly untestable operational change. If skipped, record why.

## No Mocks Rule

> **Definição técnica canônica.** O gate de enforcement (o que bloqueia merge) está em [`prodops/downstream/quality-gates.md`](../../../prodops/downstream/quality-gates.md).

**Acceptance and integration tests never use test doubles.** This is an unconditional rule.

Prohibited in `api/test/`:

- `jest.fn()` as a service replacement
- `jest.spyOn(...).mockImplementation()`, `.mockReturnValue()`, `.mockResolvedValue()`, `.mockRejectedValue()` and all `mockXxx` variants
- `.overrideProvider()` in `Test.createTestingModule()`
- Any class, object, or function that replaces a real owned service with a test-controlled substitute

**`ASAAS_MOCK=true` is not a mock.** It is a designed behavior mode of the real `AsaasService`. The real service is instantiated and runs; it returns deterministic data via an internal branch rather than making HTTP calls. This is acceptable because it exercises the real code path.

**Error paths that require external system failure** (provider timeout, provider returning malformed data, network errors) are not covered by acceptance tests. Those scenarios belong in focused unit or service-layer tests that can use test doubles because they test a single unit in isolation. Acceptance tests cover the contract visible at the HTTP boundary using only the real system.

**Shared app per file.** Each acceptance test file creates the NestJS app once in `beforeAll` and tears it down in `afterAll`. Tables are truncated in `beforeEach`. Recreating the app per test is prohibited — it bypasses shared state that the real system maintains and makes test runs artificially expensive.

## Tests and Validation

- Add or update tests close to the touched behavior.
- Use existing test frameworks and scripts.
- Run the narrowest meaningful test first.
- Run broad validation before committing when shared behavior, contracts, or build config changed.

**Lint is mandatory after every code change in `api/`.** Run it with `--fix` so Prettier and auto-fixable ESLint violations are corrected in place. TypeScript type errors are not auto-fixable — they must be resolved in the source.

```sh
# Inside api/
npm run lint        # runs eslint "{src,apps,libs,test}/**/*.ts" --fix
```

Run lint:
1. After implementing the green phase.
2. After refactoring.
3. Before committing — always.

If lint exits non-zero after `--fix`, read the remaining errors, fix them in the source, and re-run until clean.

In `validation-workbench/`, no lint script exists; run `npm run build` for TypeScript and Vite validation.

## Commit

Before committing:

```sh
git diff --check
git status --short
git diff --stat
```

Stage only files that belong to the task:

```sh
git add <paths>
git diff --cached --stat
git diff --cached --check
```

Commit:

```sh
git commit -m "<type>: <concise summary>"
```

After committing:

```sh
git status --short
git rev-parse --short HEAD
```
