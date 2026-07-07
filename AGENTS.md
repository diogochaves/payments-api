# Payments API Agent Operating Guide

ProdOps is the single source of product context for this repository. Agents must use the ProdOps artifacts as the decision base and must not invent missing business context.

---

## Ordem de leitura

Para qualquer tarefa, leia nesta ordem:

1. `prodops/README.md` — portal do framework (mapa de navegação)
2. `prodops/framework/principles.md` — princípios obrigatórios
3. `prodops/framework/glossary.md` — termos canônicos
4. `prodops/delivery/README.md` — CI Sync e CI Async
5. Identifique o path: **Upstream** (exploração) ou **Downstream** (entrega comprometida)
6. Se CI Sync → leia o flow correspondente em `prodops/delivery/flows/`
7. Se Hack → aplique `prodops/delivery/practices/prodops-tdd.md`
8. Em todo commit → aplique `prodops/commit-workflow/README.md`
9. Se CI Async → leia `prodops/delivery/flows/ship-validate-promote.md`

---

## Source of Truth

| Assunto | Localização |
|---|---|
| Contexto de produto | `prodops/product/` |
| BDD Features (committed) | `prodops/product/features/` |
| OBCs | `prodops/assessment/obcs/` |
| Riscos | `prodops/assessment/risks.md` |
| Iteration Plan | `prodops/assessment/iteration-plans/iteration-plan.md` |
| Reliability Plans | `prodops/assessment/reliability-plans/` |
| Upstream | `prodops/upstream/` |
| Downstream | `prodops/downstream/` |
| Operação | `prodops/operation/` |

---

## Upstream Path

Use Upstream para: explorar, experimentar, prototipar, validar hipóteses, preparar BDD/OBC antes do compromisso.

- Sem compromisso de entrega — apenas compromisso de aprendizado
- Registrar no trail do experimento ativo: `prodops/upstream/experiments/<id>-<slug>/upstream-trail.md`
- Novos experimentos: diretório `prodops/upstream/experiments/<id>-<slug>/` com `experiment.md`, `upstream-trail.md`, `evidence/`

→ [prodops/upstream/README.md](prodops/upstream/README.md)

---

## Downstream Path

Use Downstream para implementar itens aprovados do Iteration Backlog.

Pré-condições obrigatórias:
- OBC em `prodops/assessment/obcs/`
- BDD Feature em `prodops/product/features/`
- Entrada no Iteration Plan com status `Entrou`
- Riscos documentados em `prodops/assessment/risks.md`

Sequência obrigatória:

```
Bootstrap → Hack → Sync → Finish → Ship → Validate → Promote
```

Antes de alterar código de produção, leia:
1. `prodops/product/` — Product Deck, Service Decks, BDD Features
2. `prodops/assessment/` — Reliability Plans, OBCs, riscos
3. O OBC e a BDD Feature da capability sendo implementada

→ [prodops/downstream/README.md](prodops/downstream/README.md)

---

## Como executar o Hack

1. Bootstrap entregou: branch limpa + ambiente + artefatos lidos + contrato verificado
2. Escrever o teste de integração (Red Bar) — a partir do contrato (BDD Feature / OBC)
3. Implementar o mínimo para passar (Green Bar)
4. Refatorar mantendo testes verdes
5. Commit: `git commit -m "<type>(<scope>): <summary>"`
6. Validar observabilidade (logs, correlationId, sem PII/secrets em logs)
7. Verificar confiabilidade (timeout, idempotência, exceções, HTTP codes)
8. Registrar evidência no trail

→ [prodops/delivery/flows/hack.md](prodops/delivery/flows/hack.md)

### Checklist de fechamento do Hack

- [ ] Contrato identificado ou criado
- [ ] Red Bar confirmado
- [ ] Lint passa (`npm run lint` exit 0 em `api/`)
- [ ] Formatter executado
- [ ] `./scripts/test-acceptance.sh` — quando comportamento de pagamento ou contratos mudaram
- [ ] Observabilidade validada (logs, correlationId, sem PII)
- [ ] Confiabilidade verificada (timeout, idempotência, exceções, HTTP codes)
- [ ] Commits seguem Conventional Commits
- [ ] Evidências registradas no trail

---

## ProdOps TDD

Princípios: Contract First · Integration First · Observability First · Progressive Substitution · Non Intrusive Testing

→ [prodops/delivery/practices/prodops-tdd.md](prodops/delivery/practices/prodops-tdd.md)

---

## Commit Workflow

Hooks Git nativos. Executa automaticamente no commit se configurado:

```bash
git config core.hooksPath prodops/commit-workflow/hooks
```

Conventional Commits obrigatório: `<type>(<scope>): <summary>`

→ [prodops/commit-workflow/README.md](prodops/commit-workflow/README.md)

---

## Event Storming

Mapa canônico: `prodops/assessment/event-storming/plan.json`

**Atualizar quando:** novo `eventEmitter.emit()` ou `@OnEvent()`, mudança de payload com impacto de negócio, novo flow identificado.

**Não atualizar para:** refactor sem mudança de contrato, bugfixes que preservam semântica de evento.

---

## Arquitetura

Diagrama canônico: `prodops/assessment/architecture/overview.md`

**Atualizar quando:** novo módulo NestJS, nova rota, nova dependência externa, novo DynamoDB table, novo event topic.

---

## Downstream Release Trail

Após cada tarefa Downstream relevante, append em:

```
prodops/downstream/release-trail.md
```

---

## Context Rules

- Nunca inventar contexto, OBCs, SLOs, riscos ou critérios de aceite ausentes
- Se decisão de negócio está faltando: registrar o gap e pedir clarificação
- Preservar arquitetura existente a menos que o artefato ProdOps peça mudança
- Conflito entre nova diretriz e regra existente: preservar a existente e registrar em Decision Trail

→ [prodops/templates/assessment/decision-trail.md](prodops/templates/assessment/decision-trail.md)

---

## Execution Skills

- `skills/hack/` — implementação com TDD
- `skills/sync/` — revisão e sync de artefatos
- `skills/ship/` — deploy preparation
- `skills/validate/` — validação com evidências
