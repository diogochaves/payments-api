# Premortem ProdOps - Payments e Checkout

> Exercicio preventivo para antecipar falhas provaveis na sprint de integracao entre Checkout, Payments e Notification Service. O objetivo e transformar riscos conhecidos em acoes observaveis antes de habilitar o novo gateway em producao.

## 1. Contexto executivo

Os times de Ecommerce da Magazine Siara iniciaram um processo de desacoplamento do monolito para aumentar a autonomia das equipes, reduzir dependencia entre entregas e permitir evolucao mais rapida dos dominios de negocio. Dentro desse movimento, o time de Payments foi criado para administrar as funcionalidades relacionadas a gestao de pagamentos dos clientes, incluindo criacao de cobrancas, confirmacao de pagamento, eventos de status e integracoes com provedores externos.

Parte da estrutura de notificacao ja foi extraida para um servico separado, pois estava tecnicamente pronta para operar fora do monolito. Com isso, algumas funcionalidades foram antecipadas para consumo pelo Ecommerce, que segue centralizando a conversacao com os clientes e orquestrando a comunicacao de status da jornada de compra.

O servico de Checkout ja esta preparado para usar o novo gateway em producao, mas a ativacao permanece bloqueada por Feature Flag devido a um bug localizado. Ao mesmo tempo, o Notification Service ja esta em uso e possui historico recente de incidentes que prejudicaram a comunicacao de confirmacao de pagamento ao cliente.

A proxima sprint do time, prevista para iniciar no dia 20 e durar 15 dias, pretende entregar as capacidades necessarias para a funcionalidade de Checkout:

- Criar invoice via Pix.
- Criar invoice via Boleto.
- Confirmar pagamento.
- Notificar status de pagamento.

## 2. Premissa do premortem

Estamos no fim da sprint de 15 dias e a entrega falhou ou precisou ser revertida. O novo fluxo de pagamento nao foi habilitado com seguranca em producao, clientes ficaram sem informacao confiavel sobre o pagamento, ou houve divergencia entre Checkout, Payments, Notification Service e provedor de pagamento.

Este documento responde: o que provavelmente aconteceu, quais sinais teriam aparecido antes e quais acoes reduzem a chance de falha.

## 3. Resultado esperado da sprint

| Resultado | Descricao |
| --- | --- |
| Checkout integrado ao gateway | Checkout consegue criar invoices no Payments usando contrato estavel para Pix e Boleto. |
| Pagamento confirmavel | Payments recebe confirmacao do provedor, atualiza estado interno e publica evento canonico. |
| Cliente informado | Notification Service comunica status de pagamento ao cliente sem duplicidade, atraso excessivo ou silencio operacional. |
| Feature Flag segura | Ativacao do novo gateway pode ser feita de forma gradual, reversivel e observavel. |
| Operacao preparada | Times conseguem diagnosticar falhas por orderId, invoiceId, paymentId, providerPaymentId e correlationId. |

## 4. Hipoteses criticas

| Hipotese | Risco se for falsa | Como validar antes do go-live |
| --- | --- | --- |
| O contrato Checkout -> Payments cobre Pix e Boleto sem ambiguidade. | Checkout envia payload valido para um meio e invalido para outro; erros aparecem so em producao. | Testes de contrato para Pix e Boleto, exemplos versionados e validacao de schema. |
| A Feature Flag isola totalmente o novo gateway. | Parte do trafego usa o gateway novo sem controle ou rollback consistente. | Teste de ativacao/desativacao em ambiente controlado e auditoria por tenant/canal. |
| Notification Service consegue operar a carga e os eventos esperados. | Cliente paga, mas nao recebe confirmacao ou recebe mensagens duplicadas. | Teste de carga leve, deduplicacao por evento e dashboard de envio/falha. |
| Payments possui idempotencia por pedido/invoice. | Retentativas criam cobrancas duplicadas. | Testes com mesma chave de idempotencia para sucesso, timeout e retry. |
| Confirmacao de pagamento e notificacao usam eventos correlacionaveis. | Pagamento confirmado nao encontra pedido ou notificacao correta. | Rastrear correlationId, orderId, invoiceId, paymentId e providerPaymentId ponta a ponta. |

## 5. Cenarios de falha provaveis

