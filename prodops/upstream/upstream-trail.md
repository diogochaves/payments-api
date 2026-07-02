# Upstream Trail

Append upstream exploration entries here.

```markdown
## YYYY-MM-DD HH:MM

### Experiment

### Hypothesis

### What was tried

### Result

### Learning

### Should move downstream?

### Next step
```

## 2026-07-02 14:14

### Experiment

Validate the feasibility of integrating Payments API with Asaas for the
complete credit card lifecycle: create charge, confirm payment, and cancel or
remove payment.

### Hypothesis

Payments API can expose a unified payment interface while Asaas handles credit
card operations transparently behind the provider boundary.

### What was tried

- Reviewed official Asaas documentation for credit card charge creation,
  paying an existing charge by card, payment deletion, payment webhooks, and
  webhook delivery behavior.
- Compared the documented Asaas operations with the current DTOs, Asaas adapter,
  invoice service, cancellation flow, webhook flow, and BDD Features.
- Checked whether the existing `billingType: CREDIT_CARD` support is enough for
  a Downstream implementation.

### Result

Feasible, but not ready for Downstream implementation. The current architecture
can support a credit card path, but the product must first choose between hosted
Asaas card entry, tokenized card payment, or direct transparent checkout with
raw card data. The direct card capture path adds security, timeout,
authorization-refusal, risk-analysis, and idempotency requirements that are not
yet specified.

### Learning

Credit card is not only another `billingType`. It introduces additional provider
states and events, including authorization, risk analysis, capture refusal,
confirmation, receipt, deletion, and refund. Simple deletion remains valid for
unpaid/open charges, but confirmed card payments require a refund/reversal
boundary rather than the existing cancel path.

### Should move downstream?

Needs another experiment before Downstream.

### Next step

Run a focused upstream experiment comparing hosted card entry vs tokenized card
payment for Magazine Siará checkout, then draft OBC, BDD scenarios, DTO fields,
observability events, and Reliability Plan risks.
