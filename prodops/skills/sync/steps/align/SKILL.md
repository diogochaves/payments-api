---
name: sync/align
description: Align ProdOps artifacts with the current implementation. Use when BDD Features, Event Storming, architecture diagrams, or the Release Trail are stale relative to what was implemented in Hack.
---

# SYNC → ALIGN

Execute only the artifact alignment step of the Sync flow.

## Inputs

- Current diff (`git diff main...HEAD`) — what changed in this branch
- `prodops/artifacts/bdd/` — BDD Features
- `prodops/journeys/assessment/event-storming/plan.json` — Event Storming
- `prodops/journeys/assessment/architecture/overview.md` — architecture diagram
- `prodops/artifacts/trails/release-trail.md` — Release Trail
- Relevant OBC in `prodops/artifacts/obcs/`

## Action

### 1. Identify what changed

Review the branch diff and list:

- behaviors added, changed, or removed
- domain events added, renamed, or removed
- structural changes (new module, route, external dependency, table, event topic)
- contracts changed (OpenAPI, AsyncAPI, BDD Feature)

### 2. Trace the source of truth

For each item identified, locate the canonical artifact in `prodops/`:

| Changed area | Canonical artifact |
|---|---|
| Behavior / acceptance criteria | BDD Feature in `prodops/artifacts/bdd/` |
| Domain events | `prodops/journeys/assessment/event-storming/plan.json` |
| Structure / modules / routes | `prodops/journeys/assessment/architecture/overview.md` |
| OBC criteria | `prodops/artifacts/obcs/<capability>.md` |

### 3. Update only stale artifacts

Update each artifact that is inconsistent with the implementation:

- **BDD Feature** — reflect the behavior as implemented, not as originally speculated.
- **Event Storming** — add/rename/remove events in `customEvents`; update flow bands; add `sloSuggestions` if on critical path; update `assumptions[last]` with today's date.
- **Architecture** — edit the Mermaid diagram; add a row to the History table.

Do not touch artifacts that are already consistent. Do not rewrite product decisions made upstream of this branch.

### 4. Validate links and Markdown

Check that all internal links in updated files resolve. Verify changed Markdown renders correctly (headings, tables, code blocks).

### 5. Record in the Release Trail

Append an entry to `prodops/artifacts/trails/release-trail.md` when the alignment is meaningful (behavior change, structural update, or contract correction). Include:

- what artifact was updated
- why it was stale (what the implementation introduced)
- date

Preserve all historical entries — append only, never replace.

## Post-conditions

- All ProdOps artifacts reflect the current implementation.
- No stale BDD Features, Event Storming entries, or architecture descriptions remain for this branch's changes.
- Release Trail updated when applicable.
- No product decisions were rewritten.

## Guardrails

- Do not rewrite product decisions while doing consistency work.
- Do not duplicate Product Deck, Service Deck, OBC, or Reliability Plan content — prefer references to canonical paths.
- Do not update artifacts that are unrelated to this branch's changes.
- Preserve historical Release Trail entries — append, never replace.
- If an artifact is missing entirely (e.g. no BDD Feature exists for the behavior), record it as a gap rather than inventing content.
