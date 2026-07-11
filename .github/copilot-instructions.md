# GitHub Copilot Instructions

This project follows **ProdOps Delivery**, organized in two groups:

```
CI Sync   → Bootstrap → Hack → Sync → Finish    (trabalho local, síncrono)
CI Async  → Ship → Validate → Promote            (plataforma, pipelines, ambientes)
```

Read `AGENTS.md` for the full operating guide and Hack Flow checklist.
For ProdOps framework documentation: `prodops/README.md`.
For all canonical paths: `prodops/framework/canonical-paths.md`.

## Regras obrigatórias

- Identificar ou criar OpenAPI spec, BDD Feature ou schema antes de implementar novo comportamento.
- Definir observabilidade antes de implementar: quais logs, qual `correlationId`, quais métricas.
- Nunca logar secrets, tokens ou PII. `X-Api-Token` deve estar nos pino redact paths.
- Proibido em `api/test/`: `jest.fn()`, `jest.spyOn().mockXxx()`, `.overrideProvider()`.
- `ASAAS_MOCK=true` é permitido — modo de comportamento do serviço real, não um mock.
- Nunca inventar contexto de produto, OBCs, BDD Features, SLOs ou riscos ausentes.

## Code quality

- Preserve all existing lint, formatting, and TypeScript rules.
- Run `npm run lint` (includes `--fix`) after every code change in `api/`.
- Do not add code without a corresponding test when the change is functional.
- Commits devem seguir Conventional Commits: `<type>(<scope>): <summary>`.

## Architecture

- Preserve existing module boundaries, naming, DTOs, and dependency direction.
- Update `prodops/journeys/assessment/architecture/overview.md` for structural changes.
- Do not invent missing business context. Read `prodops/artifacts/product/` first.

## Canonical paths (quick reference)

| Concern | Path |
|---|---|
| Product context | `prodops/artifacts/product/` |
| OBCs (committed) | `prodops/artifacts/obcs/` |
| BDD Features (committed) | `prodops/artifacts/bdd/` |
| Iteration Plan | `prodops/artifacts/plans/iteration-plan.md` |
| Release Trail | `prodops/artifacts/trails/release-trail.md` |
| Risks | `prodops/journeys/assessment/risks.md` |
| Reliability Plans | `prodops/journeys/assessment/reliability-plans/` |
| Architecture | `prodops/journeys/assessment/architecture/overview.md` |
| Discovery experiments | `prodops/journeys/discovery/experiments/` |
| Discovery global trail | `prodops/journeys/discovery/upstream-trail.md` |
| ProdOps TDD | `prodops/journeys/delivery/practices/prodops-tdd.md` |
| Testing Policy | `prodops/journeys/delivery/practices/testing-policy.md` |
