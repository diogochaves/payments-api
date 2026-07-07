# Features — Upstream

Features BDD para capabilities **ainda em exploração**, sem comprometimento de Downstream.

Cada Feature aqui representa o comportamento esperado de uma capability que está sendo
experimentada ou investigada. Ela **deve estar associada a um experimento ativo** em
`prodops/upstream/experiments/`.

## Regra de escopo

Esta pasta aceita **apenas** features nascidas de experimentos Upstream (`EXP-XXX`).

**Não crie features aqui para:**

- capabilities adicionadas diretamente ao Iteration Backlog como Downstream;
- capabilities sem experimento de origem associado.

Nesse caso, crie a BDD Feature diretamente em `prodops/product/features/`.

Features de capabilities comprometidas vivem em `prodops/product/features/`.

## Features exploratórias

| Feature | Capability | Status | Experimento de origem |
|---|---|---|---|
| [`credit-card-payment.feature`](credit-card-payment.feature) | Pagamento com cartão de crédito | In Progress | [`EXP-001`](../experiments/001-credit-card-lifecycle/experiment.md), [`EXP-003`](../experiments/003-hosted-vs-tokenized/experiment.md) |

## Regra de promoção

Uma Feature passa de Upstream para `prodops/product/features/` quando:

1. O experimento correspondente está concluído com decisão `Move Downstream`.
2. Os cenários BDD estão revisados e refletem o comportamento aprovado.
3. A Feature foi referenciada no `prodops/assessment/iteration-plans/iteration-plan.md` com decisão `Entrou`.
4. O registro de promoção foi feito no `upstream-trail.md` do experimento e, quando a promoção afetar mais de um experimento, também no trail global.

## Referências

- Features comprometidas: [`prodops/product/features/`](../../product/features/)
- Trilha de experimentos: [`../experiments/`](../experiments/)
- Iteration Plan: [`prodops/assessment/iteration-plans/iteration-plan.md`](../../assessment/iteration-plans/iteration-plan.md)
- Histórico global: [`../upstream-trail.md`](../upstream-trail.md)
