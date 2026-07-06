# Documentation Review

Data: 2026-07-06

---

## Arquivos avaliados

| Arquivo | Linhas | Papel |
|---|---|---|
| `AGENTS.md` | 323 → ~270 | Regras operacionais para agentes |
| `CLAUDE.md` | 68 → ~22 | Instruções específicas para Claude Code |
| `README.md` | 688 | Visão humana do projeto e mapa de navegação |
| `.github/copilot-instructions.md` | 52 → ~35 | Instruções específicas para GitHub Copilot |
| `prodops/README.md` | novo | Índice canônico do Framework ProdOps |
| `prodops/framework/principles.md` | 28 | Sete princípios do framework |
| `prodops/framework/glossary.md` | 44 | Termos oficiais |
| `prodops/delivery/README.md` | 108 | Visão geral CI Sync / CI Async |
| `prodops/delivery/hack-flow.md` | ~155 | Sequência canônica do Hack com 3 fases |
| `prodops/delivery/practices/tdd-prodops.md` | ~165 | ProdOps TDD completo |
| `prodops/commit-workflow/README.md` | ~100 | Commit Workflow completo |

---

## Duplicações encontradas

| Conceito duplicado | Arquivos envolvidos |
|---|---|
| Estrutura CI Sync / CI Async (`Bootstrap → ... → Promote`) | AGENTS.md, CLAUDE.md, copilot-instructions.md, prodops/delivery/README.md |
| 3 fases do Hack Flow (Antes / Durante / Após) | AGENTS.md, CLAUDE.md, copilot-instructions.md |
| Regras de mock (`jest.fn()`, `ASAAS_MOCK`) | AGENTS.md, CLAUDE.md, copilot-instructions.md, prodops/framework/principles.md |
| "Never invent missing context" | AGENTS.md, CLAUDE.md, copilot-instructions.md, prodops/framework/principles.md |
| Ship = Preparation + Deployment | AGENTS.md (implícito), CLAUDE.md, prodops/framework/glossary.md |
| Upstream vs Downstream descrição | AGENTS.md, prodops/delivery/README.md, prodops/framework/glossary.md |

---

## Conflitos encontrados

| Conflito | Resolução aplicada |
|---|---|
| `./scripts/test-acceptance.sh`: AGENTS.md (linha 305) tratava como incondicional; CLAUDE.md como condicional | Padronizado como condicional: "quando comportamento de pagamento ou contratos mudaram" |
| Upstream flow sem Bootstrap: AGENTS.md linha 61 listava `Hack -> Sync -> ...` sem Bootstrap | Corrigido para `Bootstrap -> Hack -> Sync -> ...` |
| `prodops/operation/` ausente da Source of Truth: já estava presente (linha 18 do AGENTS.md original) | Sem ação necessária — era problema do audit anterior |

---

## Conteúdos movidos

| Conteúdo | De | Para |
|---|---|---|
| 3 fases completas do Hack Flow (Fase 1, 2, 3 inline) | AGENTS.md, CLAUDE.md, copilot-instructions.md | Removido — fonte canônica é `prodops/delivery/hack-flow.md` |
| "Como ler o ProdOps" (ordem de leitura) | Não existia em lugar nenhum | Criado em `AGENTS.md` (topo) e `prodops/README.md` |

---

## Conteúdos consolidados

| Conteúdo | Fonte canônica |
|---|---|
| 3 fases do Hack Flow | `prodops/delivery/hack-flow.md` |
| ProdOps TDD (princípios, padrões, regras) | `prodops/delivery/practices/tdd-prodops.md` |
| Commit Workflow (hooks, scripts, validação) | `prodops/commit-workflow/README.md` |
| CI Sync / CI Async (visão geral, capabilities) | `prodops/delivery/README.md` |
| Bootstrap | `prodops/delivery/bootstrap-flow.md` |
| Ship capabilities (Preparation + Deployment) | `prodops/delivery/ship-validate-promote-flow.md` |
| Definições de termos | `prodops/framework/glossary.md` |
| Princípios do framework | `prodops/framework/principles.md` |
| Definition of Done | `prodops/engineering/definition-of-done.md` |
| Testing Policy / No Mocks Rule | `prodops/engineering/testing-policy.md` + `skills/hack/references/workflow.md` |

---

## Nova ordem de leitura

Para qualquer tarefa, ler nesta ordem:

1. `prodops/README.md` — índice e mapa do framework
2. `prodops/framework/principles.md` — princípios
3. `prodops/delivery/README.md` — visão geral CI Sync / CI Async
4. Identificar: CI Sync (implementação) ou CI Async (pipeline/deploy)
5. Implementação → `prodops/delivery/hack-flow.md`
6. TDD durante Hack → `prodops/delivery/practices/tdd-prodops.md`
7. Commits e validação → `prodops/commit-workflow/README.md`
8. Pipeline/deploy → `prodops/delivery/ship-validate-promote-flow.md`

---

## Referências obsoletas corrigidas

| Arquivo | Linha | Era | Ficou |
|---|---|---|---|
| `README.md` | 58 | "ainda não há runbooks operacionais dedicados" | Aponta para `prodops/operation/runbooks.md` |
| `README.md` | 60 | "Não há Decision Trail separado" | Aponta para `prodops/templates/decision-trail.md` |
| `README.md` | 104 | `[.codex](.codex)` (diretório deletado) | `[skills/](skills/)` |
| `AGENTS.md` | Upstream flow | `Hack -> Sync -> ...` (sem Bootstrap) | `Bootstrap -> Hack -> Sync -> ...` |

---

## Pendências

| Item | Tipo | Observação |
|---|---|---|
| `prodops/upstream/spikes.md`, `learnings.md`, `prototypes.md` | Estrutura legada | Arquivos existem mas nenhum guia operacional os menciona. Relação com `prodops/upstream/experiments/` é ambígua. Avaliar consolidação em sessão futura. |
| `prodops/assessment/reliability-plan/setup/` | Artefatos de bootstrap | Prompts de geração (`iteration-plan.prompt.md`, `reliability-plan.prompt.md`). Sem referência em nenhum fluxo operacional. Avaliar arquivar ou documentar uso. |
| OBC `api-token-validation.md` — item "viabilizado em iteração futura" | OBC parcial | Mistura entregue com planejado. Recomendado separar em item de backlog distinto. |
| `prodops/framework/operating-model.md` | Não criado | O modelo operacional (CI Sync/CI Async) já está documentado em `prodops/delivery/README.md`. Criar apenas se houver necessidade de separação futura. |
| README.md menção a endpoint legado `/payments` | Conteúdo stale | README.md linha 62 reconhece a referência obsoleta mas não a remove. Avaliar limpeza nas scripts de validação. |
