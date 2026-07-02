# Upstream Trail

## Purpose

The Upstream Trail records the execution history of exploratory engineering activities.

Unlike experiment documents, which capture detailed findings, the Upstream Trail provides a chronological history of what happened.

Its purpose is to help future contributors understand the evolution of ideas and decisions without reading every experiment.

---

# Entry Template

## YYYY-MM-DD HH:MM

### Experiment

Reference:

`prodops/upstream/experiments/001-credit-card-lifecycle.md`

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

Example:

- Validation Workbench
- Reliability Plan
- Tracking List
- OBC
- BDD Feature

### Decision

Choose one:

- Continue experiment
- Start another experiment
- Ready for Assessment
- Discard experiment

### Notes

Additional observations, blockers or follow-up actions.

---

# History

> Append new entries below.
> Never rewrite previous entries.

## 2026-07-02 16:08

### Experiment

Reference:

`prodops/upstream/experiments/004-feature-flag-readiness.md`

### Activity

Started experiment after reviewing Current State, Tracking List, Reliability
Plan, Premortem, Iteration Plan and existing Upstream experiments.

### Summary

The highest-priority uncertainty is the Checkout Feature Flag readiness for the
new Payments gateway. The approved release depends on enabling this route, but
the flag remains documented as blocked by a Checkout bug and lacks rollback
evidence for orders already started in Payments.

Existing experiments cover credit card uncertainty and do not cover this
release-blocking dependency, so a new Upstream experiment was created.

### Artifacts Updated

- `prodops/upstream/experiments/004-feature-flag-readiness.md`
- `prodops/upstream/experiments.md`
- `prodops/current-state/tracking-list.md`
- `prodops/assessment/reliability-plan/risks.md`
- `prodops/upstream/learnings.md`

### Decision

Continue experiment.

### Notes

Next step is to collect Checkout evidence: exact Feature Flag bug, owner, fix
status, targeting rules, auditability, rollout/pause/rollback criteria,
telemetry by order and in-flight order handling after rollback.

## 2026-07-02 16:40

### Experiment

References:

- `prodops/upstream/experiments/001-credit-card-lifecycle.md`
- `prodops/upstream/experiments/002-sandbox-funding.md`
- `prodops/upstream/experiments/003-hosted-vs-tokenized.md`
- `prodops/upstream/experiments/004-feature-flag-readiness.md`

### Activity

Updated BDD Features to reflect the existing Upstream experiments.

### Summary

The credit card BDD now includes hosted confirmation, financial receipt,
tokenized-card constraints, risk-analysis events, sandbox/simulation evidence
and the decision to keep direct raw card capture out of the first Downstream
slice.

A new Checkout Feature Flag readiness BDD was added to represent the EXP-004
learning as executable acceptance criteria for rollout, pause, rollback,
auditability, in-flight orders and promotion blocking.

### Artifacts Updated

- `prodops/current-state/features/credit-card-payment.feature`
- `prodops/current-state/features/checkout-gateway-feature-flag.feature`

### Decision

Continue experiment.

### Notes

These features are BDD inputs for future TDD/Downstream work. They do not
promote the capabilities by themselves.
