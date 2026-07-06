# ProdOps TDD

ProdOps TDD is the evolution of classical TDD for the context of observable, reliable digital products. It combines TDD, contracts, integration testing, observability, reliability, and operational evidence into a single coding practice.

**ProdOps TDD is not a separate flow.** It is the practice used inside [Hack Flow](../hack-flow.md).

---

## Core definition

> Write a verifiable contract. Write an integration test against that contract. Make it fail. Make it pass with the minimum implementation. Observe. Refactor. Commit. Record evidence.

ProdOps TDD extends classical TDD (Detroit/Chicago school) by:
1. Starting from a contract, not just a test.
2. Prioritizing integration and acceptance tests over unit tests.
3. Requiring observability validation as part of the cycle.
4. Consuming the Commit Workflow after each Red→Green→Refactor cycle.
5. Producing recorded evidence before promotion.

---

## Principles

### Contract First
Toda implementação parte de um contrato verificável. Contratos aceitos: OpenAPI, AsyncAPI, JSON Schema, OBC, BDD Feature, eventos, especificações existentes. Se não existe contrato, criar antes de escrever o teste.

### Integration First
Priorizar testes que exercitam a aplicação por chamadas reais (HTTP, DynamoDB, eventos). Testar comportamento observável — não implementação interna. Unit tests cobrem casos que não alcançam a fronteira HTTP.

### Observability First
Antes de implementar, definir como o comportamento será observado: quais logs serão emitidos, quais métricas serão registradas, qual correlationId propagará. Observabilidade é parte do ciclo, não um extra pós-implementação.

### Progressive Substitution
Quando um Mock Server baseado em contrato for usado como passo inicial: iniciar com o Mock Server; substituir progressivamente pela API real; nunca reescrever os testes durante essa substituição. Os testes verificam o comportamento pelo contrato — o que está por trás é configuração.

### Non Intrusive Testing
Nunca alterar payload, headers, regras de negócio ou comportamento de produção para facilitar testes. Usar configuração por ambiente (env vars). `ASAAS_MOCK=true` é exemplo correto — ativa modo de comportamento do serviço real, não altera o contrato.

---

## Mandatory rules

1. **Prioritize integration tests.** Tests must verify behavior at the HTTP boundary or event boundary, not internal implementation details.

2. **No mocks for business rules.** Do not substitute owned services that carry business logic with test doubles. See the [No Mocks Rule](../../../skills/hack/references/workflow.md) and [quality-gates.md](../../downstream/quality-gates.md).

3. **No mocks for domain APIs when a verifiable contract exists.** If an OpenAPI, AsyncAPI, or BDD spec exists, test against it. Mock Servers based on that contract are acceptable as temporary infrastructure.

4. **Mock Servers are infrastructure, not shortcuts.** A Mock Server simulates an external dependency based on a published contract. It must be replaceable by the real integration without rewriting the tests (Progressive Substitution principle).

5. **Do not alter production payloads, headers, or logic for tests.** Tests must exercise the real code path. Environment variables and configuration switches are acceptable; code branches that only activate under test are not.

6. **Prefer environment configuration.** Use env vars (e.g., `ASAAS_MOCK=true`) to switch between test modes. `ASAAS_MOCK=true` activates a designed behavior mode of the real service — it is not a mock object.

7. **Exercise through real calls whenever possible.** Use `supertest` against the running NestJS app, real DynamoDB via LocalStack, and real service instances.

8. **Test behavior, not implementation.** Assert on HTTP responses, database state, log output, and emitted events — not on which internal methods were called.

9. **Validate HTTP responses, error messages, logs, and traceability.** A test that only checks status code is incomplete.

10. **Use contracts when applicable.** OpenAPI, AsyncAPI, Gherkin BDD Features, and JSON schemas are valid contracts. Reference them in test plans.

11. **Maintain Progressive Substitution compatibility.** Tests written against a Mock Server must pass without modification when the real integration is substituted.

---

## TDD Cycle (ProdOps variant)

```
1. Ler contrato / critério de aceite
2. Escrever teste de integração → Red Bar (deve falhar por razão comportamental)
3. Implementar o mínimo → Green Bar
4. Refatorar → continua Green
5. Executar Commit Workflow (formatter → lint → unit tests → commit)
6. Validar observabilidade (logs, erros, traceability, métricas)
7. Registrar evidência
```

Do not skip step 2. A test that was never red is not a verified test.

