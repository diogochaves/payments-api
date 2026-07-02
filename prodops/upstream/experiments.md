# Upstream Experiment

## Experiment

Validate the feasibility of integrating the Payments API with Asaas to support the complete credit card payment lifecycle.

The experiment covers:

- Create Credit Card Invoice
- Confirm Payment
- Cancel Payment

The goal is to understand the Asaas APIs, validate the integration approach, identify technical constraints, and prepare the necessary artifacts for a future downstream implementation.

---

## Hypothesis

The Payments API can expose a unified payment interface while integrating transparently with Asaas for credit card operations.

It should be possible to:

- create a credit card invoice;
- receive payment confirmation through webhook or polling;
- process payment cancellation;
- expose standardized events and contracts independent of the payment provider.

The experiment should provide enough knowledge to create an Observable Business Contract (OBC) and prepare a future Reliability Plan.

---

## What was tried

- Study the Asaas API documentation related to credit card payments.
- Identify the required endpoints.
- Understand the authentication model.
- Create a local proof of concept without affecting existing production flows.
- Validate invoice creation.
- Validate payment confirmation flow.
- Validate payment cancellation flow.
- Evaluate webhook support.
- Evaluate idempotency requirements.
- Identify required domain events.
- Identify possible error scenarios.
- Identify required observability signals.
- Compare the resulting contracts with the current Payments API architecture.

No production code should be considered final during this experiment.

---

## Result

Executed as an upstream documentation and architecture experiment. No
production code was changed.

APIs validated from Asaas documentation:

- `POST /v3/payments/` creates a credit card charge.
- `POST /v3/payments/{id}/payWithCreditCard` pays an existing charge by credit
  card after the charge already exists.
- `DELETE /v3/payments/{id}` removes an active charge before it should remain
  available to the payer.
- Payment webhooks include card-relevant events such as
  `PAYMENT_AWAITING_RISK_ANALYSIS`, `PAYMENT_APPROVED_BY_RISK_ANALYSIS`,
  `PAYMENT_REPROVED_BY_RISK_ANALYSIS`, `PAYMENT_AUTHORIZED`,
  `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`,
  `PAYMENT_CREDIT_CARD_CAPTURE_REFUSED`, `PAYMENT_DELETED`, and
  `PAYMENT_REFUNDED`.

Current Payments API compatibility:

- The current `CreateInvoiceDto` already accepts `billingType: "CREDIT_CARD"`.
- The current `AsaasService.createCharge` already posts to `/payments`.
- The current cancellation flow already calls `DELETE /v3/payments/{id}` and
  protects confirmed/received invoices from simple cancellation.
- The current webhook flow already handles `PAYMENT_CONFIRMED`,
  `PAYMENT_RECEIVED`, `PAYMENT_DELETED`, and ignored events.

Technical blockers and unknowns:

- The current API has no contract for `creditCard`, `creditCardHolderInfo`,
  `creditCardToken`, `authorizeOnly`, installments, or `remoteIp`.
- The current gateway treats invoice creation as a generic provider charge; it
  does not distinguish redirect-to-invoice credit card flow from transparent
  checkout card capture.
- Immediate card capture may return `HTTP 400` without persisting the charge
  when authorization is refused. This needs explicit state and idempotency
  rules before Downstream implementation.
- Asaas recommends a minimum timeout of 60 seconds for immediate credit card
  processing, while the current axios client has no explicit timeout.
- Card data capture introduces PCI/security constraints. A future Downstream
  design should prefer tokenized card flow unless the product explicitly
  commits to handling sensitive card data.
- `PAYMENT_AUTHORIZED` and risk-analysis events are not yet modeled as invoice
  states or BDD scenarios.
- Deleting a payment is not a refund/reversal. Refund flow for confirmed card
  payments remains outside the current cancellation contract.

Architecture decision from the experiment:

- Do not implement credit card as a blind extension of the existing Pix invoice
  scenario. First split the target flow into either:
  - hosted Asaas invoice/card entry via `invoiceUrl`; or
  - transparent checkout with tokenized or direct card data.

Compatibility assessment:

- The existing architecture is compatible with a hosted or tokenized credit card
  flow after DTO, BDD, OBC, timeout, event mapping, and idempotency refinements.
- The existing architecture is not yet ready for direct card-data capture as a
  Downstream item because the security boundary and refusal/authorization states
  are not specified.

Evidence sources:

- Asaas credit card payment creation:
  `https://docs.asaas.com/reference/create-new-payment-with-credit-card`
- Asaas pay existing charge with credit card:
  `https://docs.asaas.com/reference/pay-a-charge-with-credit-card`
- Asaas payment deletion:
  `https://docs.asaas.com/reference/delete-payment`
- Asaas payment webhook events:
  `https://docs.asaas.com/docs/payment-events`
- Asaas webhook delivery behavior:
  `https://docs.asaas.com/docs/about-webhooks`

---

## Learning

Document the main findings, including:

- Business rules discovered
- API limitations
- Authentication considerations
- Error handling strategy
- Retry strategy
- Idempotency behavior
- Required telemetry
- Required BDD scenarios
- Opportunities to improve the current architecture

Identify which findings should update:

- Product Deck: payment method capability should distinguish hosted card
  payment, tokenized card payment, and direct card capture.
