# EXP-001 - Credit Card Payment Lifecycle with Asaas

## Status

- [ ] Planned
- [x] In Progress
- [ ] Completed
- [ ] Cancelled

---

# Business Goal

Validate the feasibility of integrating the Payments API with Asaas to support
the complete credit card payment lifecycle.

The experiment should reduce implementation uncertainty and produce enough
knowledge to prepare an Observable Business Contract (OBC) and a future
Downstream implementation.

---

# Repository Scope Gate

## Repository-owned scope

- [x] Payments API behavior
- [x] Payments domain logic
- [x] Provider integration
- [x] Webhook handling
- [ ] Persistence
- [x] API/event contract owned by Payments
- [x] Validation Workbench behavior
- [x] Local tests or executable evidence

## External dependencies

- Asaas Sandbox behavior.
- Checkout experience for hosted/tokenized card payment.
- Security/compliance decision for direct card capture.

## Scope decision

- [x] Continue as executable Upstream experiment in this repository
- [ ] Record only as external dependency or release risk
- [ ] Redirect to owning repository or team

The Payments API can validate provider calls, webhook handling, contract shape
and Validation Workbench behavior. Checkout UX and compliance decisions remain
external inputs.

---

# Question to Answer

Can the current Payments API support the complete Asaas credit card lifecycle
while preserving a provider-agnostic contract?

The experiment must answer whether it is possible to:

- create a credit card invoice;
- confirm a payment;
- cancel an unpaid charge;
- understand provider-specific states;
- identify required architectural changes.

---

# Hypothesis

The Payments API can expose a unified payment interface while integrating
transparently with Asaas for credit card operations.

It should be possible to:

- create a credit card invoice;
- receive payment confirmation through webhook or polling;
- process payment cancellation;
- expose standardized contracts independent of the payment provider.

---

# Scope

Included:

- Asaas credit card APIs.
- Payment lifecycle endpoints.
- Credit card invoice creation.
- Payment confirmation events.
- Unpaid charge cancellation.
- Webhook event mapping.
- Idempotency and timeout analysis.
- Current Payments API compatibility.
- Validation Workbench exploration.

---

# Out of Scope

Not included:

- Production implementation commitment.
- Direct raw card capture rollout.
- Checkout UI implementation.
- PCI/compliance approval.
- Production credential setup.

---

# Implementation

The experiment should:

- study the Asaas credit card APIs;
- identify authentication requirements;
- identify payment lifecycle endpoints;
- validate invoice creation;
- validate payment confirmation;
- validate payment cancellation;
- analyze webhook events;
- analyze idempotency behavior;
- analyze timeout requirements;
- identify domain events;
- identify provider-specific states;
- compare the findings with the current Payments API architecture.

No production implementation should be considered final during this experiment.

---

# Code Produced

No production code was produced by this experiment.

Executable evidence is expected through existing Payments API behavior,
acceptance tests and Validation Workbench scenarios.

---

# Functional Validation

Use the Validation Workbench to validate:

- invoice creation;
- payment confirmation;
- payment cancellation;
- webhook processing;
- provider responses;
- error scenarios.

---

# Technical Findings

## APIs

Validated APIs:

- `POST /v3/payments`
- `POST /v3/payments/{id}/payWithCreditCard`
- `DELETE /v3/payments/{id}`

## Webhooks

Observed events:

- `PAYMENT_AUTHORIZED`
- `PAYMENT_CONFIRMED`
- `PAYMENT_RECEIVED`
- `PAYMENT_DELETED`
- `PAYMENT_REFUNDED`
- `PAYMENT_AWAITING_RISK_ANALYSIS`
- `PAYMENT_APPROVED_BY_RISK_ANALYSIS`
- `PAYMENT_REPROVED_BY_RISK_ANALYSIS`
- `PAYMENT_CREDIT_CARD_CAPTURE_REFUSED`

## Compatibility

Current architecture already supports:

- `CREDIT_CARD` billing type;
- generic provider charge creation;
- payment deletion;
- webhook processing for confirmed, received and deleted payments.

## Gaps

The following capabilities are missing:

