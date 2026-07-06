# Bootstrap

Bootstrap é o primeiro estágio do **CI Sync**. Prepara o ambiente de desenvolvimento, cria a branch e estabelece o contexto de produto antes de iniciar a implementação.

---

## Objetivo

Garantir que o ambiente está pronto, a branch está criada, e os artefatos ProdOps relevantes foram lidos antes de escrever qualquer código ou teste.

O Bootstrap não produz código. Produz **contexto**.

---

## Pré-condição

**Downstream:**
- Item presente no Iteration Backlog (`prodops/downstream/iteration-backlog.md`)
- OBC criado em `prodops/assessment/reliability-plan/obcs/`
- BDD Feature presente em `prodops/current-state/features/`

**Upstream:**
- Experimento criado em `prodops/upstream/experiments/`
- Hipótese ou objetivo definido

---

## Sequência

### 1. Preparar o ambiente

```bash
# Se necessário (primeira execução ou mudança de infra):
./scripts/setup-dev.sh

# Verificar status do Git antes de criar a branch
git status --short
git fetch origin
git log --oneline -3
```

### 2. Criar a branch

```bash
git switch -c <type>/<short-slug>
# Tipos: feat, fix, chore, refactor, docs
```

Não começar a trabalhar em `main`. Toda implementação ocorre em branch dedicada.

### 3. Ler os artefatos ProdOps

Antes de qualquer teste ou código, ler:

| Artefato | Localização |
|---|---|
| OBC da capability | `prodops/assessment/reliability-plan/obcs/<capability>.md` |
| BDD Feature | `prodops/current-state/features/<capability>.feature` |
| Riscos e mitigações | `prodops/assessment/reliability-plan/risks.md` |
| Iteration Plan | `prodops/assessment/iteration-plan.md` |

Para Upstream: ler `prodops/upstream/experiments/<id>-<slug>/experiment.md`.

### 4. Verificar testes existentes

```bash
ls api/test/
```

Identificar se já existem testes para o comportamento sendo adicionado. Testes existentes são o ponto de partida do Hack, não obstáculos.

### 5. Confirmar que o contrato existe

Antes de ir para Hack, o contrato verificável deve existir: OBC, BDD Feature, OpenAPI spec, AsyncAPI spec, ou schema.

Se não existir → criar o contrato antes de prosseguir para Hack.

---

## Checklist Bootstrap

- [ ] Ambiente de dev pronto (LocalStack rodando, `.env` configurado).
- [ ] Branch criada a partir de `main` atualizado.
- [ ] OBC lido — critérios de aceite compreendidos.
- [ ] BDD Feature lida — cenários compreendidos.
- [ ] Testes existentes identificados.
- [ ] Contrato verificável confirmado ou criado.

---

## Próximo estágio

→ [Hack Flow](hack-flow.md)
