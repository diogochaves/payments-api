---
name: hack/bootstrap
description: Prepare the working environment before starting implementation. Use at the start of a Hack session to ensure a clean stage, an updated base branch, and a correctly named feature branch.
---

# HACK → BOOTSTRAP

Legacy shortcut for branch and working-tree preparation.

For full Downstream phase preparation, use `prodops/skills/bootstrap/SKILL.md`.
Execute this step only when the ProdOps prerequisites are already verified and
the remaining need is local branch setup.

## Action

1. **Review the working tree.**
   Run `git status`. If uncommitted changes exist:
   - If they belong to a previous unfinished task: commit or stash with `-u` before proceeding.
   - If they are unrelated noise: remove or stash.
   - Never discard work silently — confirm intent before any destructive operation.

2. **Identify the base branch.**
   Determine the branch to diverge from (typically `main` or the branch declared in the task context).

3. **Sync the base branch.**
   ```bash
   git fetch origin --prune
   git checkout <base>
   git merge --ff-only origin/<base>
   ```
   If fast-forward fails, surface the conflict — do not force-merge.

4. **Create or switch to the feature branch.**
   - If a branch for this capability already exists: `git checkout <branch>`.
   - If creating new: use the naming convention `<type>/<short-slug>` derived from the capability name.
     - Examples: `feat/api-token-db`, `fix/invoice-external-ref`, `chore/prodops-tdd-steps`
   - Branch from the updated base: `git checkout -b <branch>`.

5. **Confirm the starting point.**
   Run `git log --oneline -5` and `git status` to confirm the branch is clean and diverges from the correct base commit.

## Post-conditions

- Working tree is clean (no unrelated staged or unstaged changes).
- Base branch is up-to-date with `origin`.
- Current branch is the correct feature branch, diverging from the updated base.

## Guardrails

- Do not start implementation on `master`, `main`, or a shared base branch.
- Do not carry uncommitted changes from a previous task into the new branch.
- Do not create the branch from a stale local base — always sync first.
- If the feature branch already exists and has diverged, run `/sync` before continuing.
