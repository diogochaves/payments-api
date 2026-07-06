# Commit Workflow

A **Commit Workflow** é a capability do Framework ProdOps responsável por padronizar o ciclo completo de commits, validações locais, geração de Pull Requests e encerramento de Tasks.

## Princípios

- **Git First** — usa apenas mecanismos nativos do Git.
- **Language Agnostic** — descobre automaticamente os comandos do projeto; nunca codifica tecnologia específica.
- **Zero dependência** — sem Husky, sem commitlint, sem ferramentas externas.
- **Reutilização máxima** — nunca duplica scripts que já existem.
- **CI = Local** — a CI reutiliza exatamente os mesmos comandos usados localmente.

## Estrutura

```
prodops/commit-workflow/
├── README.md              ← este arquivo
├── hooks/                 ← Git hooks (chamam os scripts)
│   ├── pre-commit
│   ├── prepare-commit-msg
│   ├── commit-msg
│   └── pre-push
├── scripts/               ← lógica de validação
│   ├── pre-commit.sh
│   ├── prepare-commit-msg.sh
│   ├── commit-msg.sh
│   └── pre-push.sh
├── templates/             ← templates reutilizáveis
│   ├── commit-template.txt
│   ├── pull_request.md
│   └── task-closing.md
└── docs/                  ← documentação detalhada
    ├── conventional-commits.md
    ├── validation-pipeline.md
    ├── git-hooks.md
    └── finish-checklist.md
```

## Configuração rápida

```bash
./scripts/setup-dev.sh
```

O script verifica pré-requisitos, instala dependências npm, configura os Git hooks e resume o estado do ambiente. É idempotente — pode ser rodado a qualquer momento.

Para configurar apenas os hooks manualmente:

```bash
git config core.hooksPath prodops/commit-workflow/hooks
```

Para remover os hooks:

```bash
git config --unset core.hooksPath
```

## Fluxo integrado

```
Hack → commit pequeno → pre-commit (format + lint + unit tests)
     → commit-msg (Conventional Commit validado)
     → Sync → pre-push (build + integration tests + contracts)
     → Finish → PR gerado com template
```

Documentação detalhada: [docs/git-hooks.md](docs/git-hooks.md)
