# Testing Policy

## Test pyramid

This repository prioritizes tests in this order:

1. **Acceptance / E2E tests** — HTTP boundary, real DynamoDB (LocalStack), real service instances. Live in `api/test/`.
2. **Integration tests** — module-level, cross-service interactions.
3. **Unit tests** — isolated, single-function behavior. Used for edge cases and error paths that cannot be reached through the HTTP boundary.

Unit tests are not a substitute for acceptance tests on functional behavior.

## Tooling

- Test runner: Jest (configured in `api/test/jest-e2e.json`)
- HTTP assertions: supertest
- Local infrastructure: LocalStack (DynamoDB, SQS)
- Acceptance test runner: `./scripts/test-acceptance.sh`

## No Mocks Rule

The prohibition on test doubles in acceptance tests is enforced as a merge-blocking quality gate.

- Definition técnica completa: [`skills/hack/references/workflow.md § No Mocks Rule`](../../skills/hack/references/workflow.md)
- Enforcement gate (o que bloqueia merge): [`prodops/downstream/quality-gates.md § Test Quality Gates`](../downstream/quality-gates.md)

## Error path testing

Error paths that require external system failure belong in unit or service-layer tests, not acceptance tests. See [ProdOps TDD — Yellow Bar Patterns](../delivery/practices/tdd-prodops.md).

## Shared app per file

Each acceptance test file creates the NestJS app once in `beforeAll` and tears it down in `afterAll`. Tables are truncated in `beforeEach`. App recreation per test is prohibited.

## Coverage

Coverage thresholds (when configured in `jest.config.*`) must not be reduced without a recorded justification in a [Decision Trail](../templates/decision-trail.md).
