# Upstream Trail - EXP-002

## Experiment

Reference:

`prodops/upstream/experiments/002-sandbox-funding/experiment.md`

---

# History

> Append new entries below.
> Never rewrite previous entries.

## 2026-07-02 16:40

### Activity

Updated BDD Features to reflect the existing Upstream experiments.

### Summary

The credit card BDD now includes hosted confirmation, financial receipt,
tokenized-card constraints, risk-analysis events, sandbox/simulation evidence
and the decision to keep direct raw card capture out of the first Downstream
slice.

This entry was migrated from the global trail and also relates to EXP-001,
EXP-003 and the missing EXP-004 reference.

### Artifacts Updated

- `prodops/upstream/features/credit-card-payment.feature`
- `prodops/upstream/features/checkout-gateway-feature-flag.feature`

### Evidence

- Migrated from `prodops/upstream/upstream-trail.md`.

### Decision

Continue experiment.

### Notes

These features are BDD inputs for future TDD/Downstream work. They do not
promote the capabilities by themselves.
