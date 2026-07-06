# Finish Checklist

O Finish é a fase que garante que a implementação está pronta para ser publicada como Pull Request.

## Validações obrigatórias

Execute na ordem abaixo. Cada etapa deve passar antes de prosseguir.

### 1. Histórico de commits

```bash
git log --oneline origin/HEAD..HEAD
```

- [ ] Todos os commits seguem Conventional Commits.
- [ ] Não há commits "WIP", "temp", "fixup" não resolvidos.
- [ ] O histórico conta a história da mudança de forma coerente.

### 2. Formatter + Lint

```bash
cd api && npm run lint
```

- [ ] Lint passa sem erros (exit 0).
- [ ] Nenhum arquivo staged com violations não resolvidas.

### 3. Build

```bash
cd api && npm run build
```

- [ ] Build compila sem erros.
- [ ] Nenhum erro TypeScript novo introduzido.

### 4. Testes

```bash
# Unit
cd api && npm run test

# Acceptance (requer LocalStack)
./scripts/test-acceptance.sh
```

- [ ] Todos os testes unitários passam.
- [ ] Todos os testes de aceitação passam.
- [ ] Nenhum teste novo usa mocks de regra de negócio.

### 5. Contratos

- [ ] BDD Feature atualizado se o comportamento mudou.
- [ ] OpenAPI spec atualizado se rota foi adicionada/alterada.
- [ ] AsyncAPI atualizado se evento foi adicionado/alterado.

### 6. Artefatos ProdOps

- [ ] Architecture diagram atualizado (se estrutural).
- [ ] Event Storming atualizado (se eventos novos).
- [ ] Release Trail com evidência desta implementação.

### 7. Definition of Done

- [ ] [prodops/engineering/definition-of-done.md](../../engineering/definition-of-done.md) — todos os itens satisfeitos.

## Geração do Pull Request

Após todos os itens acima marcados:

```bash
# 1. Revise o template
cat prodops/commit-workflow/templates/pull_request.md

# 2. Crie o PR usando gh CLI
gh pr create \
  --title "<type>(<scope>): <summary>" \
  --body-file prodops/commit-workflow/templates/pull_request.md \
  --base main
```

Preencha o template com as evidências coletadas durante o Finish. Não deixe seções vazias sem justificativa.
