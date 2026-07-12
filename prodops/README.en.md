# ProdOps Framework

This directory is the canonical source of the ProdOps Framework in this repository.

## Official flow

```
Origin Stream → Intent → Exploration → OBC → Iteration Plan → Reliability Plan → Delivery → Operation
```

→ [Full flow explained](framework/flow.md)
→ [The four Origin Streams](framework/origin-streams.md)

## Operating model

```
Origin Stream (Business | Enterprise | Team | Technology)
  ↓
Intent
  ↓
Continuous Assessment
  ↓
Execution Mode → Journey → Phase → Practice → Delivery Capability → Artifacts
```

→ [Full operating model](framework/operating-model.md)

## Reading order

1. `framework/principles.md` — principles
2. `framework/glossary.md` — canonical terms
3. `framework/canonical-paths.md` — canonical locations
4. `framework/flow.md` — official Framework flow
5. `framework/origin-streams.md` — the four Origin Streams
6. `framework/operating-model.md` — full operating model
7. `execution-model/README.md` — Upstream vs Downstream
8. `journeys/README.md` — the 5 journeys
9. The journey specific to the task
10. The phase within the journey
11. The phase capabilities

## Portal

| Area | Description |
|---|---|
| [framework/](framework/) | Principles, glossary, flow, Origin Streams, operating model |
| [business-intents/](business-intents/) | Registered intents (Framework entry point) |
| [execution-model/](execution-model/) | Upstream and Downstream as execution modes |
| [journeys/](journeys/) | The 5 journeys: Discovery, Delivery, Operation, Assessment, Diligence |
| [artifacts/](artifacts/) | Produced artifacts: OBCs, BDD Features, plans, trails, evidence |
| [templates/](templates/) | Centralized templates by area |
| [skills/](skills/) | Executable skills for agents |
| [journeys/delivery/capabilities/commit-workflow/](journeys/delivery/capabilities/commit-workflow/) | Commit Workflow: native Git hooks, scripts, documentation |
| [documentation-review.md](documentation-review.md) | Framework documentation review and state |
