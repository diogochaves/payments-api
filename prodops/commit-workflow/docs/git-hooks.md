# Git Hooks

## Configuração

### Forma recomendada — setup completo do ambiente

```bash
./scripts/setup-dev.sh
```

Verifica pré-requisitos, instala npm deps, configura `core.hooksPath`, verifica permissões dos hooks e resume o estado do ambiente. É idempotente.

### Forma manual — apenas hooks

```bash
git config core.hooksPath prodops/commit-workflow/hooks
```

Isso instrui o Git a usar os hooks deste diretório em vez do padrão `.git/hooks/`. A configuração é salva em `.git/config` (local, não commitada).

Para verificar:

```bash
git config core.hooksPath
# prodops/commit-workflow/hooks
```

Para remover:

```bash
git config --unset core.hooksPath
```

## Hooks disponíveis

### `pre-commit`
Executa antes de cada commit. Chama `scripts/pre-commit.sh`.

Validações: formatter → lint → unit tests.

Se qualquer validação falhar, o commit é bloqueado.

### `prepare-commit-msg`
Executa antes do editor de commit abrir. Chama `scripts/prepare-commit-msg.sh`.

Adiciona o template `templates/commit-template.txt` apenas quando não há mensagem existente (não aplica em commits com `-m`, merges, ou squashes).

### `commit-msg`
Executa após o desenvolvedor digitar a mensagem. Chama `scripts/commit-msg.sh`.

Valida que a mensagem segue o formato Conventional Commits. Ver [conventional-commits.md](conventional-commits.md).

### `pre-push`
Executa antes de cada push. Chama `scripts/pre-push.sh`.

Validações: build → integration tests → contract validation → quality gates.

Pre-push é mais pesado que pre-commit. É aceitável que leve alguns minutos.

## Princípio de separação

Os hooks (`hooks/`) contêm apenas uma linha de delegação. Toda a lógica fica nos scripts (`scripts/`). Isso permite:
- Testar os scripts independentemente dos hooks.
- Atualizar a lógica sem modificar arquivos de hook.
- Reutilizar os scripts na CI.

## Bypassing (emergência)

```bash
git commit --no-verify -m "chore: emergency fix"
git push --no-verify
```

`--no-verify` bypassa os hooks. Use apenas em emergências reais. Documente a justificativa no commit body ou no Decision Trail.

## Permissões

Os hooks e scripts devem ter permissão de execução:

```bash
chmod +x prodops/commit-workflow/hooks/*
chmod +x prodops/commit-workflow/scripts/*.sh
```

O repositório armazena permissões via `git update-index --chmod=+x`. Verifique com:

```bash
git ls-files --stage prodops/commit-workflow/hooks/
```
