---
name: sync
description: Synchronize a work branch with its base or align ProdOps artifacts with the current implementation. Use when fetching remote changes, resolving conflicts, or when artifacts are stale.
---

# SYNC

Make the repository internally consistent: the branch with its base, and the
ProdOps artifacts with what was actually implemented. Two independent steps —
with a step argument (`/sync <step>`) execute only that step, otherwise both.

## Step 1 — REBASE (branch ↔ base)

1. `git status` — the working tree must be clean or the pending work
   explicitly handled (commit, stash with approval, or stop). Never auto-stash
   unknown work without approval.
2. `git fetch origin --prune`, then fast-forward the local base branch only.
3. Integrate the updated base into the feature branch (rebase or merge per the
   repository's convention). If conflicts occur, inspect both sides before
   editing — never resolve by discarding one side blindly.
4. After conflict resolution, run the tests that cover the conflicted files,
   then the `unit` gate from `manifest.yaml`.
5. Preserve TDD evidence: if resolution changed behavior, return to `/hack`
   for a red→green pass instead of patching silently.

## Step 2 — ALIGN (artifacts ↔ implementation)

1. Identify stale artifacts: BDD Features (`paths.bdd`), architecture
   (`paths.architecture`), reliability plans (`paths.reliability_plans`), and
   the release trail (`paths.release_trail`) relative to what was implemented.
2. Trace the source of truth in the ProdOps tree before editing — artifacts
   record decisions; do not rewrite decisions while doing consistency work.
3. Update only the impacted files.
4. Record the alignment in the release trail: what was stale, what changed.

## Guardrails

- Never discard local changes.
- Never force-push or rewrite shared branch history unless the user explicitly
  requests it.
- Do not delete or weaken tests just to make synchronization pass.
- Do not rewrite product decisions during consistency work.
- Do not duplicate artifact content into skills or docs — reference the
  canonical paths from `manifest.yaml`.

## Post-conditions

- Feature branch contains the latest base; conflicts resolved with tests green.
- Artifacts reflect the implemented behavior; the delta is recorded in the
  release trail.
