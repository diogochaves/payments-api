# Bootstrap

Bootstrap é a primeira fase do **CI Sync**. Prepara o ambiente de desenvolvimento, cria a branch e estabelece o contexto de produto antes de iniciar a implementação.

---

## Objetivo

Entregar ao Hack uma branch limpa, o ambiente pronto, os artefatos ProdOps lidos e o contrato verificado.

O Bootstrap não produz código, não escreve testes, não lê código-fonte. Produz **contexto e condições para o Hack começar diretamente no TDD**.

---

## Pré-condição

**Downstream:**
- Item presente no Iteration Plan com status `Entrou` (`prodops/artifacts/plans/iteration-plan.md`)
- OBC criado em `prodops/artifacts/obcs/`
- BDD Feature presente em `prodops/artifacts/bdd/`
- Riscos documentados em `prodops/journeys/assessment/risks.md`
- Entrada no Reliability Plan (`prodops/journeys/assessment/reliability-plans/`)

**Upstream:**
- Experimento criado em `prodops/journeys/discovery/experiments/`
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
| OBC da capability | `prodops/artifacts/obcs/<capability>.md` |
| BDD Feature | `prodops/artifacts/bdd/<capability>.feature` |
| Riscos e mitigações | `prodops/journeys/assessment/risks.md` |
| Iteration Plan | `prodops/artifacts/plans/iteration-plan.md` |

Para Upstream: ler `prodops/journeys/discovery/experiments/<NNN-slug>/experiment.md`.

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

## O que o Bootstrap entrega para o Hack

Ao terminar o Bootstrap, o Hack pode começar **sem nenhuma preparação adicional**:

| Entregável | Estado |
|---|---|
| Branch | Criada a partir de `main` atualizado |
| Ambiente | LocalStack rodando, `.env` configurado, hooks ativos |
| Artefatos ProdOps | OBC, BDD Feature, riscos — lidos e compreendidos |
| Testes existentes | Inventariados — o Hack sabe de onde parte |
| Contrato verificável | Confirmado ou criado — o Hack começa com ele em mãos |

O Hack não re-lê artefatos. O Hack não verifica ambiente. O Hack começa no Red Bar.

## Próximo estágio

→ [Hack Flow](../hack/README.md)
