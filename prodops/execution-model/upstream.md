# Modo Upstream

Upstream é o modo de execução exploratório do Framework ProdOps.

## Propósito

Reduzir incerteza antes de uma capability entrar no fluxo padrão de entrega.

Diferente do Downstream, o Upstream é orientado por aprendizado, não por compromissos de entrega.

## Características do modo

- Baixo compromisso formal
- Liberdade para selecionar capabilities e práticas conforme necessidade
- Código é descartável até ser promovido para Downstream
- Evolução rápida de artefatos
- Foco em aprendizado, não em entrega

Um experimento Upstream pode produzir código de qualidade de produção, mas esse código é considerado exploratório até que a capability seja promovida para Downstream.

## Quando usar o modo Upstream

- Hipótese a validar, incerteza alta
- Explorar uma capability nova
- Prototipar integração com provedor
- Validar fluxo de negócio antes de comprometer
- Explorar abordagem técnica antes de decidir

## Como executar no modo Upstream

→ [Jornada Discovery](../journeys/discovery/README.md)

A jornada Discovery documenta o workflow completo de exploração, experimentos, revisão de Decision Package e processo de promoção para Downstream.

## Resultado esperado

Ao final de um ciclo Upstream, deve existir:

- Hipótese respondida com evidência
- Decision Package completo
- Recomendação clara (promover, requer outro experimento, aguardar, descartar)
- Artefatos ProdOps atualizados

## Promoção para Downstream

Uma capability promovida do Upstream para Downstream deve ter:

1. BDD Feature movida de `prodops/journeys/discovery/features/` para `prodops/artifacts/bdd/`
2. OBC movido de `prodops/journeys/discovery/obcs/` para `prodops/artifacts/obcs/`
3. Entrada no Iteration Plan em `prodops/artifacts/plans/iteration-plan.md`
4. Reliability Plan atualizado em `prodops/journeys/assessment/reliability-plans/`

→ [Processo completo de promoção](../journeys/discovery/README.md#processo-de-promoção-para-downstream)
