# Claude Code Instructions

Use `AGENTS.md` as the shared operating guide for this repository.

Claude-specific behavior:

- Treat `AGENTS.md` as project memory and follow its ProdOps-first workflow.
- Keep Claude memory focused on stable repository conventions, not release
  decisions that belong in `prodops/`.
- When a task affects product behavior, read the relevant ProdOps artifacts
  before editing code.
- Route exploratory work through `prodops/upstream/` and committed delivery work
  through `prodops/downstream/`.
- Do not store duplicated business context in Claude-only files. Add or update
  the appropriate file under `prodops/` instead.
- Use `skills/` for execution mode guidance and `prodops/` for product context.

## Organização do ProdOps Delivery

```
CI Sync   → Bootstrap → Hack → Sync → Finish
CI Async  → Ship → Validate → Promote
```

Bootstrap: branch + leitura de OBC/BDD Feature/testes existentes.
Ship: duas famílias — Preparation (Build, Package, Version, Sign, SBOM, Publish) e Deployment (Deploy, Progressive Delivery, Rollout, Rollback). Build/Package/Publish são capabilities internas do Ship, não etapas principais.

## Hack Flow com ProdOps TDD (Claude sessions)

O Hack Flow consome duas capabilities: **ProdOps TDD** (como implementar) e **Commit Workflow** (como validar e publicar).

### Fase 1 — Antes de implementar

1. Localizar OBC em `prodops/assessment/reliability-plan/obcs/`.
2. Localizar BDD Feature em `prodops/current-state/features/` ou `prodops/upstream/features/`.
3. Verificar testes existentes em `api/test/`.
4. Se o contrato não existir, criar antes de escrever código.

### Fase 2 — Durante a implementação

- **Contract First:** sem contrato verificável, sem código.
- **Integration First:** escrever o teste de integração primeiro. Confirmar Red Bar antes de implementar.
- **Observability First:** definir antes de implementar quais logs, métricas e `correlationId` serão emitidos.
- **Confiabilidade:** verificar no Green Bar: timeout, idempotência, tratamento de exceções, códigos HTTP semânticos.
- `jest.fn()`, `jest.spyOn().mockXxx()`, `.overrideProvider()` são **proibidos** em `api/test/`.
- `ASAAS_MOCK=true` é permitido — exercita o código real de `AsaasService`.

### Fase 3 — Após cada Red→Green→Refactor

Consumir o **Commit Workflow**:
```bash
# Com hooks: git commit -m "<type>(<scope>): <summary>"
# Sem hooks:
cd api && npm run lint   # formatter + lint --fix
cd api && npm run test   # unit tests
```

Registrar evidências em `release-trail.md` (Downstream) ou `upstream-trail.md` (Upstream).

### Validation before closing

1. `cd api && npm run lint` — exit 0.
2. `npm run test` — unit tests.
3. `./scripts/test-acceptance.sh` — quando comportamento de pagamento ou contratos mudaram.
4. Confirmar [Definition of Done](prodops/engineering/definition-of-done.md).

**Conflitos:** registrar em `prodops/templates/decision-trail.md`. Nunca sobrescrever silenciosamente regra existente.
