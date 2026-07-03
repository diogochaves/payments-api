# Iteration Plan - Payments Release

> Documento gerado a partir de `prodops/assessment/reliability-plan/setup/iteration-plan.prompt.md`.
> Foco: decisao de escopo de negocio para a proxima iteracao. Este documento nao substitui o Reliability Plan.

## Executive Summary

A proxima iteracao deve priorizar o menor conjunto de funcionalidades capaz de colocar a nova jornada de pagamento em condicao de gerar valor para o Checkout sem ampliar excessivamente o risco da Release.

O escopo recomendado e concentrar a Release em tres resultados de negocio: criar invoice Pix, confirmar pagamento e informar status de pagamento ao cliente. Boleto deve ser dividido para nao competir com a estabilizacao da jornada Pix. Cancelamento de invoice deve ficar fora do compromisso principal desta iteracao, apesar de ja existir no codigo, porque nao e essencial para validar a ativacao do novo gateway no Checkout.

A decisao principal e reduzir o lote: entregar uma jornada menor, completa e compreensivel para o cliente e para o negocio, em vez de incluir todos os meios e capacidades de pagamento ao mesmo tempo.

## Objetivos da Release

- Habilitar o Checkout a consumir o novo gateway de Payments em uma jornada de pagamento controlada.
- Reduzir o acoplamento do Ecommerce com o monolito e com integracoes diretas de provedor.
- Validar o novo dominio Payments como responsavel por criacao e confirmacao de pagamento.
- Garantir que o cliente receba uma informacao confiavel sobre o status do pagamento.
- Reduzir a probabilidade de falha da Release ao limitar o escopo ao fluxo de maior valor imediato.

## Riscos que influenciaram o escopo

| Risco | Impacto no negocio | Probabilidade | Influencia sobre o escopo |
| --- | --- | --- | --- |
| Novo gateway ainda desabilitado por Feature Flag devido a bug localizado. | Muito alto: impede ativacao da Release e, segundo `prodops/assessment/reliability-plan/risks.md`, existe risco contratual relevante. | Alta | Reduzir escopo para a jornada mais importante, evitando incluir funcionalidades paralelas que desviem foco da ativacao. |
| Notification Service ja teve incidentes que afetaram confirmacao ao cliente. | Alto: cliente pode pagar e nao receber informacao confiavel. | Alta | Manter notificacao de status dentro da Release, mas apenas como parte da jornada principal, nao como plataforma completa de comunicacao. |
| Desacoplamento do monolito aumenta complexidade entre times e servicos. | Alto: falhas de integracao podem impedir a experiencia ponta a ponta. | Alta | Preferir uma jornada completa menor em vez de multiplas jornadas incompletas. |
| Pix e Boleto possuem regras e expectativas diferentes. | Medio/alto: tratar ambos como variacao simples pode aumentar erro de negocio. | Media | Dividir Boleto e nao comprometer a Release principal com todas as variacoes do meio de pagamento. |
| Confirmacao de pagamento e ponto critico para liberacao e comunicacao ao cliente. | Muito alto: pagamento confirmado sem reflexo no Ecommerce gera perda de confianca e chamados. | Alta | Confirmacao entra como parte obrigatoria da iteracao. |
| Cancelamento concorre com estados de pagamento e fluxo de estorno. | Medio: importante para operacao, mas menos central para validar a ativacao inicial do Checkout. | Media | Adiar cancelamento como compromisso de Release, mantendo fora do menor escopo de valor. |
| Divergencia entre documentos e codigo. | Medio: pode gerar alinhamento incorreto sobre o que sera entregue. | Alta | Escopo deve ser descrito por capacidades de negocio, nao por detalhes de endpoints ou desenho tecnico. |

## Oportunidades consideradas

| Oportunidade | Impacto | Urgencia | Relevancia para esta iteracao | Influencia sobre o escopo |
| --- | --- | --- | --- | --- |
| Validar Payments como dominio autonomo do Ecommerce. | Alto | Alta | Alta | Prioriza funcionalidades que provem o ciclo de pagamento fim a fim, nao apenas endpoints isolados. |
| Criar visibilidade de negocio sobre jornada de pagamento. | Alto | Alta | Media | Reforca a escolha por uma jornada menor e mensuravel pelo negocio, sem ampliar o escopo funcional. |
| Reduzir dependencia direta de provedor. | Alto | Alta | Alta | Prioriza criacao e confirmacao via gateway Payments. |
| Aumentar confianca do cliente na confirmacao de pagamento. | Alto | Alta | Alta | Mantem notificacao de status dentro do escopo principal. |
| Acelerar meios adicionais de pagamento. | Medio/alto | Media | Media | Justifica preparar Boleto, mas nao incluir a jornada completa se isso reduzir previsibilidade. |
| Integrar Payments ao modelo corporativo de incidentes. | Medio | Media | Baixa para decisao de escopo | Nao altera as funcionalidades da iteracao; deve ser tratado em artefato proprio de confiabilidade. |

## Iteration Backlog identificado

