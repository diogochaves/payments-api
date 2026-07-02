# Upstream

## Purpose

Upstream is the exploratory engineering workflow of ProdOps.

Its purpose is to reduce uncertainty before a capability enters the standard delivery flow.

Unlike Downstream, Upstream is driven by learning rather than delivery commitments.

An Upstream experiment may produce production-quality code, but that code is considered exploratory until the capability is promoted to Downstream.

---

# Objectives

Upstream exists to:

- understand business problems;
- validate technical approaches;
- explore provider capabilities;
- prototype integrations;
- validate business flows;
- reduce implementation risk;
- evolve Product knowledge.

---

# Repository Scope Gate

Before creating an experiment, BDD Feature, OBC, prototype, Validation Workbench
change, or any execution artifact, confirm that the capability can be developed
or validated inside this repository.

Create execution artifacts only when this repository owns or can directly
exercise at least one of:

- API behavior;
- domain logic;
- provider integration;
- webhook handling;
- persistence;
- contracts owned by Payments API;
- Validation Workbench flow;
- tests or executable evidence.

If the request depends on implementation owned by another repository or system,
do not create a Feature, experiment, prototype, or execution artifact here.
Instead, record it only as one of:

- external dependency;
- release risk;
- Tracking List item;
- Reliability Plan note;
- evidence required from the owning system.

Examples of out-of-repository work:

- Checkout Feature Flag implementation;
- Checkout rollout targeting;
- Notification Service delivery behavior;
- Order Management fulfillment behavior;
- corporate ITSM integration outside Payments API.

Upstream may document the dependency, but it must not make it look executable in
this repository.

---

# Typical Outputs

An Upstream activity may produce:

- executable code;
- Validation Workbench improvements;
- prototypes;
- BDD scenarios;
- OBC drafts;
- OpenAPI updates;
- AsyncAPI updates;
- Event Storming updates;
- Reliability Plan updates;
- Tracking List updates;
- architecture decisions.

---

# Workflow

A typical Upstream flow is:

Business Question

↓

Hypothesis

↓

Experiment

↓

Implementation

↓

Functional Validation

↓

Learning

↓

Decision

↓

Assessment

↓

Downstream (if approved)

---

# Experiments

Experiments are stored in:

```
prodops/upstream/experiments/
```

Each experiment should answer a specific question.

Examples:

- Is the provider API sufficient?
- Which architecture should be adopted?
- Can this business flow be validated?
- What are the operational risks?

Experiments should be small and focused.

---

# Validation Workbench

The Validation Workbench is the preferred environment for functional validation.

It is used to:

- validate business flows;
- validate integrations;
- validate BDD scenarios;
- simulate provider behavior;
- validate UX;
- reduce implementation uncertainty.

The Validation Workbench is part of Upstream.

---

# Relationship with Assessment

Every completed experiment should produce a Decision Package.

The Decision Package feeds Continuous Assessment.

Assessment decides whether a capability should:

- move to Downstream;
- require another experiment;
- wait for business decisions;
- be discarded.

---

# Relationship with Downstream

Upstream prepares knowledge.

Downstream delivers software.

A capability should only move to Downstream when:

- the business behavior is understood;
- the architecture is stable;
- the Reliability Plan has been updated;
- the OBC is sufficiently defined;
- the remaining uncertainty is acceptable.

---

# Golden Rules

- Keep experiments focused.
- Answer one question at a time.
- Produce executable evidence whenever possible.
- Stop when the hypothesis has been answered.
- Update affected ProdOps artifacts.
- Document learnings.
- Produce a clear recommendation.
- Avoid implementing unrelated capabilities.

Learning is the primary outcome.

Implementation is a means to achieve learning.