- `creditCardToken`;
- `creditCardHolderInfo`;
- `authorizeOnly`;
- installments;
- `remoteIp`;
- explicit authorization states;
- explicit risk-analysis states;
- timeout configuration;
- card-specific idempotency strategy.

---

# Business Findings

Credit card payment introduces additional business states not currently
represented in the Payments domain.

Examples:

- Authorized.
- Awaiting Risk Analysis.
- Approved by Risk Analysis.
- Reproved by Risk Analysis.
- Capture Refused.
- Refunded.

These states should become part of the domain model before production
implementation.

---

# Architecture Impact

Confirmed:

- The current gateway shape can support credit card payments.
- Credit card should not be treated as only another `billingType` toggle.

Rejected:

- Blindly extending the current Pix invoice scenario without choosing a card
  capture model.

Open questions:

- Hosted checkout, tokenized card or direct card capture.
- Security boundary for card data.
- State model for authorization, risk analysis and refusal.

---

# Reliability Impact

The Reliability Plan should be updated to include:

- timeout risks;
- duplicate payment protection;
- webhook retries;
- authorization failures;
- fraud-analysis delays;
- PCI boundary;
- refund vs deletion distinction.

---

# Artifacts Updated

The following artifacts should be updated after this experiment:

- Product Deck.
- Service Deck.
- Tracking List.
- Reliability Plan.
- Event Storming.
- OBC.
- Validation Workbench.

---

# Knowledge Gaps Closed

| Question | Status | Evidence |
|----------|--------|----------|
| Can the current Payments API create a credit card invoice? | Answered | Current DTO accepts `CREDIT_CARD`; Asaas charge creation uses `/v3/payments`. |
| Can payment confirmation be received? | Partially Answered | Webhook flow handles core confirmation events; card-specific states need mapping. |
| Can unpaid charge cancellation be processed? | Answered | Existing cancellation flow calls `DELETE /v3/payments/{id}`. |
| Are provider-specific states understood? | Partially Answered | Card-specific webhook events were identified, but not fully modeled. |
| Which capture model should be used? | Still Unknown | Requires EXP-003 hosted vs tokenized comparison. |

---

# New Backlog Items

| Item | Classification | Priority |
|------|----------------|----------|
| Choose hosted, tokenized or direct card capture model. | Candidate for Upstream experiment | P0 |
| Map card-specific provider events to internal states. | Tracking List | P0 |
| Define refund/reversal boundary for confirmed card payments. | Tracking List | P0 |
| Define card timeout and idempotency strategy. | Tracking List | P0 |

---

# Recommendation

- [ ] Move Downstream
- [x] Run another Upstream experiment
- [ ] Wait for business decision
- [ ] Wait for external dependency
- [ ] Discard capability

The experiment confirms feasibility, but the payment capture model is still
undecided. Run a focused experiment to compare hosted checkout, tokenized card
and direct card capture before Downstream implementation.

---

# Decision Package

## Executive Summary

Credit card support is feasible in the current Payments API shape, but the
capability is not ready for Downstream because the capture model and card-state
model are not yet decided.

## Recommended Decision

Run another Upstream experiment.

## Updated Risks

- Timeout.
- Duplicate capture attempts.
- Risk-analysis delay.
- PCI boundary.
- Refund vs deletion confusion.

## Updated Opportunities

- Add credit card as an incremental payment method after a safe capture model is
  chosen.
- Reuse the existing provider abstraction for hosted or tokenized flow.

## Updated Tracking Items

- Choose card capture model.
- Define card-specific event mapping.
- Define refund/reversal boundary.

## Updated OBCs

OBC is not complete. It should be drafted after capture model selection.

## Updated Reliability Plan

Reliability Plan should include card-specific timeout, risk-analysis, refusal,
webhook and refund risks.

## Recommended Downstream Scope

No Downstream scope yet.

---

# Exit Criteria

- [x] Original hypothesis answered
- [x] Questions classified
- [x] Knowledge gaps documented
- [x] Architecture impact documented
- [x] Reliability impact documented
- [x] Artifacts updated
- [x] Recommendation produced
- [x] Decision Package completed

---

# Next Step

Run EXP-003 to choose the first card capture model.
