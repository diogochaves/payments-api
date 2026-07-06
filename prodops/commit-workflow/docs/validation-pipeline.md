# Validation Pipeline

A pipeline de validação do Commit Workflow é executada em três momentos:

| Momento | Hook | O que executa |
|---|---|---|
| Antes do commit | `pre-commit` | Formatter → Lint → Unit tests |
| Na mensagem | `commit-msg` | Conventional Commit format |
| Antes do push | `pre-push` | Build → Integration tests → Contracts → Quality gates |

## Princípio CI = Local

A CI/CD reutiliza exatamente os mesmos comandos que o desenvolvedor executa localmente. Não existem comandos "só para CI". Se um comando passa localmente, deve passar na CI.

## Descoberta automática de comandos

Os scripts descobrem os comandos disponíveis na seguinte ordem:

1. `Makefile` — targets: `format`, `lint`, `test`, `build`, `test:acceptance`
2. `Taskfile.yml` / `Taskfile.yaml`
3. `justfile`
4. `api/package.json` — scripts: `lint`, `test`, `build`, `test:acceptance`, `format`
5. `package.json` (raiz)
6. `Gradle` (`./gradlew`)
7. `Maven` (`./mvnw`)
8. `Go` (`go test`, `go build`)
9. `Python` (`pytest`, `ruff`)
10. `.NET` (`dotnet build`, `dotnet test`)
11. Scripts em `scripts/` (ex: `scripts/test-acceptance.sh`)

Nunca são criados comandos novos. Sempre reutilizados os existentes.

## Para este repositório (Node/NestJS)

| Etapa | Comando |
|---|---|
| Formatter | `cd api && npm run lint` (inclui `--fix`) |
| Lint | `cd api && npm run lint` |
| Unit tests | `cd api && npm run test` |
| Build | `cd api && npm run build` |
| Acceptance tests | `./scripts/test-acceptance.sh` |

## Falha na pipeline

Qualquer etapa com exit code ≠ 0 bloqueia o commit ou push. O erro é exibido com contexto suficiente para diagnóstico. Não existe modo "warn only" — a pipeline é binária: passa ou bloqueia.
