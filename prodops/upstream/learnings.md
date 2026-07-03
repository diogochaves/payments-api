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

## Saved Cards and Tokenization Boundary

Saved-card support is a Payments-owned contract, not just a Checkout UI choice.

Reusable learning:

- Cart/Checkout should list and select cards through Payments-owned `cardId`
  values. It should not receive or store the provider `creditCardToken`.
- Payments may persist display-safe card metadata such as brand, last 4 digits,
  expiry, owner, provider and status, but must not persist full card number, CVV
  or raw `creditCard` payload.
- Provider card token must be protected as secret material and suppressed from
  logs, traces, analytics, error payloads and dead-letter messages.
- New-card registration expands PCI/security scope even when raw card data is
  only transient, because `creditCard` and `creditCardHolderInfo` cross the
  Payments API boundary.
- `remoteIp` belongs to the payer context and must be provided by
  Cart/Checkout; using the Payments server IP weakens antifraud evidence.
- Hosted card entry can still move first, but saved-card reuse and new-card
  registration need Security, Architecture and Product decisions before
  Downstream.

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

## Datadog Native AWS Instrumentation

Payments API can keep Datadog instrumentation without depending on the
Serverless Framework.

Reusable learning:

- `dd-trace` and the existing observability module are application concerns;
  they do not require `serverless-plugin-datadog`.
- AWS deployment should attach Datadog Lambda Extension through SAM parameters,
  with the API key injected by the deployment pipeline.
- Local functional validation should use the NestJS sandbox with mocks and
  memory storage; Lambda/Localstack validation is a separate infrastructure
  path, not the default development loop.
- The remaining deployment decision is external to the repo: pipeline owners
  must provide the correct Datadog Extension layer ARN/version per AWS region.
- Lambda Function URL is sufficient for this lab API and avoids API Gateway
  cost.
- DynamoDB provisioned capacity can keep the current table/index model under
  the classic 25 RCU / 25 WCU Free Tier envelope by assigning 1 RCU and 1 WCU to
  each table and GSI.
- Removing CloudWatch Logs permissions avoids log ingestion/storage charges, at
  the cost of losing AWS-side application logs for troubleshooting.
