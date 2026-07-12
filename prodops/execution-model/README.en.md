# Execution Model

Upstream and Downstream are **execution modes** of the ProdOps Framework — they are not journeys.

Each mode uses the same journeys (Discovery, Delivery, Operation, Assessment, Diligence). The difference lies in the level of commitment and the quality criteria applied.

## Upstream

Exploration and learning mode.

**Characteristics:**
- Low commitment
- Freedom to select capabilities and practices as needed
- Code is disposable until promoted to Downstream
- Rapid artifact evolution
- Focus on learning, not delivery

Upstream transforms hypotheses into validated knowledge.

→ [Upstream mode details](upstream.md)

## Downstream

Governed delivery mode.

**Characteristics:**
- Formal commitment to acceptance criteria (OBC + BDD Feature)
- Complete governance and traceability
- Mandatory artifacts before start
- Evidence recorded at each step
- Full mandatory sequence

Downstream delivers software with knowledge validated by Upstream.

→ [Downstream mode details](downstream.md)

## How to choose the mode

| Situation | Mode |
|---|---|
| Hypothesis to validate, high uncertainty | Upstream |
| Item approved in the Iteration Plan | Downstream |
| Explore a new capability | Upstream |
| Implement existing OBC + BDD Feature | Downstream |
| Prototype integration with a provider | Upstream |
| Deliver feature with commitment | Downstream |