### Integração com Commit Workflow

O ProdOps TDD não implementa formatter, lint, nem gestão de commits. Essa responsabilidade pertence ao **Commit Workflow**.

Após cada ciclo Red→Green→Refactor (step 5 acima), o Hack consome o Commit Workflow:

```
Red → Green → Refactor → [Commit Workflow] → próximo ciclo
```

O Commit Workflow executa:
- Formatter (`npm run lint` com `--fix`)
- Lint (bloqueia se não passar)
- Unit tests rápidos
- Validação de Conventional Commit

Ver: [`prodops/commit-workflow/README.md`](../../commit-workflow/README.md)

### Confiabilidade no ciclo

Durante a implementação, considerar os requisitos de confiabilidade para o comportamento sendo testado:

| Aspecto | O que verificar |
|---|---|
| **Timeout** | O sistema tem timeout configurado para chamadas ao provedor? |
| **Retry** | Retentativas com mesma `Idempotency-Key` produzem o mesmo resultado? |
| **Idempotência** | Mesma operação executada duas vezes retorna o mesmo estado? |
| **Exceções** | Erros do provedor produzem resposta HTTP significativa (4xx/5xx com `message`)? |
| **Degradação controlada** | Falha de dependência externa não derruba o sistema inteiro? |
| **Códigos HTTP** | Os status codes correspondem ao comportamento semântico (201, 400, 404, 409)? |

Esses aspectos não precisam de testes separados quando já cobertos pelo teste de integração principal. Mas devem ser verificados no Green Bar antes de avançar.

---

## Patterns

### Red Bar Patterns

| Pattern | When to use |
|---|---|
| **Starter Test** | First test for a new capability; verifies the simplest possible observable result. |
| **One Step Test** | One new behavior increment per test; avoids leaping ahead. |
| **Explanation Test** | Clarifies expected behavior for a spec that is ambiguous or underdocumented. |
| **Learning Test** | Explores behavior of a third-party dependency before integrating it. |
| **Another Test** | Captures a new idea that surfaced while writing the current test; add it to the list to avoid losing it. |
| **Triangulation Test** | Adds a second scenario to drive out generalization when Fake It was used first. |
| **Regression Test** | Written before fixing a confirmed defect; ensures the defect cannot recur. |
| **Break Test** | Verifies boundary conditions: empty input, max values, invalid states. |
| **Do Over** | Deletes a test suite that tested implementation instead of behavior and rewrites from the contract. |

### Green Bar Patterns

| Pattern | When to use |
|---|---|
| **Fake It** | Returns a hard-coded value to get to green fast; followed by Triangulate to generalize. |
| **Triangulate** | Adds a second scenario that forces the Fake It to become a real implementation. |
| **Obvious Implementation** | Used when the correct implementation is obvious and short; skips Fake It. |
| **One-to-Many** | Drives a collection-aware implementation from a single-item test, then adds the multi-item test. |

### Yellow Bar Patterns

Yellow Bar patterns manage test complexity. They are **not a license to mock business logic.**

| Pattern | Acceptable use | Not acceptable |
|---|---|---|
| **Mock Object** | Technical dependencies: logger, clock, UUID generator, telemetry adapter, e-mail adapter, external HTTP client when no contract exists and the integration is expensive/unpredictable. | Owned services, repositories, domain rules, or any component that carries business behavior. |
| **Self Shunt** | Test class implements a listener interface to observe internal events. | — |
| **Log String** | Captures log output to assert that observability behavior is correct. | — |
| **Child Test** | Splits a failing test into a smaller test when the parent test is too complex to debug. | — |
| **Crash Test Dummy** | Simulates a catastrophic failure (OOM, fatal error) that cannot be triggered in a real environment. | Simulating predictable business errors that the real system can produce. |
| **Broken Test** | Leaves a test failing intentionally with a clear comment when work is in progress and a commit is needed. | — |
| **Clear Check-in** | Ensures all tests pass before committing, even if it means reverting a broken change. | — |

**Rule:** a Mock Object is acceptable only when it does not hide business behavior. If the mock substitutes logic that the real code would execute differently, it is hiding a defect.

---

## What ProdOps TDD is not

- It is not a reason to skip acceptance tests.
- It is not a reason to use mocks as the default approach.
- It is not a separate flow from Hack Flow.
- It is not permission to add test-only branches in production code.
- It is not a substitute for observability validation.
