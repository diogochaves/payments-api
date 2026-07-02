---
name: sync
description: Review consistency and update artifacts. Use when aligning code, documentation, BDD, Reliability Plan, and release records without primarily implementing new behavior.
---

# SYNC

Use this skill to make the repository internally consistent with the current
ProdOps context.

## Inputs

- `AGENTS.md`
- `prodops/current-state/`
- `prodops/assessment/`
- `prodops/diligence/release-trail.md`

## Flow

1. Identify the artifact or code inconsistency.
2. Trace the source of truth in `prodops/`.
3. Update only stale or impacted files.
4. Preserve historical release-trail entries.
5. Validate links, paths, and changed Markdown.
6. Record the synchronization in the Release Trail when meaningful.

## Guardrails

- Do not rewrite product decisions while doing consistency work.
- Do not duplicate Product Deck, Service Deck, OBC, or Reliability Plan content
  inside skills.
- Prefer references to canonical ProdOps paths.
