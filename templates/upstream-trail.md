# LEGACY TEMPLATE - Experiment Upstream Trail

This root template is kept only for historical compatibility.
For new Discovery experiment trails, use:

`prodops/templates/discovery/trail.md`

Canonical location:

```text
prodops/journeys/discovery/experiments/NNN-short-slug/upstream-trail.md
```

This file records chronological activity for one Upstream experiment.

Do not use this template as the primary global trail. The global
`prodops/journeys/discovery/upstream-trail.md` is only a high-level index for
cross-experiment milestones, migrations, promotions and repository-wide
Upstream process changes.

## Experiment

Reference:

`prodops/journeys/discovery/experiments/NNN-short-slug/experiment.md`

---

# History

> Append new entries below.
> Never rewrite previous entries.

---

# Entry Template

## YYYY-MM-DD HH:MM

### Activity

Describe what happened.

Examples:

- Started experiment
- Updated prototype
- Implemented proof of concept
- Updated Validation Workbench
- Reviewed provider documentation
- Updated Reliability Plan
- Finished experiment

### Summary

One or two paragraphs summarizing the work performed.

### Artifacts Updated

List only the artifacts updated during this activity.

### Evidence

Reference validation evidence.

Examples:

- Commands executed
- Test results
- Payload examples
- Provider responses
- Evidence files under `evidence/`

### Decision

Choose one:

- Continue experiment
- Start another experiment
- Ready for Assessment
- Discard experiment
- Move Downstream
- Wait for business decision
- Wait for external dependency

### Notes

Additional observations, blockers or follow-up actions.

---

# Legacy Compact Entry

Use this compact shape only when migrating old global-trail entries.

### Business Goal

### Hypothesis

### Code Produced

### Validation Workbench Updated

### Contracts Updated

### BDD Updated

### Reliability Impact

### Result

### Learning

### Should move downstream?

### Next step
