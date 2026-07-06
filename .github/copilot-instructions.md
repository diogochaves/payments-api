# GitHub Copilot Instructions

This project follows **ProdOps Delivery**, organized in two groups:

```
CI Sync   → Bootstrap → Hack → Sync → Finish    (trabalho local, síncrono)
CI Async  → Ship → Validate → Promote            (plataforma, pipelines, ambientes)
```

Read `AGENTS.md` for the full operating guide.

## Hack Flow (3 fases)

### Fase 1 — Antes de implementar
- Localizar OBC em `prodops/assessment/reliability-plan/obcs/`.
- Localizar BDD Feature em `prodops/current-state/features/` ou `prodops/upstream/features/`.
- Se o contrato não existir, criar antes de escrever qualquer teste ou código.

### Fase 2 — Durante a implementação
- **Contract First:** sem contrato verificável, sem código.
- **Integration First:** escrever o teste de integração primeiro. Confirmar Red Bar antes de implementar.
- **Observability First:** definir antes de implementar quais logs, métricas e `correlationId` serão emitidos.
- **Confiabilidade:** verificar no Green Bar — timeout, idempotência, exceções, HTTP codes semânticos, degradação controlada.
- Proibido em `api/test/`: `jest.fn()`, `jest.spyOn().mockXxx()`, `.overrideProvider()`.
- `ASAAS_MOCK=true` é permitido — modo de comportamento do serviço real, não um mock.
- Erros por falha de sistema externo pertencem a unit tests, não acceptance tests.

### Fase 3 — Após cada Red→Green→Refactor
- Executar **Commit Workflow**: `npm run lint` (com --fix) → `npm run test` → commit com Conventional Commits.
- Registrar evidências em `release-trail.md` (Downstream) ou `upstream-trail.md` (Upstream).

## Contratos e observabilidade

- Identificar ou criar OpenAPI spec, BDD Feature, ou schema antes de implementar novo comportamento.
- Definir observabilidade antes de implementar: quais logs, qual `correlationId`, quais métricas.
- Validar saída de logs, estrutura de erro, e rastreabilidade após o Green Bar.
- Nunca logar secrets, tokens, ou PII. `X-Api-Token` deve estar nos pino redact paths.

## Code quality

- Preserve all existing lint, formatting, and TypeScript rules.
- Run `npm run lint` (includes `--fix`) after every code change in `api/`.
- Do not add code without a corresponding test when the change is functional.
- Do not simplify or disable existing quality rules.
- Commits devem seguir Conventional Commits: `<type>(<scope>): <summary>`.

## Architecture

- Preserve existing module boundaries, naming, DTOs, and dependency direction.
- Update `prodops/assessment/architecture/overview.md` for structural changes.
- Do not invent missing business context. Read `prodops/current-state/` first.
