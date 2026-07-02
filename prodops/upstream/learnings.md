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
