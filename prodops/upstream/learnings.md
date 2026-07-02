# Learnings

Record reusable learnings from experiments, spikes, prototypes, and exploratory
validation here.

Do not turn learnings into delivery commitments until they are accepted into
Downstream.

## Credit Card Asaas Lifecycle

Credit card support is feasible with the current Payments gateway shape, but it
should not move Downstream as a simple `billingType: CREDIT_CARD` extension.

Key learnings:

- Hosted Asaas card entry and transparent checkout are different product and
  security contracts.
- Direct card capture requires fields and decisions not present in the current
  DTO: `creditCard`, `creditCardHolderInfo`, `creditCardToken`,
  `authorizeOnly`, installments, and `remoteIp`.
- Immediate card processing can refuse authorization before persisting a charge,
  so the invoice state model and idempotency behavior must be explicit.
- Asaas card events such as risk analysis, authorization, capture refusal,
  confirmation, receipt, deletion, and refund need explicit BDD and
  observability mapping.
- Deleting an unpaid charge is not the same as refunding a paid card charge.

Downstream candidate only after the next experiment chooses the capture model
and produces OBC, BDD, DTO, observability, and Reliability Plan updates.

## Hosted vs Tokenized Credit Card

The focused comparison favors hosted Asaas card entry as the first Downstream
slice.

Validated learning:

- Hosted card entry can reuse the current `POST /invoices` shape because Asaas
  can create a `CREDIT_CARD` payment without card fields and return an
  `invoiceUrl` for payer completion.
- Tokenized card payment is viable, but it is not just a UI option. It requires
  `creditCardToken`, `remoteIp`, explicit timeout, refusal mapping, risk-analysis
  mapping, and storage/security rules for token ownership.
- Direct raw card capture should remain out of the first Downstream slice unless
  Magazine Siará explicitly accepts PCI/security and antifraud obligations.
- The Validation Workbench now exposes the proposed tokenized payload shape and
  card-specific webhook events for functional exploration.
- The capability is almost ready for Downstream as hosted card entry, but
  tokenized payment still needs product and security approval before delivery.

## Checkout Gateway Feature Flag Readiness

The highest-priority uncertainty in the current product context is not a
Payments API endpoint. It is whether Checkout can safely enable the new gateway
through Feature Flag with rollout, auditability and rollback evidence.

Reusable learning:

- A release can have a working Payments API and still fail to deliver value if
  the Checkout routing flag cannot be activated safely.
- Feature Flag readiness is a cross-system contract between Checkout, Payments
  and operations.
- Rollback must define what happens to orders already started in Payments;
  simply turning off new traffic is not enough.
- The repository can prove Payments-side idempotency, correlation and webhook
  behavior, but cannot prove Checkout targeting or rollback without external
  evidence.
