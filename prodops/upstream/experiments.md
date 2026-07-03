# Upstream Experiments

## Purpose

This document indexes every Upstream experiment executed for this product.

Experiments reduce uncertainty before implementation moves to Downstream.

Each experiment should answer one primary question.

Do not duplicate experiment content here.

Reference the experiment directory instead.

---

# Workflow

```text
Business Question

↓

Experiment

↓

Learning

↓

Decision

↓

Assessment

↓

Downstream
```

---

# Experiment Status

| ID | Capability | Status | Recommendation | Next Step |
|----|------------|--------|----------------|-----------|
| 001 | Credit Card Lifecycle | 🟡 In Progress | Hosted subset to Assessment; saved/new card need decisions | Decide token storage and PCI boundary |
| 002 | Sandbox Funding | 🟡 In Progress | Wait for External Dependency | Collect Asaas Sandbox evidence |
| 003 | Hosted vs Tokenized | 🟡 In Progress | Move Downstream | Prepare hosted card Downstream intake |
| 004 | Checkout Gateway Feature Flag Readiness | 🟡 In Progress | Wait for External Dependency | Collect Checkout Feature Flag evidence |
| 005 | Datadog Native AWS Instrumentation | ✅ Completed | Move Downstream after AWS pipeline parameters are confirmed | Validate SAM deploy with Datadog Extension layer and Secrets Manager secret |
| 006 | Upstream Trail per Experiment | ✅ Completed | Keep as Upstream operating standard | Use directory layout for new experiments |

---

# Status Legend

| Icon | Meaning |
|------|---------|
| ⏳ | Planned |
| 🟡 | In Progress |
| ✅ | Completed |
| 🚀 | Promoted to Downstream |
| ❌ | Cancelled |

---

# Recommendations

Each completed experiment should end with exactly one recommendation.

Possible recommendations:

- Move Downstream
- Run another Upstream experiment
- Wait for Business Decision
- Wait for External Dependency
- Discard Capability

---

# Promotion Rules

A capability may move to Downstream only when:

- Business behavior is understood.
- Main technical uncertainties are resolved.
- Reliability impacts are documented.
- OBC is sufficiently defined.
- BDD scenarios are defined.
- Validation Workbench demonstrates the expected business flow.
- Assessment approves the capability.

---

# Current Focus

Current capability under investigation:

**Credit Card Payment with Asaas**

Current experiment:

**001 - Credit Card Payment Lifecycle with Asaas**

Next planned experiments:

- Continue 002 with Asaas Sandbox evidence
- Prepare Downstream intake for hosted card payment after Product and Tech Lead approval
- Run focused saved-card token storage experiment after Security/Architecture input

---

# Completed Experiments

Move completed experiments here after promotion.

| ID | Capability | Downstream Release |
|----|------------|--------------------|

---

# Notes

Experiments are intentionally small.

When a new question arises, create a new experiment instead of expanding an existing one.

The objective is to keep every experiment focused on reducing a single uncertainty.

New experiments must use this structure:

```text
prodops/upstream/experiments/NNN-short-slug/
  experiment.md
  upstream-trail.md
  evidence/
```

Flat files directly under `prodops/upstream/experiments/*.md` are legacy
artifacts. Keep them readable, but do not create new experiments in that shape.
