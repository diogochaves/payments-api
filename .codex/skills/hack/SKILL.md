---
name: hack
description: "Execute the HACK engineering flow using traditional TDD: create a feature branch, understand the requested behavior, write a failing test first, implement the smallest code to pass, refactor safely, validate locally, and create a clean commit. Use when Codex is asked to start feature work, implement a task end to end, fix a bug, or turn a requirement into committed code."
---

# HACK

## Flow

1. Read `references/workflow.md`.
2. Inspect the repository before editing. Identify stack, scripts, test commands, and existing patterns.
3. Check git state:
   ```sh
   git status --short
   git branch --show-current
   git remote -v
   ```
4. Protect existing user work. Do not overwrite or stage unrelated changes.
5. Create a feature branch from the intended base. If the base is unclear, infer from `origin/HEAD`, `main`, `master`, or the current team convention.
6. Use traditional TDD for behavior changes: red, green, refactor.
7. Write or update the smallest failing test that describes the required behavior before implementation.
8. Run the targeted test and confirm it fails for the expected reason.
9. Implement the smallest coherent code change that makes the test pass.
10. Refactor only after tests are green, preserving behavior.
11. Run targeted validation first, then broader validation when the change affects shared behavior.
12. Review the diff and stage only files belonging to this work.
13. Commit with a clear message.

## TDD Rules

- Start with a failing test for any feature, bug fix, contract change, or regression.
- Keep the red phase honest: the failure must prove the missing behavior, not a syntax or setup error.
- Keep the green phase small: do not batch unrelated improvements into the passing implementation.
- Refactor with tests green, and rerun the relevant tests after refactoring.
- If a change cannot reasonably be test-first, state why and choose the smallest alternative validation.

## Commit Rules

- Use a conventional-style prefix when it fits: `feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`.
- Include code and tests in the same commit unless the user asked for split commits.
- Do not commit generated build output unless it is already tracked and required.
- If commit cannot be created because git identity or hooks fail, report the exact blocker and leave the worktree ready.

## Completion

Return the branch name, TDD evidence, commit hash if created, validation commands run, and any remaining risks.
