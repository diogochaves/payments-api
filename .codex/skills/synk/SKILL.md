---
name: synk
description: "Execute the SYNK engineering flow: check whether newer remote code exists, fetch and update local base branches, bring the latest base into the current work branch, resolve conflicts, preserve the branch's TDD evidence, and validate the synchronized result. Use when Codex is asked to sync, update from main, refresh a branch, resolve merge conflicts, or ensure a feature branch is current."
---

# SYNK

## Flow

1. Read `references/workflow.md`.
2. Inspect the worktree and current branch.
3. Fetch remote updates with pruning.
4. Identify the base branch and compare local, remote, and feature branch commits.
5. Update the local base using fast-forward only.
6. Bring the updated base into the feature branch with the repository's preferred strategy.
7. Resolve conflicts by preserving intended behavior from both sides.
8. Preserve or repair tests that encode the branch behavior.
9. Run validation for touched areas.
10. Leave the branch clean or clearly report remaining conflicts/blockers.

## Safety Rules

- Never discard local changes.
- Never force-push or rewrite shared branch history unless the user explicitly requests it.
- Do not auto-stash unknown user work without approval.
- If conflicts occur, inspect both sides before editing.
- After conflict resolution, run tests that cover the conflicted files.
- Do not delete or weaken tests just to make synchronization pass.
- If upstream changed behavior, update tests first to express the merged expected behavior, then update code.

## Completion

Return the base branch used, commits brought in, conflict files if any, validation commands run, and final git status.
