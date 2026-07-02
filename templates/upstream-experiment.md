# Upstream Experiment

## Status

- [ ] Planned
- [ ] In Progress
- [ ] Completed
- [ ] Cancelled

---

# Business Goal

Describe the business outcome expected from this experiment.

Why is this experiment being executed?

---

# Repository Scope Gate

Confirm whether this experiment can be developed or validated inside this
repository.

## Repository-owned scope

Mark every applicable item:

- [ ] Payments API behavior
- [ ] Payments domain logic
- [ ] Provider integration
- [ ] Webhook handling
- [ ] Persistence
- [ ] API/event contract owned by Payments
- [ ] Validation Workbench behavior
- [ ] Local tests or executable evidence

## External dependencies

List dependencies owned by another repository, team, system, vendor, or platform.

Examples:

- Checkout Feature Flag
- Checkout rollout targeting
- Notification Service delivery
- Order Management fulfillment
- Corporate ITSM integration

## Scope decision

Choose one:

- [ ] Continue as executable Upstream experiment in this repository
- [ ] Record only as external dependency or release risk
- [ ] Redirect to owning repository or team

If this repository cannot develop or validate the capability, stop here. Do not
create BDD Features, OBC drafts, prototypes, Validation Workbench changes, or
implementation artifacts for this request in this repository.

---

# Question to Answer

List the questions this experiment must answer.

Examples:

- Can this capability be implemented?
- Is the provider API sufficient?
- Which architecture should be adopted?
- Can the Validation Workbench reproduce the business flow?

---

# Hypothesis

Describe the expected outcome before implementation.

State what is believed to be true and will be validated during the experiment.

---

# Scope

Describe what IS included.

Examples:

- APIs
- Business flows
- Components
- Services
- Frontend
- Validation Workbench
- Documentation

---

# Out of Scope

Explicitly describe what will NOT be investigated.

This section prevents scope creep.

---

# Implementation

Describe the activities required to execute the experiment.

Examples:

- study documentation;
- implement code;
- update contracts;
- create BDD scenarios;
- update Validation Workbench;
- create prototype;
- execute integrations.

---

# Code Produced

List the executable artifacts created.

Examples:

- endpoints
- services
- DTOs
- repositories
- frontend
- scripts
- prototypes

If no code was produced, explain why.

---

# Functional Validation

Describe how the business flow was validated.

Examples:

- Validation Workbench
- Local frontend
- Manual execution
- Sandbox
- Integration tests
- BDD scenarios

---

# Technical Findings

Document technical discoveries.

Examples:

- API limitations
- Provider behavior
- Timeout
- Idempotency
- Authentication
- Event model
- Integration constraints

---

# Business Findings

Document business discoveries.

Examples:

- New business rules
- Missing rules
- UX findings
- Process improvements
- Risks
- Opportunities

---

# Architecture Impact

Describe architectural decisions.

Include:

- Decisions confirmed
- Decisions rejected
- Assumptions
- Open questions

---

# Reliability Impact

Describe impacts on:

- Reliability Plan
- Observability
- SLOs
- Telemetry
- Resilience
- Security
- Operational readiness

---

# Artifacts Updated

List every artifact updated.

Examples:

- Product Deck
- Service Deck
- Tracking List
- Icebox Backlog
- Event Storming
- Reliability Plan
- OBC
- BDD Features
- Validation Workbench

---

# Knowledge Gaps Closed

Classify every original question.

| Question | Status | Evidence |
|----------|--------|----------|
| | ✅ Answered | |
| | ⚠ Partially Answered | |
| | ❌ Still Unknown | |

---

# New Backlog Items

List new work discovered during the experiment.

Classify each item as:

- Tracking List
- Icebox Backlog
- Candidate for Iteration Backlog
- Discarded

---

# Recommendation

Choose one:

- [ ] Move Downstream
- [ ] Run another Upstream experiment
- [ ] Wait for business decision
- [ ] Wait for external dependency
- [ ] Discard capability

Explain why.

---

# Decision Package

Summarize the information required by Continuous Assessment.

Include:

## Executive Summary

## Recommended Decision

## Updated Risks

## Updated Opportunities

## Updated Tracking Items

## Updated OBCs

## Updated Reliability Plan

## Recommended Downstream Scope

---

# Exit Criteria

Confirm that:

- [ ] Original hypothesis answered
- [ ] Questions classified
- [ ] Knowledge gaps documented
- [ ] Architecture impact documented
- [ ] Reliability impact documented
- [ ] Artifacts updated
- [ ] Recommendation produced
- [ ] Decision Package completed

---

# Next Step

Describe the next action.

Examples:

- Start another Upstream experiment.
- Move to Downstream.
- Wait for Product decision.
- Wait for Architecture review.
- Wait for external dependency.