| ID | Falha imaginada | Causa provavel | Impacto | Sinais antecipados | Acao preventiva |
| --- | --- | --- | --- | --- | --- |
| PMT-PRE-001 | Checkout habilita o novo gateway e parte dos pedidos nao cria invoice. | Contrato Pix/Boleto incompleto, validacao divergente ou bug ainda protegido pela Feature Flag. | Queda de conversao e aumento de erro no checkout. | 4xx/5xx em criacao de invoice, feature flag ligada para poucos usuarios com erro acima do baseline. | Criar suite de contrato Checkout -> Payments e checklist de liberacao da flag. |
| PMT-PRE-002 | Cliente paga, mas nao recebe confirmacao. | Notification Service falha, nao consome evento ou nao correlaciona pagamento e pedido. | Chamados no atendimento, baixa confianca e pedidos parados. | `payment.confirmed` sem notificacao enviada; aumento de eventos em retry/dead-letter. | Definir SLO de notificacao e alerta para confirmacao sem comunicacao ao cliente. |
| PMT-PRE-003 | Pagamento e confirmado mais de uma vez. | Webhook duplicado, retry do provedor ou consumo nao idempotente. | Pedido liberado duas vezes, notificacao duplicada e risco operacional. | Eventos repetidos com mesmo `providerPaymentId`; duplicidade de `payment.confirmed`. | Persistir eventos brutos e deduplicar por provider event id, payment id e transicao de estado. |
| PMT-PRE-004 | Pix funciona, mas Boleto falha em producao. | Boleto foi tratado como variacao simples de invoice, sem regras proprias de vencimento, linha digitavel e status. | Clientes de Boleto ficam bloqueados ou recebem instrucao incorreta. | Erros concentrados em `billingType=Boleto`; payloads rejeitados pelo provedor. | Separar criterios de aceite de Pix e Boleto e testar contratos especificos por meio. |
| PMT-PRE-005 | Feature Flag nao permite rollback limpo. | Estado criado no novo gateway nao tem reconciliacao ou fallback para o fluxo antigo. | Operacao fica presa entre dois fluxos e precisa tratar pedidos manualmente. | Pedidos iniciados no gateway novo continuam recebendo eventos apos flag desligada. | Definir politica de rollback: novos pedidos voltam ao fluxo antigo, pedidos ja iniciados seguem reconciliados no Payments. |
| PMT-PRE-006 | Times nao conseguem diagnosticar falhas rapidamente. | Logs sem correlationId, dashboards incompletos ou eventos sem identificadores comuns. | MTTR alto e decisao por percepcao, nao por evidencias. | Incidentes dependem de consulta manual em banco/provedor; Atendimento sem status confiavel. | Padronizar logs e eventos com orderId, invoiceId, paymentId, providerPaymentId e correlationId. |
| PMT-PRE-007 | Criacao de invoice gera cobranca duplicada. | Retentativa do Checkout apos timeout sem idempotencia consistente. | Cliente pode pagar duplicado; conciliacao e suporte ficam comprometidos. | Mesmo orderId com mais de uma invoice aberta no provedor. | Exigir chave de idempotencia por operacao e bloquear duplicidade por orderId + metodo + tenant. |
| PMT-PRE-008 | A sprint entrega endpoints, mas nao entrega operabilidade. | Scrum foca itens funcionais e deixa alertas, runbooks e dashboards para depois. | Go-live tecnicamente possivel, mas operacionalmente fragil. | Historias sem criterio de observabilidade; ausencia de runbook para incidentes conhecidos. | Incluir Definition of Done operacional para cada historia da sprint. |

## 6. Perguntas que precisam de resposta antes da sprint

| Pergunta | Por que importa | Dono sugerido |
| --- | --- | --- |
| Qual bug mantem o novo gateway desligado por Feature Flag? | Define risco real de go-live e criterio minimo de correcao. | Tech Lead Checkout + Payments |
| A entrega de Pix e Boleto usa o mesmo contrato ou contratos especializados? | Evita que regras de um meio contaminem o outro. | Engenharia Payments |
| Quem e dono da comunicacao final ao cliente: Ecommerce ou Notification Service? | Define responsabilidade quando pagamento confirma, mas cliente nao e avisado. | PM Ecommerce + PM Payments |
| Qual evento libera notificacao de status: criacao, confirmacao, recebimento ou cancelamento? | Evita mensagens antecipadas, duplicadas ou ausentes. | Payments + Notification |
| Qual e a politica para pedidos criados enquanto a flag estava ligada e depois desligada? | Evita perda de rastreabilidade durante rollback. | Checkout + Payments + Operacao |
| Quais incidentes recentes do Notification Service se repetiriam neste fluxo? | Usa aprendizado real para reduzir reincidencia. | SRE + Notification |

## 7. Readiness checklist

