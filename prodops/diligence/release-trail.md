## 2026-06-30 22:24

### Summary

Implemented in-repo Reliability Plan P0 hardening for payment confirmation: Dynamo webhook correlation now finds invoices by provider payment id or external reference, and uncorrelated provider webhooks now emit an observable event.

### Related

- Reliability Plan: `prodops/assessment/reliability-plan/Reliability_Plan.md`
- OBC: Confirmacao de pagamento confiavel para a jornada Checkout -> Payments
- BDD Feature: `prodops/current-state/features/payment-confirmation.feature`

### Code

- `api/src/infra/dynamo.service.ts`
- `api/src/modules/invoices/services/invoice-repository.service.ts`
- `api/src/modules/invoices/services/invoice.service.ts`

### Tests

- Tests created or updated: `api/test/create-invoice.acceptance.e2e-spec.ts`
- Validation executed: `cd api && npm run test:acceptance -- --runInBand`
- Validation executed: `cd api && npm run build`

### Artifacts Updated

- Product Deck: not changed
- Service Deck: not changed
- Tracking List: not changed
- Reliability Plan: updated to reflect implemented Dynamo correlation and uncorrelated webhook observability
- OBC: not changed

### Notes

Remaining Reliability Plan items outside this change include Checkout Feature Flag readiness, retry policy for transient provider failures, required webhook token validation for release environments, Asaas timeout configuration and durable publication strategy for `payment.confirmed`.
