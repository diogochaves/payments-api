# Claude Code Instructions

Use `AGENTS.md` como guia operacional — é um roteador mínimo: skill da fase
primeiro, manifest para paths/gates/vocabulário, OBC + BDD do card como
contexto. Não pré-leia a documentação do framework.

Comportamento específico do Claude:

- Invoque os skills das fases via `/bootstrap`, `/hack`, `/sync`, `/finish`,
  `/ship`, `/validate`, `/promote` (e `/upstream`, `/downstream` para modo).
- Não armazenar contexto de negócio duplicado em arquivos exclusivos do Claude.
  Adicionar ou atualizar o arquivo apropriado sob `prodops/`.
- Memória do Claude: apenas convenções estáveis do repositório — decisões de
  release pertencem a `prodops/`.
