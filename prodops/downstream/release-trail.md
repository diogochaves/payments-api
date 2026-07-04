## 2026-06-30 22:24

### Summary

Implemented in-repo Reliability Plan P0 hardening for payment confirmation: Dynamo webhook correlation now finds invoices by provider payment id or external reference, and uncorrelated provider webhooks now emit an observable event.

### Related

- Reliability Plan: `prodops/assessment/reliability-plan/README.md`
- OBC: Confirmacao de pagamento confiavel para a jornada Checkout -> Payments
- BDD Feature: `prodops/upstream/features/payment-confirmation.feature`

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

- Reliability Plan: `prodops/assessment/reliability-plan/README.md`
- OBC: Product Deck and Service Deck OBC sections referenced in the README
- BDD Feature: `prodops/upstream/features`

### Code

- `README.md`

### Tests

- Tests created or updated: none
- Validation executed: checked referenced README paths exist
- Validation executed: `git diff --check -- README.md prodops/downstream/release-trail.md`

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
- `validation-workbench/node_modules`

### Tests

- Tests created or updated: none, mechanical repository hygiene change
- Validation executed: `git ls-files | rg '(^|/)node_modules(/|$)' || true`
- Validation executed: `git check-ignore -v validation-workbench/node_modules/.keep api/node_modules/.keep node_modules/.keep`

### Artifacts Updated

- Product Deck: not changed
- Service Deck: not changed
- Tracking List: not changed
- Reliability Plan: not changed
- OBC: not changed

### Notes

The local `validation-workbench/node_modules` directory can remain on disk for the developer environment, but it is no longer tracked by Git.

## 2026-07-02 11:38

### What changed?

Organized the repository for Claude, Codex, and Copilot agents with ProdOps as the single source of context. Added root agent guidance, Claude/Codex-specific instructions, Copilot prompts, generic execution skills, canonical ProdOps folders, and operation/diligence placeholders.

### Why?

To separate product context from execution workflows and tool-specific configuration, reducing duplicated business knowledge across agent surfaces.

### Related OBC

Not applicable; repository organization change.

### Related BDD

Not applicable; no product behavior changed.

### Evidence

- Created root `AGENTS.md` flow: Current State -> Assessment -> Reliability Plan -> BDD Feature -> Skill -> Code -> Release Trail.
- Added generic skills under `skills/`.
- Moved ProdOps artifacts to canonical paths under `prodops/current-state/`, `prodops/assessment/`, `prodops/downstream/`, and `prodops/operation/`.
- Updated old ProdOps path references.
- Validation executed: expected structure presence check.
- Validation executed: old path/name reference search.
- Validation executed: root skill frontmatter check.

### Next steps

Keep future product context in `prodops/` and keep skills limited to execution procedure.

## 2026-07-02 13:42

### What changed?

Split the ProdOps workspace into Upstream and Downstream paths. Moved governed delivery evidence from `prodops/diligence/` to `prodops/downstream/`, added the Upstream exploration workspace, added `skills/upstream/` and `skills/downstream/`, and added templates for both paths.

### Why?

To separate lightweight exploration from governed delivery while preserving the full ProdOps delivery flow for committed release work.

### Related OBC

Not applicable; repository organization change.

### Related BDD

Not applicable; no product behavior changed.

### Evidence

- Moved Release Trail, Quality Gates, and Done Criteria into `prodops/downstream/`.
- Added `prodops/upstream/` for experiments, spikes, prototypes, learnings, and upstream trail.
- Added `prodops/downstream/delivery-flow.md` and a pointer backlog.
- Added `skills/upstream/SKILL.md` and `skills/downstream/SKILL.md`.
- Updated agent and Copilot prompts to route work through Upstream or Downstream.

### Next steps

Use Upstream for reversible exploration and Downstream for approved delivery governed by the full ProdOps flow.

## 2026-07-03 — Webhook Configuration per API Token

### What changed?

Implemented webhook configuration API, allowing API Token holders to register
HTTPS callback URLs that receive `invoice.confirmed` and `invoice.cancelled`
events. Each webhook has an auto-generated HMAC-SHA256 secret returned only at
creation. Delivery is fire-and-forget; failure never blocks the payment flow.

Canonical events `payment.confirmed` and `payment.cancelled` were enriched with
`tenantId`, `amount`, and `currency` to give downstream consumers full context
without a secondary lookup.

### Why?

Complete the integration contract: consumers using API Tokens need status
notifications without polling. Webhook configuration is the natural complement to
the API Token feature delivered earlier in this iteration.

### Related OBC

`prodops/assessment/reliability-plan/obcs/webhook-configuration.md`

### Related BDD

`prodops/current-state/features/webhook-configuration.feature`

### Evidence

- `WebhooksModule` created at `api/src/modules/webhooks/` with:
  - `WebhookRepository` — DynamoDB-backed storage with `TenantWebhooksIndex` GSI.
  - `WebhookService` — registration, listing, deactivation; URL validation (HTTPS or localhost).
  - `WebhookDeliveryService` — listens to `payment.confirmed` / `payment.cancelled`; dispatches signed HTTP POST with 10s timeout; emits `webhook.delivery.sent` / `webhook.delivery.failed`.
  - `WebhookConfigController` — `POST /webhooks`, `GET /webhooks`, `DELETE /webhooks/:webhookId`, all behind `ApiTokenGuard`.
- `WebhooksTable` added to `api/infra/dynamodb.yaml` with `TenantWebhooksIndex` GSI.
- `payment.confirmed` and `payment.cancelled` events enriched with `tenantId`, `amount`, `currency` in `invoice.service.ts`.
- `WebhooksModule` registered in `AppModule`.
- Build: `cd api && npm run build` — passed with no errors.

### Next steps

- Add acceptance tests: webhook registration, listing, delivery on confirmed event.
- Add retry logic for failed deliveries (backoff + dead-letter queue).
- Add `WEBHOOKS_TABLE` env var to `.env.example`.
- Consider TTL for deactivated webhook records in DynamoDB.

## 2026-07-03 — API Token Validation

### What changed?

Implemented API Token authentication for the Payments API. All business routes
(`/invoices`) now require a valid `X-Api-Token` header. Webhook routes remain
excluded (they use their own `asaas-access-token` validation). A local dev token
is pre-registered via `API_TOKEN_LOCAL` env var, allowing localhost access without
external secrets infrastructure.

### Why?

Enable controlled access to the Payments API by tenant, eliminate anonymous
consumption by Checkout or integrations, and establish observable token validation
events from day one of production traffic.

### Related OBC

`prodops/assessment/reliability-plan/obcs/api-token-validation.md`

### Related BDD

`prodops/current-state/features/api-token-validation.feature`

### Evidence

- `AuthModule` created at `api/src/modules/auth/` with `ApiTokenService` and `ApiTokenGuard`.
- `ApiTokenGuard` applied to `InvoiceController` via `@UseGuards`.
- `X-Api-Token` added to CORS allowed headers (`api/src/main.ts`).
- `X-Api-Token` added to pino log redaction paths (`api/src/app.module.ts`).
- `API_TOKEN_LOCAL` documented in `.env.example` and set in `.env` for local dev.
- Build executed: `cd api && npm run build` — passed with no errors.

### Next steps

- Add acceptance test scenarios for 401 rejection and token validation.
- Wire `API_TOKENS` env var with real Checkout token in staging before go-live.
- Evaluate token store migration to DynamoDB or SSM Parameter Store for zero-deploy revocation.
