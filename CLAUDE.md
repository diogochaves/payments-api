# Claude Code Instructions

Use `AGENTS.md` as the operating guide for this repository.

Claude-specific behavior:

- Treat `prodops/` as the canonical source of product and framework context. Do not invent missing business context.
- When a task affects product behavior, read the relevant artifacts in `prodops/product/`, `prodops/assessment/obcs/`, and `prodops/product/features/` before editing code.
- Route exploratory work through `prodops/upstream/` and committed delivery work through `prodops/downstream/`.
- Do not store duplicated business context in Claude-only files. Update the appropriate file under `prodops/` instead.
- Use `skills/` for execution mode guidance and `prodops/` for product context.
- Keep Claude memory focused on stable repository conventions, not release decisions that belong in `prodops/`.

## ProdOps Delivery

```
CI Sync   → Bootstrap → Hack → Sync → Finish    (trabalho local, síncrono)
CI Async  → Ship → Validate → Promote            (plataforma, pipelines, ambientes)
```

Ship families: Preparation (Build, Package, Version, Sign, SBOM, Publish) + Deployment (Deploy, Progressive Delivery, Rollout, Rollback). Build/Package/Publish são capabilities internas do Ship, não etapas principais.

Para regras de execução, fluxo de Hack, ProdOps TDD, Commit Workflow e checklist de fechamento: ver `AGENTS.md` e `prodops/README.md`.
