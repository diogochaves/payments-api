# Integration Testing Policy

Integration and acceptance tests in this repository exercise the full application stack:
- Real NestJS application (all modules wired)
- Real DynamoDB via LocalStack
- Real service instances (no substitutions)
- Real HTTP via supertest

## Acceptance test location

`api/test/` — one file per domain behavior (`criar-invoice`, `cancelar-invoice`, `confirmar-pagamento`, `api-token`).

## Test structure

```typescript
// One app per file — created in beforeAll, torn down in afterAll
beforeAll(async () => {
  fixture = await buildTestFixture();
  app = fixture.app;
});

afterAll(async () => {
  await teardownFixture(fixture);
});

// Tables truncated between tests
beforeEach(async () => {
  await truncateAllTables();
});
```

## LocalStack

Required services: `dynamodb`, `sqs`.

Start and health-check via `./scripts/test-acceptance.sh`. The script detects whether LocalStack is running and starts it if needed.

## DynamoDB client in tests

`api/test/dynamo-test-utils.ts` provides a singleton DynamoDB client with connection management. Use `truncateAllTables()` and `resetTestClient()` from this module — do not create ad-hoc clients in test files.

## Progressive Substitution

Tests that currently rely on `ASAAS_MOCK=true` must pass without modification when `ASAAS_MOCK` is removed and the sandbox integration is substituted. The test verifies observable HTTP behavior; the provider's internal mode is configuration.

## Contract alignment

Acceptance tests must align with the BDD Feature file for the same behavior. If the Feature file and the test diverge, update the Feature file first and treat the divergence as a gap.
