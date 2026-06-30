---
name: ship
description: "Execute the SHIP engineering flow: perform final security, quality, TDD evidence, test, and review checks; summarize what changed and why; prepare or submit a pull request. Use when Codex is asked to ship work, finalize a branch, prepare a PR, review readiness, produce a PR description, or verify that a branch is safe to submit."
---

# SHIP

## Flow

1. Read `references/workflow.md`.
2. Confirm the branch and diff against the intended base.
3. Verify TDD evidence for behavior changes: failing test introduced first, implementation made it pass, refactor preserved green tests.
4. Run final quality gates: format/lint/build/tests appropriate to the changed files.
5. Run security checks for secrets, unsafe config, dependency changes, and accidental environment leakage.
6. Review the diff as if doing code review.
7. Produce a PR-ready summary with tests, TDD evidence, risks, and rollout notes.
8. Push and create a PR only when the user requested submission or repo convention clearly expects it.

## Quality Bar

- No unrelated changes in the PR.
- No committed secrets, real tokens, personal credentials, or local-only paths.
- Tests must cover changed behavior or the residual test gap must be explicit.
- Behavior changes must show TDD evidence or explain why TDD was not applicable.
- PR description must explain behavior, validation, and risk.

## Completion

Return final branch status, TDD evidence, validation results, security checks performed, PR description, and PR URL if submitted.
