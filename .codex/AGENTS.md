# Payments API — ProdOps Agent Instructions

Este repositório usa ProdOps como camada de contexto operacional.

Antes de qualquer implementação, o agente deve ler:

1. `prodops/current-state/product-deck.md`
2. `prodops/current-state/tracking-list.md`
3. `prodops/current-state/icebox-backlog.md`
4. `prodops/current-state/*.md`
5. `prodops/current-state/features/*.feature`
6. `prodops/assessment/premortem-prodops-payments-checkout.md`
7. `prodops/assessment/event-storming/plan.json`
8. todos os arquivos em `prodops/assessment/reliability-plan/`

O diretório `prodops/assessment/reliability-plan/` representa o contrato de execução da release.

O agente deve implementar somente o que estiver alinhado ao Reliability Plan, aos BDD Features e ao contexto atual do produto.

## Fluxo obrigatório

1. Ler contexto atual.
2. Ler Reliability Plan.
3. Identificar OBCs, riscos, oportunidades, capabilities e demandas associadas.
4. Selecionar a skill adequada:
   - `hack`: implementação TDD.
   - `synk`: revisão, consistência, merge e atualização de artefatos.
   - `ship`: preparação de entrega.
   - `payments-api-local-testing`: validação local.
5. Implementar seguindo TDD sempre que possível.
6. Atualizar artefatos ProdOps impactados.
7. Registrar execução no Release Trail.

## Artefatos que devem ser atualizados

Após qualquer mudança relevante, atualizar quando aplicável:

- `prodops/current-state/tracking-list.md`
- `prodops/current-state/features/*.feature`
- `prodops/assessment/reliability-plan/*.md`
- `prodops/assessment/event-storming/plan.json`


## Release Trail

After every meaningful task, append a short entry to:

```
prodops/diligence/release-trail.md
```

Use the following format:

```markdown

## YYYY-MM-DD HH:MM

### Summary

One or two sentences describing what was implemented.

### Related

- Reliability Plan:

- OBC:

- BDD Feature:

### Code

- Main files modified

### Tests

- Tests created or updated

- Validation executed

### Artifacts Updated

- Product Deck

- Service Deck

- Tracking List

- Reliability Plan

- OBC

### Notes

Open issues, assumptions or follow-up work.

```

Keep entries concise.

Do not rewrite previous entries.

Always append new information.