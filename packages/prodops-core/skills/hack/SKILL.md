---
name: hack
description: Execute implementation work with TDD. Use when changing code, behavior, contracts, tests, or release artifacts as part of a ProdOps-backed task.
---

# HACK

Implement the smallest coherent change that satisfies the current release
context. Three steps, in order: **start → tdd → commit**. When invoked with a
step argument (`/hack <step>`), execute only that step.

## Inputs

- The card's context capsule (`paths.cards/<card>/context.md`) if it exists;
  otherwise the relevant OBC (`paths.obcs`) and BDD Feature (`paths.bdd`).
- The module being changed, its tests, direct imports, and shared contracts.

Do not read the whole repository. Expand reading only when the focused context
shows the behavior crosses a module boundary.

## Step 1 — START (prepare the branch)

1. Run `git status`. If the tree is not clean, surface the options and wait:
   **commit** (work is complete — run `/hack commit`, then return),
   **stash** (`git stash -u`, unrelated work), or **stop** (scope unclear —
   report a blocker). Never discard uncommitted work silently.
2. Checkout the base branch (ask if not given), then sync it:
   `git fetch origin --prune && git merge --ff-only origin/<base>`.
   If fast-forward fails the base has diverged — surface it, do not force.
3. Create the feature branch from the updated base:
   `git checkout -b <type>/<short-slug> --track origin/<base>` where `<type>`
   is one of `vocabulary.commit_types`. If the branch already exists, switch
   to it; if it has diverged, run `/sync` before continuing.
4. Confirm: `git log --oneline -5` shows the right base; tree is clean.

## Step 2 — TDD (Red → Green → Yellow)

**Red — write the failing test.** Derive the scenario from the BDD Feature or
OBC — never invent criteria. Write the narrowest test that fails because the
behavior does not exist yet. Run it; confirm it fails for the right reason
(missing behavior, not a syntax or import error). Record the output as evidence.

**Green — implement the minimum.** Write the smallest change that makes the
failing test pass. No refactoring, no behavior beyond the test. Run the focused
suite; run broader tests if shared behavior was touched. Record the output.

**Yellow — quality and artifact closure.**
1. Refactor: improve names, remove duplication — behavior unchanged. Re-run
   tests after each refactor step to stay green.
2. Run the `lint` gate from `manifest.yaml`; it must meet its `expect`.
   Do not suppress rules without justification.
3. If the change is structural (new module, route, external dependency, event),
   update the architecture artifact (`paths.architecture`).
4. Append TDD evidence to the release trail (`paths.release_trail`): red
   output, green output, lint result, and what changed and why.

## Step 3 — COMMIT

1. `git status`, then review the full diff: scope matches the task; no
   secrets, tokens, local-only paths, or unrelated changes.
2. Stage only files changed by this task, by explicit path — never
   `git add -A`, `git add .`, or wildcards.
3. Compose the message per `manifest.yaml` vocabulary:
   `type(scope): description` — type from `commit_types`, first line at most
   `commit_summary_max` characters, imperative, lowercase, no period.
4. `git commit -m "<message>"`, then `git status` to confirm a clean tree.
5. If a hook fails, fix the root cause — never bypass it.

## Guardrails

- Do not skip Red — green without a prior failing test is not TDD.
- Do not implement beyond the failing test in Green; refactor only in Yellow.
- If TDD is not applicable (pure docs, infra config), record why in the
  release trail instead of skipping silently.
- **No Mocks Rule:** production behavior is proven against real collaborators;
  the `no_mocks` gate from `manifest.yaml` must report `zero_hits`.
- Never use `git add -A` / `git add .`; never `--no-verify`; never force-push;
  never amend a previous commit — always create a new one.
- Do not change unrelated modules discovered during exploration.
- Preserve existing architecture and module boundaries unless the BDD or
  reliability plan requires a contract change.
- Do not commit `.env`, credentials, or real tokens.

## Post-conditions

- Focused tests pass; broader tests pass for touched shared behavior.
- The `lint` gate passed for the affected package.
- Impacted artifacts updated; release trail has the full TDD evidence entry.
- The commit exists locally with a valid Conventional Commit message.
