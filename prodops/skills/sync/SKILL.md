---
name: sync
description: Review consistency, update artifacts, or synchronize a work branch with its base. Use when aligning code, documentation, BDD, Reliability Plan, release records, fetching remote changes, updating from main, resolving conflicts, or ensuring a feature branch is current.
---

# SYNC

Use this skill to make the repository internally consistent with the current
ProdOps context or to synchronize a work branch with its intended base.

For detailed Codex branch synchronization mechanics, read
`references/workflow.md`.

## Inputs

- `AGENTS.md`
- `prodops/artifacts/product/`
- `prodops/journeys/assessment/`
- `prodops/artifacts/trails/release-trail.md`

## Flow

### Artifact Consistency

1. Identify the artifact or code inconsistency.
2. Trace the source of truth in `prodops/`.
3. Update only stale or impacted files.
4. Preserve historical release-trail entries.
5. Validate links, paths, and changed Markdown.
6. Record the synchronization in the Release Trail when meaningful.

### Branch Synchronization

1. Inspect the worktree and current branch.
2. Fetch remote updates with pruning.
3. Identify the base branch and compare local, remote, and feature branch
   commits.
4. Update the local base using fast-forward only.
5. Bring the updated base into the feature branch with the repository's
   preferred strategy.
6. Resolve conflicts by preserving intended behavior from both sides.
7. Preserve or repair tests that encode the branch behavior.
8. Run validation for touched areas.
9. Leave the branch clean or clearly report remaining conflicts/blockers.

## Guardrails

- Do not rewrite product decisions while doing consistency work.
- Do not duplicate Product Deck, Service Deck, OBC, or Reliability Plan content
  inside skills.
- Prefer references to canonical ProdOps paths.
- Never discard local changes.
- Never force-push or rewrite shared branch history unless the user explicitly
  requests it.
- Do not auto-stash unknown user work without approval.
- If conflicts occur, inspect both sides before editing.
- After conflict resolution, run tests that cover the conflicted files.
- Do not delete or weaken tests just to make synchronization pass.
