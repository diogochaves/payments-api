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

## 2026-07-02 09:58

### Summary

Updated the repository home in `README.md` to present payments-api as the ProdOps University reference project, connecting the functional sandbox to product, reliability, observability, testing and operational artifacts.

### Related

- Reliability Plan: `prodops/assessment/reliability-plan/Reliability_Plan.md`
- OBC: Product Deck and Service Deck OBC sections referenced in the README
- BDD Feature: `prodops/current-state/features`

### Code

- `README.md`

### Tests

- Tests created or updated: none
- Validation executed: checked referenced README paths exist
- Validation executed: `git diff --check -- README.md prodops/diligence/release-trail.md`

### Artifacts Updated

- Product Deck: referenced, not changed
- Service Deck: referenced, not changed
- Tracking List: referenced, not changed
- Reliability Plan: referenced, not changed
- OBC: referenced, not changed

### Notes

README now calls out educational roadmap gaps explicitly: OpenAPI, OpenSLO, dedicated runbooks, Decision Trail, postmortems, dashboards and event contracts.

## 2026-07-02 11:17

### Summary

Removed the tracked frontend `node_modules` tree from Git and updated the repository ignore rules so dependency folders are ignored at any directory depth.

### Related

- Reliability Plan: not applicable
- OBC: not applicable
- BDD Feature: not applicable

### Code

- `.gitignore`
- `test/node_modules`

### Tests

- Tests created or updated: none, mechanical repository hygiene change
- Validation executed: `git ls-files | rg '(^|/)node_modules(/|$)' || true`
- Validation executed: `git check-ignore -v test/node_modules/.keep api/node_modules/.keep node_modules/.keep`

### Artifacts Updated

- Product Deck: not changed
- Service Deck: not changed
- Tracking List: not changed
- Reliability Plan: not changed
- OBC: not changed

### Notes

The local `test/node_modules` directory can remain on disk for the developer environment, but it is no longer tracked by Git.
