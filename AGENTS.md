# Payments API Agent Operating Guide

ProdOps é a fonte canônica de contexto de produto e processo deste repositório.

---

## Ordem de leitura

1. `prodops/README.md` — portal e mapa de navegação
2. `prodops/framework/principles.md` — princípios obrigatórios
3. `prodops/framework/glossary.md` — termos canônicos
4. `prodops/framework/canonical-paths.md` — localizações canônicas
5. `prodops/execution-model/README.md` — identificar o modo (Upstream ou Downstream)
6. `prodops/journeys/README.md` — identificar a jornada
7. A jornada identificada em `prodops/journeys/<journey>/`
8. A fase em `prodops/journeys/delivery/phases/<phase>/README.md` (se for Delivery)
9. A practice ou capability relevante

---

## Source of Truth

| Assunto | Localização |
|---|---|
| Contexto de produto | `prodops/artifacts/product/` |
| BDD Features (committed) | `prodops/artifacts/bdd/` |
| OBCs | `prodops/artifacts/obcs/` |
| Riscos | `prodops/journeys/assessment/risks.md` |
| Iteration Plan | `prodops/artifacts/plans/iteration-plan.md` |
| Reliability Plans | `prodops/journeys/assessment/reliability-plans/` |
| Upstream (Discovery) | `prodops/journeys/discovery/` |
| Downstream | `prodops/execution-model/downstream.md` |
| Release Trail | `prodops/artifacts/trails/release-trail.md` |
| Operação | `prodops/journeys/operation/` |

---

## Upstream Path

Use Upstream para: explorar, experimentar, prototipar, validar hipóteses.

- Registrar no trail do experimento: `prodops/journeys/discovery/experiments/<id>/upstream-trail.md`
- Novos experimentos: `prodops/journeys/discovery/experiments/<id>/` com `experiment.md`, `upstream-trail.md`, `evidence/`

→ [prodops/journeys/discovery/README.md](prodops/journeys/discovery/README.md)
→ [prodops/execution-model/upstream.md](prodops/execution-model/upstream.md)

---

## Downstream Path

Use Downstream para implementar itens aprovados do Iteration Plan.

Pré-condições obrigatórias:
- OBC em `prodops/artifacts/obcs/`
- BDD Feature em `prodops/artifacts/bdd/`
- Entrada no Iteration Plan com status `Entrou`
- Riscos documentados em `prodops/journeys/assessment/risks.md`

Sequência obrigatória:

```
Bootstrap → Hack → Sync → Finish → Ship → Validate → Promote
```

Antes de alterar código de produção, leia:
1. `prodops/artifacts/product/` — Product Deck, Service Decks, BDD Features
2. `prodops/journeys/assessment/` — Reliability Plans, riscos
3. O OBC e a BDD Feature da capability sendo implementada

→ [prodops/execution-model/downstream.md](prodops/execution-model/downstream.md)

---

## Como executar o Hack

Fase: `prodops/journeys/delivery/phases/hack/README.md`

1. Bootstrap entregou: branch + ambiente + artefatos lidos + contrato verificado
2. Escrever o teste de integração (Red Bar) a partir do contrato
3. Implementar o mínimo para passar (Green Bar)
4. Refatorar mantendo testes verdes
5. Commit: `git commit -m "<type>(<scope>): <summary>"`
6. Validar observabilidade (logs, correlationId, sem PII)
7. Verificar confiabilidade (timeout, idempotência, exceções, HTTP codes)
8. Registrar evidência

### Checklist

- [ ] Contrato identificado ou criado
- [ ] Red Bar confirmado
- [ ] Lint passa (`npm run lint` exit 0 em `api/`)
- [ ] Formatter executado
- [ ] `./scripts/test-acceptance.sh` — quando comportamento ou contratos mudaram
- [ ] Observabilidade validada
- [ ] Confiabilidade verificada
- [ ] Commits seguem Conventional Commits
- [ ] Evidências registradas

---

## ProdOps TDD

→ [prodops/journeys/delivery/practices/prodops-tdd.md](prodops/journeys/delivery/practices/prodops-tdd.md)

---

## Commit Workflow

```bash
git config core.hooksPath prodops/journeys/delivery/capabilities/commit-workflow/hooks
```

→ [prodops/journeys/delivery/capabilities/commit-workflow/README.md](prodops/journeys/delivery/capabilities/commit-workflow/README.md)

---

## Event Storming

Mapa canônico: `prodops/journeys/assessment/event-storming/plan.json`

---

## Arquitetura

Diagrama canônico: `prodops/journeys/assessment/architecture/overview.md`

---

## Release Trail

Após cada tarefa Downstream relevante, append em:
`prodops/artifacts/trails/release-trail.md`

---

## Context Rules

- Nunca inventar contexto, OBCs, SLOs, riscos ou critérios de aceite ausentes
- Conflito entre nova diretriz e regra existente: preservar a existente e registrar em Decision Trail
→ [prodops/templates/assessment/decision-trail.md](prodops/templates/assessment/decision-trail.md)

---

## Skills

→ [prodops/skills/](prodops/skills/)
