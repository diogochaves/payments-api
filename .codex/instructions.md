# Codex Instructions

Use `AGENTS.md` as the shared operating guide for this repository.

Codex-specific behavior:

- Siga o fluxo ProdOps-first descrito em `AGENTS.md`; comece por
  `prodops/README.md` (portal e mapa de navegação).
- Use `prodops/skills/` como guia canônico de execução das fases.
- Mantenha estas instruções curtas e específicas de ferramenta; contexto de
  produto pertence a `prodops/`.
- Não duplicar contexto de negócio em arquivos específicos do Codex; adicionar
  ou atualizar o arquivo apropriado em `prodops/`.

## Organização do ProdOps Delivery

```
CI Sync   → Bootstrap → Hack → Sync → Finish    (trabalho local, síncrono)
CI Async  → Ship → Validate → Promote            (plataforma, pipelines, ambientes)
```

Para todos os caminhos canônicos: `prodops/framework/canonical-paths.md`.

## Regras essenciais

- Nunca inventar OBCs, riscos ou critérios de aceite ausentes.
- Downstream exige OBC, BDD Feature e entrada no Iteration Plan com status
  `Entrou` antes de alterar código de produção.
- Commits seguem Conventional Commits (`<type>(<scope>): <summary>`).
- Após trabalho Downstream relevante, registrar evidência em
  `prodops/artifacts/trails/release-trail.md`.