- Service Deck: add credit card branch with authorization, risk analysis,
  confirmation, receipt, deletion, and refund/reversal decision points.
- Tracking List: add a Downstream candidate only after the product chooses the
  card capture model.
- Reliability Plan: add risks for timeout, duplicate capture attempts, risk
  analysis delay, PCI/security boundary, webhook queue loss, and refund vs
  deletion confusion.
- Event Storming: add provider events for `PAYMENT_AUTHORIZED`,
  `PAYMENT_AWAITING_RISK_ANALYSIS`, `PAYMENT_REPROVED_BY_RISK_ANALYSIS`, and
  `PAYMENT_CREDIT_CARD_CAPTURE_REFUSED`.
- OBC: define observable business contract for "credit card payment
  authorization and confirmation" before implementation.

Primary learning:

- Credit card support is feasible in the current gateway shape, but it is not a
  single endpoint toggle. It changes the contract because payment can be
  authorized, refused, under risk analysis, confirmed, received, deleted, or
  refunded.
- The safest first Downstream slice is hosted or tokenized credit card payment,
  not direct handling of raw card data.
- `DELETE /v3/payments/{id}` remains valid for removing unpaid/open charges, but
  confirmed card payment cancellation must be treated as refund/reversal work.
- Webhook processing must explicitly map card-specific provider events to
  internal states and observable events before production rollout.

---

## Should move downstream?

Decision:

- [ ] Yes
- [ ] No
- [x] Needs another experiment

Reason:

The experiment produced enough evidence to confirm feasibility, but not enough
to justify immediate implementation through Downstream. The missing decision is
the credit card capture model:

- hosted card entry through Asaas `invoiceUrl`;
- tokenized card payment;
- direct transparent checkout with raw card data.

Only after that decision can the team write the OBC, BDD scenarios, DTO changes,
security boundary, and Reliability Plan risks with enough precision.

---

## Next step

If approved for Downstream:

- Create or update the corresponding OBC.
- Refine the BDD scenarios.
- Update the Event Storming.
- Update the Reliability Plan.
- Add the capability to the Iteration Backlog.
- Execute the Downstream delivery workflow.

If not approved:

Run a focused upstream experiment comparing hosted card entry vs tokenized card
payment for the Magazine Siará checkout. The output should be:

- chosen card capture model;
- draft OBC;
- BDD scenarios for authorization, risk analysis, refusal, confirmation,
  receipt, deletion, and refund/reversal boundary;
- required DTO fields;
- required observability events;
- Reliability Plan risk updates.

---

# Focused Upstream Experiment - Hosted vs Tokenized Credit Card

## Experiment

Compare hosted Asaas card entry and tokenized card payment for Magazine Siará
checkout before promoting credit card support to Downstream.

## Business Goal

Select the safest first credit card slice that increases payment options without
creating unmanaged PCI, antifraud, timeout or webhook-state risk.

## Hypothesis

Hosted card entry can move to Downstream first because it reuses the current
invoice creation shape and keeps card data outside Payments API. Tokenized card
payment is viable later, but needs explicit contract, timeout, event mapping and
security decisions.

## Code Produced

The Validation Workbench was updated to generate proposed tokenized card payload
fields (`creditCardToken` and `remoteIp`) and to simulate card-specific Asaas
webhook events.

No production credit card processing path was implemented.

## Validation Workbench Updated

Yes. The Workbench now supports:

- hosted invoice mode for `billingType: CREDIT_CARD`;
- tokenized card payload exploration with `creditCardToken` and `remoteIp`;
- Asaas card events for authorization, risk analysis, capture refusal, deletion
  and refund.

## Contracts Updated

Draft contract artifacts were produced:

- BDD: `prodops/current-state/features/credit-card-payment.feature`
- OBC: `prodops/assessment/reliability-plan/obcs/credit-card-authorization-confirmation.md`
- Tracking List: `prodops/current-state/tracking-list.md`
- Reliability risks: `prodops/assessment/reliability-plan/risks.md`

## BDD Updated

Yes. Added scenarios for hosted card entry, tokenized card payment,
authorization, risk analysis, capture refusal, confirmation and refund boundary.

## Reliability Impact

Hosted card entry minimizes sensitive-data handling and can reuse the current
provider charge flow. Tokenized payment introduces timeout, token ownership,
risk-analysis, refusal and idempotency requirements. Direct raw card capture
remains outside the recommended first slice.

## Result

Choose hosted Asaas card entry as the first Downstream candidate. Keep tokenized
card payment in Upstream until product, security and antifraud approve the
contract and reliability rules.

## Learning

The current API can plausibly support a hosted credit card slice because
`CreateInvoiceDto` already accepts `CREDIT_CARD`, `AsaasService.createCharge`
already posts to `/v3/payments`, and the response contract already carries
`paymentUrl`. Tokenized card payment requires DTO and provider request changes
because the current service does not forward `creditCardToken` or `remoteIp`.

## Should move downstream?

Partially.

Move hosted card entry to Downstream after PM and Tech Lead accept the OBC and
BDD. Do not move tokenized card payment yet.

## Next step

Add hosted credit card payment to `prodops/downstream/iteration-backlog.md`
only after approving:

- OBC draft;
- BDD scenarios;
- payment URL UX in Checkout;
- webhook card event handling scope;
- refund boundary for confirmed card payments.
