# ProdOps Operating Model

## Modelo operacional

O ProdOps organiza o trabalho de produto e engenharia em camadas hierárquicas:

```
Journey
  ↓
Flow
  ↓
Practice
  ↓
Capability
```

**Journey** — o caminho de trabalho escolhido: Upstream ou Downstream.

**Flow** — a sequência de estágios dentro de uma journey:
- CI Sync: Bootstrap → Hack → Sync → Finish
- CI Async: Ship → Validate → Promote

**Practice** — o método utilizado durante um flow:
- ProdOps TDD (usado pelo Hack)

**Capability** — competências reutilizáveis consumidas pelos flows:
- Commit Workflow
- Contract Management
- Evidence Management
- Observability
- Reliability

## Journeys

### Upstream

Exploração. Transforma hipóteses em conhecimento validado. Sem compromisso de entrega — apenas compromisso de aprendizado.

→ [prodops/upstream/README.md](../upstream/README.md)

### Downstream

Entrega governada. Usa o conhecimento validado pelo Upstream para entregar com confiança.

→ [prodops/downstream/README.md](../downstream/README.md)

## Ciclo de vida de uma capability

```
Pergunta de negócio
  ↓ Upstream
Experimento → learning → Decision Package
  ↓ Assessment
Revisão do Decision Package (PM + Tech Lead)
  ↓ se aprovado
Promoção: BDD Feature → product/features/, OBC → assessment/obcs/
  ↓ Downstream
Bootstrap → Hack → Sync → Finish → Ship → Validate → Promote
```

## Princípios

→ [principles.md](principles.md)

## Glossário

→ [glossary.md](glossary.md)
