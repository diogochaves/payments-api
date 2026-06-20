# Features ProdOps - Payments

Esta pasta descreve BDDs de produto para Payments usando a visao do [Product Deck](../product-deck.md), a definicao de [Payments como SOR e Asaas como PSP](../payments-sor-psp.md) e os criterios de observabilidade definidos em [Event Storming Plan](../event-storming/plan.json).

## Features

- [Criar Invoice](./create-invoice.feature)

## Criterio transversal de aceite

Uma feature de Payments so esta pronta quando entrega comportamento de negocio e tambem os sinais observaveis esperados para operar a jornada. Para `Criar Invoice`, isso inclui eventos positivos e eventos de excecao com `event_key`, `env`, `correlationId`, `orderId`, `invoiceId`, `provider` e `stage` suficientes para alimentar KPIs e tendencias definidos no plano de event storming.

