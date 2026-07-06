# Observability Policy

Observability is a first-class deliverable. Code that changes observable behavior must validate log output, error structure, and traceability before the change is considered complete.

## Logging rules

- Use structured JSON logging (pino). Do not use `console.log`.
- Every request must carry `correlationId` and `tenantId` in log context.
- Log at `info` level: request received, provider call initiated, result persisted.
- Log at `warn` level: retries, degraded provider response, fallback activated.
- Log at `error` level: unhandled exceptions, provider errors that affect the customer.
- Never log secrets, tokens, or PII. `X-Api-Token` and `ADMIN_SECRET` must be in pino redact paths.

## Error responses

- HTTP 4xx errors must return a `message` field with a human-readable description.
- HTTP 5xx errors must not expose internal stack traces or provider internals.
- All error responses must include the `correlationId` for support traceability.

## Traceability

- `X-Correlation-Id` header must propagate from the request to all downstream calls and log entries.
- `tenantId` must be present in every log line that records a business action.
- Provider payment IDs (`providerPaymentId`) must be logged when known.

## Metrics

- Registrar métricas de negócio nos eventos críticos: criação de invoice, confirmação de pagamento, rejeição de autorização.
- Métricas devem ter dimensões de `tenantId` e `status` para permitir agregação por tenant e por resultado.
- Não bloquear o fluxo principal em caso de falha de métrica.

## Health checks

- Endpoints de health check (`/health`) devem verificar disponibilidade de DynamoDB e SQS.
- Health check não deve incluir dados do tenant — apenas disponibilidade de infraestrutura.

## Observability First (princípio)

Antes de implementar, definir:
- Quais logs serão emitidos e em qual nível.
- Qual `correlationId` propagará pela cadeia de chamadas.
- Quais métricas serão registradas.

Observabilidade não é um passo pós-implementação. É planejada junto com o contrato. Ver [ProdOps TDD — Observability First](../delivery/practices/tdd-prodops.md).

## Validation in tests

Observability validation is part of the [Hack Flow](../delivery/hack-flow.md). After the green bar, verify that:
- Expected log entries are emitted (use Log String pattern).
- Error responses carry the expected `message` and structure.
- No sensitive data appears in logs.
