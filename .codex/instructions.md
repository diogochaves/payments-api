# Codex Instructions

Use `AGENTS.md` as the shared operating guide for this repository.

Codex-specific behavior:

- Siga o fluxo ProdOps-first descrito em `AGENTS.md`; comece por
  `prodops/README.md` (portal e mapa de navegação).
- Use `prodops/skills/` como guia canônico de execução das fases
  (Bootstrap → Hack → Sync → Finish → Ship → Validate → Promote).
- Mantenha estas instruções curtas e específicas de ferramenta; contexto de
  produto pertence a `prodops/`.

## Caminhos canônicos

| Assunto | Localização |
|---|---|
| Portal ProdOps | `prodops/README.md` |
| Skills de execução | `prodops/skills/` |
| OBCs (Observable Business Contracts) | `prodops/artifacts/obcs/` |
| BDD Features | `prodops/artifacts/bdd/` |
| Release Trail | `prodops/artifacts/trails/release-trail.md` |
| Reliability Plans | `prodops/journeys/assessment/reliability-plans/` |
| Upstream (exploração) | `prodops/execution-model/upstream.md` |
| Downstream (entrega governada) | `prodops/execution-model/downstream.md` |

## Regras essenciais

- Nunca inventar OBCs, riscos ou critérios de aceite ausentes.
- Downstream exige OBC, BDD Feature e entrada no Iteration Plan com status
  `Entrou` antes de alterar código de produção.
- Commits seguem Conventional Commits (`<type>(<scope>): <summary>`).
- Após trabalho Downstream relevante, registrar evidência em
  `prodops/artifacts/trails/release-trail.md`.
