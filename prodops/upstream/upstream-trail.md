# Upstream Trail

Append upstream exploration entries here.

```markdown
## YYYY-MM-DD HH:MM

### Experiment

### Business Goal

### Hypothesis

### Code Produced

### Validation Workbench Updated

### Contracts Updated

### BDD Updated

### Reliability Impact

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

### Business Goal

Understand whether credit card payments can be added to the Payments gateway
without committing the capability to Downstream.

### Hypothesis

Payments API can expose a unified payment interface while Asaas handles credit
card operations transparently behind the provider boundary.

### Code Produced

No code was produced in this experiment.

### Validation Workbench Updated

No.

### Contracts Updated

No.

### BDD Updated

No.

### Reliability Impact

Identified future risks around card timeout, duplicate capture attempts, risk
analysis delay, PCI/security boundary, webhook queue loss, and refund versus
deletion semantics.

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

## 2026-07-02 14:53

### Experiment

Redefine Upstream as a complete exploratory engineering path and rename the
local functional validation frontend to Validation Workbench.

### Business Goal

Make it clear that capabilities can produce executable evidence, contracts, BDDs
and functional validations before they are committed to Downstream delivery.

### Hypothesis

Separating learning commitment from delivery commitment lets agents explore
faster while preserving the full ProdOps governance for Downstream work.

### Code Produced

No product capability code was produced. The local validation frontend was
renamed to `validation-workbench/`, with package metadata and references
updated.

### Validation Workbench Updated

Yes. The workspace now treats `validation-workbench/` as an Upstream functional
validation environment for OBCs, BDDs, integrations, UX and contracts.

### Contracts Updated

No OpenAPI or AsyncAPI contracts were changed.

### BDD Updated

No BDD feature was changed.

### Reliability Impact

The documentation now states that Upstream experiments may update the
Reliability Plan, Event Storming and Tracking List when they produce validated
evidence. Downstream still requires OBC, BDD, Reliability Plan and Iteration
Backlog before delivery execution.

### Result

ProdOps documentation, the Upstream skill, the Upstream trail template and the
Validation Workbench references now reflect Upstream as exploratory engineering
instead of documentation-only experimentation.

### Learning

The previous generic name hid the real purpose of the local frontend. Treating
it as the Validation Workbench gives agents a clear place to validate functional
behavior before deciding whether a capability should move to Downstream.

### Should move downstream?

No. This is a process and workspace architecture update, not a business
capability. Future capabilities explored in Upstream must explicitly justify
whether they are ready for Downstream.

### Next step

Use `validation-workbench/` for future Upstream functional validation and mark
all Upstream code as disposable until a successful experiment is promoted into
the Downstream flow.
