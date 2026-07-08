# Modo Downstream

Downstream é o modo de entrega governada do Framework ProdOps.

## Propósito

Entregar software com rastreabilidade, critérios de aceite verificáveis e evidência registrada em cada etapa.

## Características do modo

- Compromisso formal com critérios de aceite (OBC + BDD Feature)
- Governança e rastreabilidade completas
- Artefatos obrigatórios antes do início
- Evidências registradas em cada etapa
- Sequência completa obrigatória

## Quando usar o modo Downstream

- Item aprovado no Iteration Plan
- Implementar OBC + BDD Feature existente
- Entregar feature com compromisso formal
- Executar item do Reliability Plan

## Pré-condições obrigatórias

Antes de iniciar qualquer trabalho Downstream:

1. OBC em `prodops/artifacts/obcs/`
2. BDD Feature em `prodops/artifacts/bdd/`
3. Entrada no Iteration Plan com status `Entrou` em `prodops/artifacts/plans/iteration-plan.md`
4. Riscos documentados em `prodops/journeys/assessment/risks.md`
5. Entrada no Reliability Plan em `prodops/journeys/assessment/reliability-plans/`

Não iniciar o Downstream sem esses artefatos.

## Sequência obrigatória

```
Bootstrap → Hack → Sync → Finish → Ship → Validate → Promote
```

O trabalho é dividido em dois ciclos:

```
CI Sync: Bootstrap → Hack → Sync → Finish     (trabalho local, síncrono)
CI Async: Ship → Validate → Promote            (plataforma, pipelines, ambientes)
```

## Fases

| Fase | Descrição | Link |
|---|---|---|
| Bootstrap | Branch + ambiente + contexto ProdOps | [../journeys/delivery/phases/bootstrap/README.md](../journeys/delivery/phases/bootstrap/README.md) |
| Hack | Implementação via ProdOps TDD | [../journeys/delivery/phases/hack/README.md](../journeys/delivery/phases/hack/README.md) |
| Sync | Consistência de artefatos | [../journeys/delivery/phases/sync/README.md](../journeys/delivery/phases/sync/README.md) |
| Finish | Quality Gates + PR | [../journeys/delivery/phases/finish/README.md](../journeys/delivery/phases/finish/README.md) |
| Ship | Preparation + Deployment | [../journeys/delivery/phases/ship/README.md](../journeys/delivery/phases/ship/README.md) |
| Validate | Runtime + observabilidade + SLO | [../journeys/delivery/phases/validate/README.md](../journeys/delivery/phases/validate/README.md) |
| Promote | Aprovação formal + Release Trail | [../journeys/delivery/phases/promote/README.md](../journeys/delivery/phases/promote/README.md) |

## Evidências

Registrar evidências significativas de entrega em `prodops/artifacts/trails/release-trail.md`.

## O Downstream deve preservar

Rastreabilidade desde o estado atual e o assessment até a implementação, validação e promoção.
