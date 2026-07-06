# Definition of Done

An implementation is done when all of the following are true:

## Behavior

- [ ] The expected behavior is covered by a test that was red before implementation.
- [ ] The test verifies behavior at the HTTP or event boundary (not internal implementation).
- [ ] Relevant integration and acceptance tests pass.
- [ ] No mocks substitute owned services or business rules.

## Contracts

- [ ] The BDD Feature for this behavior reflects the implemented contract.
- [ ] OpenAPI or AsyncAPI spec is updated if a route or event was added, changed, or removed.
- [ ] The OBC acceptance criteria are met by the evidence.

## Code quality

- [ ] No test-only branches exist in production code.
- [ ] Formatter executado (`npm run lint` com `--fix` aplicado).
- [ ] Lint passa (`npm run lint` exit 0 em `api/`).
- [ ] Build passa.
- [ ] No new TypeScript errors introduced.
- [ ] Commits seguem Conventional Commits (`<type>(<scope>): <summary>`).

## Observability

- [ ] Comportamento observável definido antes de implementar (qual log, qual métrica, qual correlationId).
- [ ] Relevant logs are emitted with correct structure (correlationId, tenantId).
- [ ] Error responses carry meaningful messages.
- [ ] No secrets or PII appear in logs.

## Reliability

- [ ] Timeout configurado para chamadas ao provedor externo.
- [ ] Idempotência verificada: mesma operação repetida retorna o mesmo estado.
- [ ] Exceções do provedor produzem resposta HTTP com `message` significativa.
- [ ] Degradação controlada: falha de dependência externa não derruba o sistema.
- [ ] Códigos HTTP correspondem ao comportamento semântico (201, 400, 404, 409).

## Architecture

- [ ] Architecture diagram updated if the change was structural (new module, route, table, event topic).
- [ ] Event Storming plan updated if events were added, removed, or renamed.

## Evidence

- [ ] Evidence appended to `prodops/downstream/release-trail.md` (Downstream) or experiment trail (Upstream).
- [ ] Evidence includes: test output, lint output, summary of change.

## Ready for Sync + Finish

- [ ] All boxes above are checked.
- [ ] The change is ready to enter [Sync + Finish Flow](../delivery/sync-finish-flow.md).