| Area | Criterio minimo antes de habilitar em producao | Status |
| --- | --- | --- |
| Produto | Jornada Pix e Boleto descritas com estados esperados e mensagens ao cliente. | Aberto |
| Checkout | Feature Flag com rollout gradual, auditoria e rollback testado. | Aberto |
| Payments | Criacao de invoice idempotente para Pix e Boleto. | Aberto |
| Payments | Confirmacao de pagamento deduplicada e correlacionada com invoice/pedido. | Aberto |
| Notification | Consumo de eventos com deduplicacao e rastreabilidade por pedido. | Aberto |
| Observabilidade | Dashboard com criacao de invoice, confirmacao, notificacao, erro e latencia. | Aberto |
| Alertas | Alerta para pagamento confirmado sem notificacao ao cliente. | Aberto |
| Operacao | Runbook para falha de invoice, confirmacao ausente, notificacao ausente e rollback da flag. | Aberto |
| Atendimento | Consulta ou procedimento para informar status confiavel ao cliente. | Aberto |
| Seguranca | Segredos e payloads sensiveis do provedor mascarados em logs e auditoria. | Aberto |

## 8. Plano de reducao de risco

| Prioridade | Acao | Resultado esperado | Dono sugerido |
| --- | --- | --- | --- |
| P0 | Corrigir e documentar o bug que mantem o gateway desabilitado. | Feature Flag deixa de esconder risco desconhecido. | Checkout + Payments |
| P0 | Definir contrato canonico de invoice para Pix e Boleto. | Checkout e Payments integram sem ambiguidade de payload e erro. | Payments |
| P0 | Implementar idempotencia e deduplicacao em criacao e confirmacao. | Retentativas nao geram cobranca ou notificacao duplicada. | Payments |
| P0 | Criar alerta para `payment.confirmed` sem notificacao entregue. | Incidente de cliente sem informacao aparece antes do chamado. | SRE + Notification |
| P1 | Criar dashboard de jornada ponta a ponta. | Time visualiza conversao tecnica por etapa. | SRE + Payments |
| P1 | Testar rollback da Feature Flag com pedidos em andamento. | Desligamento nao abandona invoices ja criadas. | Checkout + Payments |
| P1 | Revisar incidentes recentes do Notification Service. | Acoes de mitigacao entram na sprint, nao no pos-incidente. | Notification + SRE |
| P2 | Criar runbook inicial de pagamento confirmado sem notificacao. | Atendimento e operacao tem procedimento padrao. | Payments + Atendimento |

## 9. Definition of Done ProdOps para a sprint

Uma historia da sprint so deve ser considerada concluida quando atender aos pontos abaixo, quando aplicavel:

- Criterios funcionais implementados e testados.
- Contrato de API ou evento documentado.
- Erros esperados mapeados com resposta clara para Checkout/Ecommerce.
- Idempotencia validada para retry do cliente, timeout e webhook duplicado.
- Logs estruturados com `correlationId`, `orderId`, `invoiceId`, `paymentId` e `providerPaymentId`.
- Metricas de sucesso, erro e latencia emitidas.
- Evento canonico publicado uma unica vez por transicao relevante.
- Dashboard ou query operacional disponivel.
- Runbook minimo atualizado para falhas conhecidas.
- Feature Flag testada para ativacao gradual e rollback.

## 10. Narrativa melhorada para alinhamento

O desacoplamento do monolito da Magazine Siara criou uma fronteira nova entre Ecommerce, Checkout, Payments e Notification Service. Essa fronteira aumenta autonomia, mas tambem transfere parte do risco para contratos, eventos, observabilidade e operacao entre times.

Payments passa a ser o dono do dominio de pagamento: criar invoices, integrar provedores, receber confirmacoes e manter estados confiaveis. Ecommerce continua responsavel pela conversa com o cliente, mas depende de sinais corretos e tempestivos de Payments e Notification Service para informar status da compra.

Como o Notification Service ja opera fora do monolito e ja apresentou incidentes, ele deve ser tratado como dependencia critica da jornada, nao apenas como canal auxiliar. Uma confirmacao de pagamento tecnicamente correta ainda pode falhar como experiencia do cliente se a notificacao nao for enviada, for duplicada ou chegar atrasada.

O novo gateway esta tecnicamente preparado no Checkout, mas permanece desabilitado por Feature Flag por causa de um bug localizado. Isso indica que a sprint nao deve medir sucesso apenas por endpoints entregues. O sucesso real exige liberar o fluxo com contrato claro, idempotencia, rollback testado, telemetria ponta a ponta e runbooks para os cenarios de falha mais provaveis.

Para a sprint de 15 dias iniciada no dia 20, as entregas de invoice Pix, invoice Boleto, confirmacao de pagamento e notificacao de status devem ser planejadas como uma jornada unica. A falha mais perigosa nao e apenas uma chamada retornar erro; e o cliente pagar e a plataforma nao conseguir explicar, confirmar, notificar ou reconciliar o que aconteceu.
