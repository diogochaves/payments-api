→ [Back to Delivery](../../README.md)

# Sync

---

## Overview

**What it's for:** Consistency checkpoint between Hack and Finish. It has two independent steps: synchronizing the feature branch with the base (`rebase`) and aligning ProdOps artifacts with what was implemented (`align`).

**How it works:**

```
sync rebase: Remote fetch → Update base (fast-forward) → Integrate into feature
             → Resolve conflicts → Preserve TDD → Validate → Clean branch

sync align:  Identify stale artifacts → Trace source of truth in prodops/
             → Update only what changed → Record in Release Trail
```

The two steps are independent — they can be executed in the order that makes sense or individually as needed.

**Main guardrails:**

- Never discard local work or rewrite shared history
- Do not weaken tests to make the sync pass
- Conflicts are inspected from both sides before any editing
- Do not rewrite product decisions during artifact alignment work

**Position in the flow:**

```
CI Sync  →  Bootstrap → Hack → [Sync] → Finish
                                  ├── rebase  (branch)
                                  └── align   (artifacts)
```

---

## Steps

Sync is composed of two independent steps, executed via `/sync <step>`:

| Step | Responsibility |
|---|---|
| [`rebase`](../../../../skills/sync/steps/rebase/SKILL.md) | Synchronize the feature branch with the base: fetch, fast-forward, integrate, resolve conflicts, preserve TDD, validate |
| [`align`](../../../../skills/sync/steps/align/SKILL.md) | Align ProdOps artifacts with the implementation: BDD Features, Event Storming, architecture, Release Trail |

For complete execution mechanics, see [`prodops/skills/sync/`](../../../../skills/sync/).

---

## Checklist

### sync rebase

- [ ] Branch updated from the most recent base.
- [ ] Conflicts resolved with both sides inspected.
- [ ] Tests pass on the integrated history.
- [ ] No tests were removed or weakened to complete the sync.

### sync align

- [ ] BDD Feature reflects the implemented behavior.
- [ ] OBC acceptance criteria are satisfied by the tests.
- [ ] Architecture diagram updated if the change was structural.
- [ ] Event Storming updated if events were added, removed, or renamed.
- [ ] Release Trail entry drafted with evidence.
