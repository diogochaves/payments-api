# Claude Code Instructions

Use `AGENTS.md` as the shared operating guide for this repository.

Claude-specific behavior:

- Treat `AGENTS.md` as project memory and follow its ProdOps-first workflow.
- Keep Claude memory focused on stable repository conventions, not release
  decisions that belong in `prodops/`.
- When a task affects product behavior, read the relevant ProdOps artifacts
  before editing code.
- Route exploratory work through `prodops/journeys/discovery/` and committed delivery work
  through `prodops/execution-model/downstream.md`.
- Do not store duplicated business context in Claude-only files. Add or update
  the appropriate file under `prodops/` instead.
- Use `prodops/skills/` for execution mode guidance and `prodops/` for product context.

## Organização do ProdOps Delivery

```
CI Sync   → Bootstrap → Hack → Sync → Finish    (trabalho local, síncrono)
CI Async  → Ship → Validate → Promote            (plataforma, pipelines, ambientes)
```

Ship: Preparation (Build, Package, Version, Sign, SBOM, Publish) + Deployment (Deploy, Progressive Delivery, Rollout, Rollback). Build/Package/Publish são capabilities internas do Ship, não etapas principais.

Para regras de execução, fluxo de Hack, ProdOps TDD, Commit Workflow e checklist de fechamento: ver `AGENTS.md` e `prodops/README.md`.
