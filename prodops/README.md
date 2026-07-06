# ProdOps — Índice do Framework

Este diretório é a fonte canônica do Framework ProdOps neste repositório.

## Como ler o ProdOps neste repositório

Leia nesta ordem para qualquer tarefa:

1. **[framework/principles.md](framework/principles.md)** — princípios do framework
2. **[framework/glossary.md](framework/glossary.md)** — termos oficiais (CI Sync, CI Async, Bootstrap, Ship, OBC, BDD…)
3. **[delivery/README.md](delivery/README.md)** — visão geral do ProdOps Delivery (CI Sync / CI Async)
4. Identifique se a tarefa pertence ao **CI Sync** (implementação) ou **CI Async** (pipeline/deploy)
5. Se for implementação → **[delivery/hack-flow.md](delivery/hack-flow.md)**
6. Durante Hack, aplique **[delivery/practices/tdd-prodops.md](delivery/practices/tdd-prodops.md)**
7. Durante Hack, Sync e Finish, aplique **[commit-workflow/README.md](commit-workflow/README.md)**
8. No Finish, feche a task e gere PR com narrativa e evidências
9. Se for pipeline/deploy → **[delivery/ship-validate-promote-flow.md](delivery/ship-validate-promote-flow.md)**

---

## Estrutura

| Diretório | Conteúdo |
|---|---|
| `framework/` | Princípios, glossário |
| `delivery/` | CI Sync (Bootstrap, Hack, Sync, Finish) e CI Async (Ship, Validate, Promote) |
| `commit-workflow/` | Hooks Git nativos, scripts, templates e documentação do Commit Workflow |
| `engineering/` | Definition of Done, testing policy, observability policy, reliability policy |
| `templates/` | Pull Request, Decision Trail, task-closing, reliability-checklist, test-plan |
| `upstream/` | Experimentos, features exploratórias, OBCs em avaliação, trilha |
| `downstream/` | Quality Gates, Release Trail, Iteration Backlog, Done Criteria |
| `assessment/` | Reliability Plan, OBCs, riscos, iteration plan, Event Storming, arquitetura |
| `current-state/` | Product Deck, Service Decks, BDD Features comprometidas, Tracking List |
| `operation/` | Runbooks, incidentes, postmortems, trilha operacional |

---

## Visão do ProdOps Delivery

```
CI Sync   → Bootstrap → Hack → Sync → Finish    (trabalho local, síncrono)
CI Async  → Ship → Validate → Promote            (plataforma, pipelines, ambientes)
```

Capabilities transversais:
- **ProdOps TDD** — usada pelo Hack
- **Commit Workflow** — usada por Hack, Sync e Finish

---

Para regras operacionais de agentes: ver `AGENTS.md` na raiz do repositório.
