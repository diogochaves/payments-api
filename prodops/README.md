# ProdOps Framework

Este diretório é a fonte canônica do Framework ProdOps neste repositório.

## Ordem oficial de leitura

Para qualquer tarefa, leia nesta ordem:

```
README.md
  ↓ prodops/README.md (aqui)
    ↓ framework/principles.md
      ↓ framework/glossary.md
        ↓ delivery/README.md
          ↓ CI Sync ou CI Async
            ↓ Flow específico
              ↓ Practice
                ↓ Capabilities
                  ↓ Artefatos da capability
```

## Portal

| Área | Conteúdo | Link |
|---|---|---|
| **Framework** | Princípios, glossário, modelo operacional | [framework/](framework/) |
| **Product** | Product Deck, Service Decks, BDD Features, Tracking List | [product/](product/) |
| **Upstream** | Experimentos, learnings, features exploratórias, OBCs draft | [upstream/](upstream/) |
| **Assessment** | Reliability Plans, OBCs, riscos, oportunidades, Iteration Plans | [assessment/](assessment/) |
| **Delivery** | CI Sync, CI Async, flows, practices, capabilities | [delivery/](delivery/) |
| **Operation** | Runbooks, incidentes, postmortems, trilha operacional | [operation/](operation/) |
| **Templates** | Templates de engenharia, assessment, delivery e operação | [templates/](templates/) |

## Modelo operacional

```
Journey → Flow → Practice → Capability

Upstream → exploração, hipóteses, experimentos
Downstream → entrega governada, OBC + BDD + Reliability Plan

CI Sync: Bootstrap → Hack → Sync → Finish     (trabalho local, síncrono)
CI Async: Ship → Validate → Promote            (plataforma, pipelines, ambientes)
```

## Delivery em detalhe

```
ProdOps Delivery
├── CI Sync
│   ├── Bootstrap  → prepara branch, ambiente e contexto
│   ├── Hack       → implementa via ProdOps TDD + Commit Workflow
│   ├── Sync       → verifica consistência de artefatos
│   └── Finish     → Quality Gates + PR
│
└── CI Async
    ├── Ship       → Preparation (Build/Package/Version/Sign/SBOM/Publish) + Deployment
    ├── Validate   → verifica entrega em runtime
    └── Promote    → promoção formal com evidência
```

Para regras operacionais de agentes: ver `AGENTS.md` na raiz do repositório.
