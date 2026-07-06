# Quality Gates

Use this file to record release quality gates that apply across implementation,
validation, shipping, and promotion.

## Delivery Gates

- Relevant ProdOps context was read before implementation.
- Behavior changes are covered by BDD-backed tests when applicable.
- Reliability Plan risks impacted by the change were reviewed.
- Build, test, or validation evidence is recorded in the Release Trail.
- Operational follow-ups are recorded instead of being left implicit.

## Test Quality Gates

> **Fonte canônica do No Mocks Rule.** A definição técnica completa está em [`skills/hack/references/workflow.md § No Mocks Rule`](../../skills/hack/references/workflow.md). Este arquivo define o gate de enforcement — o que bloqueia merge.

**No test doubles in acceptance tests.** `api/test/` must not contain `jest.fn()` service replacements, `jest.spyOn(...).mockXxx()` implementations, or `.overrideProvider()` calls. Violations block merge.

**`ASAAS_MOCK=true` is allowed.** It is a designed behavior mode of the real `AsaasService`, not a test double. The real service is instantiated; the mock flag controls which branch runs.

**Real DynamoDB via LocalStack.** All acceptance tests hit a real DynamoDB-compatible API. In-memory or mocked repository modes (`INVOICE_REPOSITORY=memory`, `DYNAMO_MOCK=true`) are prohibited in `api/test/`.

**Shared app per file.** Each spec file creates the NestJS application once in `beforeAll` and tears it down in `afterAll`. Tables are truncated in `beforeEach`. No app recreation per test.

**Error injection tests belong in unit tests.** Scenarios that require forcing an external service to fail (timeout, malformed response, network error) are not acceptance test scenarios. They are unit tests targeting the service layer in isolation and live outside `api/test/` acceptance specs.
