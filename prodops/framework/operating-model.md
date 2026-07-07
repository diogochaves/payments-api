# ProdOps Operating Model

## Modelo operacional

O ProdOps organiza o trabalho de produto e engenharia em camadas hierárquicas:

```
Business
  ↓
Business Intent
  ↓
Continuous Assessment
  ↓
Execution Mode
├── Upstream
└── Downstream
  ↓
Journey
├── Discovery
├── Delivery
├── Operation
├── Assessment
└── Diligence
  ↓
Phase
├── Bootstrap
├── Hack
├── Sync
├── Finish
├── Ship
├── Validate
└── Promote
  ↓
Practice
└── ProdOps TDD
  ↓
Capability
├── Commit Workflow
├── Contract Management
├── Evidence Management
├── Observability
└── Reliability
  ↓
Artifacts
├── OBCs
├── BDD Features
├── Plans
├── Trails
└── Evidence
```

**Business Intent** — ponto de entrada do Framework. Uma intenção de gerar valor ainda não comprometida.

**Continuous Assessment** — avalia continuamente riscos, oportunidades e decide o próximo passo.

**Execution Mode** — o nível de compromisso e critérios de qualidade aplicados:
- **Upstream** — exploração, baixo compromisso, foco em aprendizado
- **Downstream** — entrega governada, critérios obrigatórios, rastreabilidade completa

**Journey** — o caminho de trabalho dentro de um modo de execução:
- Discovery, Delivery, Operation — jornadas clássicas
- Assessment, Diligence — jornadas transversais

**Phase** — a sequência de estágios dentro da jornada Delivery:
- CI Sync: Bootstrap → Hack → Sync → Finish
- CI Async: Ship → Validate → Promote

**Practice** — o método utilizado durante uma fase:
- ProdOps TDD (usado pelo Hack)

**Capability** — competências reutilizáveis consumidas pelas fases:
- Commit Workflow
- Contract Management
- Evidence Management
- Observability
- Reliability

**Artifacts** — artefatos produzidos e consumidos pelo Framework:
- OBCs, BDD Features, Plans, Trails, Evidence

## Journeys

### Discovery (ex-Upstream)

Exploração. Transforma hipóteses em conhecimento validado. Sem compromisso de entrega — apenas compromisso de aprendizado.

→ [prodops/journeys/discovery/README.md](../journeys/discovery/README.md)

### Delivery

Implementação governada. Usa o conhecimento validado pelo Discovery para entregar com confiança.

→ [prodops/journeys/delivery/README.md](../journeys/delivery/README.md)

### Operation

Operação contínua. Runbooks, incidentes, postmortems, trilha operacional.

→ [prodops/journeys/operation/](../journeys/operation/)

### Assessment

Jornada transversal. Avalia riscos, oportunidades, OBCs e Iteration Plans.

→ [prodops/journeys/assessment/README.md](../journeys/assessment/README.md)

### Diligence

Jornada transversal. Observa a execução e garante consistência do Framework.

→ [prodops/journeys/diligence/README.md](../journeys/diligence/README.md)

## Execution Modes

→ [prodops/execution-model/README.md](../execution-model/README.md)

## Ciclo de vida de uma capability

```
Business Intent
  ↓ Continuous Assessment
Upstream (Discovery)
  Experimento → learning → Decision Package
  ↓ Assessment Review
Revisão do Decision Package (PM + Tech Lead)
  ↓ se aprovado
Promoção: BDD Feature → artifacts/bdd/, OBC → artifacts/obcs/
  ↓ Downstream (Delivery)
Bootstrap → Hack → Sync → Finish → Ship → Validate → Promote
```

## Princípios

→ [principles.md](principles.md)

## Glossário

→ [glossary.md](glossary.md)