| Feature | Valor esperado | Dependencias | Estado atual |
| --- | --- | --- | --- |
| Criar invoice via Pix | Permite ao Checkout iniciar a jornada de pagamento de maior prioridade para a Release. | Checkout, Payments, provedor Asaas, Feature Flag. | Documentada em feature file e parcialmente implementada no codigo. |
| Criar invoice via Boleto | Amplia meios de pagamento atendidos pelo novo gateway. | Checkout, Payments, regras de Boleto, provedor Asaas, notificacao. | Suportada genericamente por `billingType`, mas sem evidencia de jornada especifica completa. |
| Confirmacao de pagamento | Permite ao Ecommerce reconhecer pagamento aprovado e seguir a jornada do cliente. | Payments, webhook do provedor, Ecommerce/Orders, Notification Service. | Documentada e implementada no codigo para eventos principais. |
| Notificacao de status de pagamento | Fecha o ciclo de comunicacao com o cliente e reduz incerteza pos-pagamento. | Ecommerce, Notification Service, Payments. | Documentada como necessidade critica; integracao final nao aparece como funcionalidade completa neste repositorio. |
| Cancelar invoice pendente | Evita que cobrancas indevidas continuem ativas. | Payments, provedor Asaas, regras de estado da invoice. | Documentada e implementada no codigo. |
| Habilitar novo gateway para o Checkout | Permite que a Release gere valor real em producao. | Checkout, Feature Flag, Payments. | Documentada no premortem como preparada, mas bloqueada por bug localizado. |

## Iteration Plan recomendado

| Feature | Decisao | Justificativa | Valor entregue |
| --- | --- | --- | --- |
| Habilitar novo gateway para o Checkout na jornada priorizada | Entrou | Sem a habilitacao do novo gateway, a Release nao entrega valor de negocio. Deve ser tratada como parte do recorte funcional, nao como item acessorio. | Checkout passa a usar Payments como caminho de pagamento para a jornada escolhida. |
| Criar invoice via Pix | Entrou | Pix e a melhor fatia para validar o novo gateway: tem alto valor para Checkout, esta presente no Service Deck e ja possui base de implementacao. | Cliente consegue iniciar pagamento Pix pelo novo dominio Payments. |
| Confirmacao de pagamento | Entrou | Sem confirmacao, a invoice criada nao fecha a jornada de negocio. Essa funcionalidade reduz o principal risco de cliente pagar sem continuidade clara. | Ecommerce recebe sinal confiavel de pagamento aprovado. |

| Notificacao de status de pagamento | Entrou como MVP | A notificacao e essencial para a experiencia do cliente, mas deve ficar restrita aos status da jornada principal da Release. | Cliente recebe informacao de status para o pagamento da jornada priorizada. |
| Criar invoice via Boleto | Dividida | Boleto tem valor, mas amplia variacoes de regra e comunicacao. Entra apenas como preparacao de contrato/escopo reduzido se nao competir com Pix, confirmacao e notificacao. | Mantem opcao de evolucao para Boleto sem comprometer a previsibilidade da Release. |
| Cancelar invoice pendente | Adiada | Apesar de implementada, nao e essencial para validar a ativacao inicial do novo gateway no Checkout. Incluir como compromisso principal aumentaria superficie da Release. | Valor preservado para iteracao posterior com menor risco de dispersao. |
| Integracao corporativa de incidentes/ITSM | Saiu | E relevante para operacao, mas nao e funcionalidade de negocio da iteracao. | Mantem foco no recorte funcional da Release. |
| Gateway fallback/Itau | Saiu | O Product Deck cita intercambiabilidade, mas o escopo atual e Asaas. Incluir fallback agora ampliaria demais a Release. | Evita transformar a iteracao em programa de plataforma. |

## Trade-offs realizados

Boleto ficou dividido porque amplia o escopo sem ser a menor fatia necessaria para validar o novo gateway. A decisao preserva o valor futuro de Boleto, mas evita que a Release dependa simultaneamente de duas jornadas de pagamento com regras distintas.

Cancelamento ficou adiado porque, embora tenha valor operacional e esteja implementado, nao e a capacidade central para provar a nova jornada Checkout -> Payments -> confirmacao -> cliente informado. Ele pode ser retomado quando a ativacao principal estiver estabilizada.

Itens de observabilidade, ITSM, runbooks, rollout e confiabilidade nao foram incluidos como escopo funcional do Iteration Plan porque o prompt define que esses assuntos pertencem ao Reliability Plan. Eles influenciam a cautela na selecao do escopo, mas nao entram como funcionalidades desta decisao de negocio.

Fallback/Itau ficou fora porque aumentaria muito o tamanho da Release. A oportunidade de intercambiabilidade continua valida no Product Deck, mas nao pertence ao menor conjunto de funcionalidades necessario para esta iteracao.

## Premissas

- A proxima iteracao tem duracao de 15 dias, conforme o premortem.
- O objetivo principal da Release e habilitar o novo gateway no Checkout com menor risco de falha.
- Pix e a jornada prioritaria para validar o novo gateway, por estar detalhada no Service Deck de Compra com Pix.
- Boleto e desejado pelo negocio, mas nao ha evidencia suficiente nos artefatos para trata-lo como jornada tao madura quanto Pix nesta iteracao.
- Notification Service permanece como dependencia critica para a experiencia do cliente.
- O bug da Feature Flag esta fora do codigo deste repositorio, mas influencia diretamente a decisao de escopo.
- A analise do codigo foi usada apenas para avaliar viabilidade de escopo, nao para propor tarefas de implementacao.

## Fontes consultadas

- `prodops/current-state/product-deck.md`
- `prodops/current-state/service-decks/compra-com-pix.md`
- `prodops/current-state/icebox-backlog.md`
- `prodops/current-state/features/create-invoice.feature`
- `prodops/current-state/features/payment-confirmation.feature`
- `prodops/current-state/features/cancel-invoice.feature`
- `prodops/assessment/premortem.md`
- `prodops/assessment/reliability-plan/risks.md`
- `prodops/assessment/reliability-plan/opportunities.md`
- `prodops/assessment/reliability-plan/iteration-backlog.md`
- `prodops/assessment/event-storming/plan.json`
- `api/src/modules/invoices`
- `api/src/infra/asaas.service.ts`
- `api/test/create-invoice.acceptance.e2e-spec.ts`
