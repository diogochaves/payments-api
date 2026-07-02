# OBC - Credit Card Authorization And Confirmation

## Status

Draft from Upstream experiment. Do not treat as Downstream commitment until the
capability is accepted into `prodops/downstream/iteration-backlog.md`.

## Business Outcome

Magazine Siará can accept credit card payments through Payments API with clear
customer feedback, no direct dependency on Asaas contracts in Checkout, and
observable states for authorization, risk analysis, refusal, confirmation,
receipt and refund boundary.

## Observable Events

| Event | Meaning | Required dimensions |
| --- | --- | --- |
| `payment.card.hosted_invoice.created` | Hosted Asaas invoice/card entry was created. | `tenantId`, `orderId`, `invoiceId`, `providerPaymentId`, `provider`, `correlationId` |
| `payment.card.authorization.requested` | Tokenized card payment was submitted to provider. | `tenantId`, `orderId`, `invoiceId`, `provider`, `correlationId`, `hasToken` |
| `payment.card.authorized` | Provider authorized card payment before final confirmation. | `tenantId`, `orderId`, `invoiceId`, `providerPaymentId`, `providerStatus` |
| `payment.card.risk_analysis.awaiting` | Provider placed card payment under risk analysis. | `tenantId`, `orderId`, `invoiceId`, `providerPaymentId` |
| `payment.card.refused` | Card authorization or capture was refused. | `tenantId`, `orderId`, `invoiceId`, `providerPaymentId`, `reasonCode` |
| `payment.confirmed` | Payment was confirmed and can release the order. | `tenantId`, `orderId`, `invoiceId`, `providerPaymentId`, `confirmedAt` |
| `payment.card.refund.required` | A confirmed card payment cannot be cancelled by delete and needs refund/reversal flow. | `tenantId`, `orderId`, `invoiceId`, `providerPaymentId` |

## Initial SLIs

| SLI | Initial target |
| --- | --- |
| Card attempts with terminal known outcome: confirmed, refused, risk-analysis or provider error. | 99% in 5 minutes |
| Card confirmations published once to consumers after provider confirmation. | 99% in 30 seconds |
| Card capture refusals with known reason code or provider error code. | 99% |
| Webhook card events correlated by `providerPaymentId` or `externalReference`. | 99.5% |

## Reliability Rules

- Hosted card entry is the safest first Downstream slice because Payments API
  does not handle sensitive card data.
- Tokenized card payment can move Downstream only after `creditCardToken`,
  `remoteIp`, timeout, refusal and risk-analysis contracts are explicit.
- Direct raw card capture is out of scope for the first Downstream slice unless
  the product accepts PCI/security obligations.
- Confirmed card payment cancellation must be treated as refund or reversal, not
  as `DELETE /v3/payments`.

## Related Artifacts

- BDD: `prodops/current-state/features/credit-card-payment.feature`
- Upstream trail: `prodops/upstream/upstream-trail.md`
- Experiment notes: `prodops/upstream/experiments.md`
