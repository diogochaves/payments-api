# Capability — Commit Workflow

## Objetivo

Garantir que cada commit passa por validações automáticas de formato, lint, testes unitários e convenção de mensagem antes de ser registrado no histórico.

## Responsabilidades

- Executar formatter (Prettier) antes de cada commit
- Executar lint (ESLint) antes de cada commit
- Executar testes unitários antes de cada commit
- Validar mensagem de commit no padrão Conventional Commits
- Prevenir push com falhas via hook pre-push

## Flows consumidores

| Flow | Momento de uso |
|---|---|
| Hack | Após cada ciclo Red→Green→Refactor |
| Sync | Após rebase/atualização de branch |
| Finish | Validação final antes do PR |

## Artefatos produzidos

- Commit com mensagem validada
- Histórico limpo com Conventional Commits
- Build local verificado (lint + testes)

## Dependências

- Hooks Git nativos configurados via `git config core.hooksPath prodops/commit-workflow/hooks`
- Node.js / npm disponível em `api/`

## Documentação canônica

→ [prodops/commit-workflow/README.md](../../commit-workflow/README.md)
