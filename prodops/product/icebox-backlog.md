# Icebox Backlog - Payments

> Backlog de oportunidades, problemas e features ainda nao comprometidas em delivery. O objetivo do icebox e manter rastreabilidade entre estrategia de produto, operacao, confiabilidade e descoberta continua antes de uma iniciativa entrar no roadmap.

## 1. Governanca do Icebox

| Campo | Conteudo |
| --- | --- |
| Produto | Payments |
| Contexto | Gateway de pagamentos para ecommerce Magazine Siara, com foco inicial em compra por Pix e integracao Asaas. |
| Dono de produto | `[Product Manager Payments]` |
| Dono tecnico | `[Tech Lead Payments]` |
| Canal | `[Slack/Teams: #payments-prodops]` |
| Fonte principal | Features em `prodops/product/features` |
| Ultima atualizacao | `2026-06-30` |

## 2. Como usar este backlog

1. Registrar oportunidades como problemas observaveis, nao apenas solucoes.
2. Classificar cada item por resultado esperado, risco, dependencia e evidencia.
3. Manter itens no icebox enquanto faltarem contexto, prioridade ou capacidade.
4. Promover para discovery quando houver pergunta critica a responder.
5. Promover para delivery somente quando houver criterios de aceite, telemetria minima, dependencias conhecidas e owner definido.

## 3. Estados do item

| Estado | Significado | Criterio de movimentacao |
| --- | --- | --- |
| Icebox | Ideia, oportunidade ou necessidade conhecida, ainda sem compromisso. | Existe problema ou feature mapeada, mas faltam evidencias, prioridade ou capacidade. |
| Discovery | Item em investigacao de produto, negocio, tecnica, operacao ou dados. | Existe pergunta clara, dono e prazo de aprendizado. |
| Ready for Delivery | Item pronto para planejamento de sprint/kanban. | Criterios de aceite, dependencias, metricas e riscos estao claros. |
| Delivery | Item em implementacao. | Time assumiu compromisso e iniciou execucao. |
| Done | Entregue e observado em producao. | Criterios de aceite, logs, metricas, eventos e documentacao operacional validados. |
| Dropped | Nao sera executado agora. | Decisao registrada com motivo e condicao de revisita. |

## 4. Campos padrao por item

| Campo | Descricao |
| --- | --- |
| ID | Identificador estavel do item no backlog. |
| Titulo | Nome curto, orientado ao resultado. |
| Tipo | Feature, melhoria, risco, experimento, divida tecnica, observabilidade ou operacao. |
| Problema/oportunidade | Dor, risco ou oportunidade de negocio que justifica o item. |
| Usuario/cliente | Pessoa, sistema ou time impactado. |
| Outcome esperado | Mudanca mensuravel no comportamento, operacao ou resultado. |
| Evidencia atual | Dado, incidente, requisito, feature file, feedback ou hipotese. |
| Escopo MVP | Menor entrega util e verificavel. |
| Fora de escopo | Limites explicitos para evitar expansao silenciosa. |
| Dependencias | Sistemas, times, contratos, dados ou decisoes necessarias. |
| Riscos | Principais riscos de negocio, dados, tecnologia, seguranca ou operacao. |
| Telemetria minima | Eventos, logs, metricas, traces e auditoria necessarios. |
| Criterios de aceite | Condicoes objetivas para considerar o item pronto. |
| Score | Priorizacao por RICE/ICE/WSJF adaptada ao produto. |
| Status | Estado atual do item. |

## 5. Modelo de priorizacao

Use RICE como criterio padrao e complemente com risco operacional quando a confiabilidade da jornada for parte central da decisao.

| Campo | Escala | Pergunta |
| --- | --- | --- |
| Reach | 1-5 | Quantos clientes, pedidos, times ou fluxos sao impactados? |
| Impact | 1-5 | Quanto o item protege conversao, GMV, confianca, eficiencia ou continuidade? |
| Confidence | 1-5 | Quanta evidencia existe para sustentar a prioridade? |
| Effort | 1-5 | Qual o esforco relativo de engenharia, produto, dados e operacao? |
| Operational Risk | 1-5 | Qual o risco de incidente, retrabalho, perda financeira ou divergencia operacional se nao fizer? |

Formula sugerida:

```text
Score = ((Reach * Impact * Confidence) + Operational Risk) / Effort
```

## 6. Backlog resumido

| ID | Titulo | Tipo | Outcome esperado | Status | Score inicial | Fonte |
| --- | --- | --- | --- | --- | --- | --- |
| PAY-ICE-001 | Criar invoice via gateway com contrato unico | Feature | Ecommerce emite cobrancas sem acoplamento direto ao provedor Asaas. | Icebox | 16.4 | [create-invoice.feature](features/create-invoice.feature) |
| PAY-ICE-002 | Confirmar pagamento por webhook confiavel | Feature | Pedido e ecommerce recebem confirmacao uma unica vez, com eventos auditaveis. | Icebox | 20.8 | [payment-confirmation.feature](features/payment-confirmation.feature) |
| PAY-ICE-003 | Cancelar invoice pendente com idempotencia | Feature | Cobrancas abertas podem ser canceladas sem pagamento indevido ou evento duplicado. | Icebox | 13.7 | [cancel-invoice.feature](features/cancel-invoice.feature) |

## 7. Itens detalhados

### PAY-ICE-001 - Criar invoice via gateway com contrato unico

| Campo | Conteudo |
| --- | --- |
| Tipo | Feature |
| Problema/oportunidade | O ecommerce precisa criar cobrancas sem depender diretamente da API de um provedor especifico, preservando a capacidade futura de troca ou fallback de gateway. |
| Usuario/cliente | Ecommerce Magazine Siara, Checkout, Payments, Operacao. |
| Outcome esperado | Invoice criada com status rastreavel, provedor registrado, identificador externo persistido e resposta padronizada ao ecommerce. |
| Evidencia atual | Feature `Criar invoice no gateway de pagamentos`; necessidade de contrato unico e idempotencia por pedido. |
| Escopo MVP | Criar invoice no Asaas, criar/reutilizar cliente Asaas, validar provedor habilitado, garantir idempotencia e tratar falhas transientes/validacao. |
| Fora de escopo | Multiplo provedor ativo em fallback automatico, split de pagamento, estorno, conciliacao financeira completa. |
| Dependencias | Credenciais Asaas, cadastro de provedores por tenant, modelo de customer binding, storage de idempotencia, contrato de resposta ao ecommerce. |
| Riscos | Duplicidade de cobranca, cliente Asaas duplicado, invoice aberta sem `providerPaymentId`, exposicao de payload sensivel em erro. |
| Telemetria minima | Evento de invoice criada, tentativa de chamada ao provedor, provider latency, provider error code, idempotency hit/miss, audit log de rejeicao. |
| Criterios de aceite | Cenarios do arquivo [create-invoice.feature](features/create-invoice.feature) passam; retry com mesma chave nao chama o provedor; falha 5xx nao retorna invoice `OPEN` sem `providerPaymentId`; erro de validacao e auditavel sem segredo. |
| Score | Reach 4, Impact 5, Confidence 4, Effort 5, Operational Risk 2 = 16.4 |
| Status | Icebox |

**Perguntas de discovery**

- Qual e o contrato canonico de invoice que deve permanecer estavel entre provedores?
- Como identificar cliente reutilizavel com seguranca: documento, `externalReference` ou binding interno?
- Quais erros do Asaas viram erro de negocio, erro tecnico ou retry seguro?

### PAY-ICE-002 - Confirmar pagamento por webhook confiavel

| Campo | Conteudo |
| --- | --- |
| Tipo | Feature |
| Problema/oportunidade | Pagamento confirmado precisa liberar pedido uma unica vez, mesmo com webhook duplicado, atrasado ou recebido antes da consolidacao interna da invoice. |
| Usuario/cliente | Ecommerce Magazine Siara, Order Management, Payments, Financeiro, Atendimento. |
| Outcome esperado | Evento canonico `payment.confirmed` publicado uma unica vez por pagamento confirmado, com invoice atualizada e evento bruto auditavel. |
| Evidencia atual | Feature `Confirmacao de pagamento por webhook`; necessidade de confirmacao confiavel, conciliacao e protecao contra duplicidade. |
| Escopo MVP | Validar token Asaas, persistir evento bruto, processar `PAYMENT_CONFIRMED`, processar `PAYMENT_RECEIVED`, deduplicar eventos, correlacionar por `providerPaymentId` ou `externalReference`. |
| Fora de escopo | Painel financeiro completo, contestacao, chargeback, regras avancadas de reconciliacao multi-provedor. |
| Dependencias | Endpoint publico de webhook, segredo/token Asaas, armazenamento de eventos brutos, publicacao de eventos canonicos, contrato com ecommerce/Orders. |
| Riscos | Pedido liberado duas vezes, pagamento recebido sem pedido liberado, token vazado em logs, evento nao correlacionado, divergencia entre `CONFIRMED` e `RECEIVED`. |
| Telemetria minima | Webhook received, webhook rejected, event deduplication, invoice status transition, canonical event published, lag entre recebimento e publicacao. |
| Criterios de aceite | Cenarios do arquivo [payment-confirmation.feature](features/payment-confirmation.feature) passam; webhook invalido nao altera invoice; evento duplicado retorna sucesso tecnico sem republicar; `PAYMENT_RECEIVED` nao libera pedido pela segunda vez. |
| Score | Reach 5, Impact 5, Confidence 4, Effort 5, Operational Risk 4 = 20.8 |
| Status | Icebox |

**Perguntas de discovery**

- Qual evento canonico deve liberar pedido: `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED` ou ambos com regras diferentes?
- Qual e o SLA aceitavel entre webhook recebido e evento entregue ao ecommerce?
- Como operar eventos nao correlacionados ou recebidos fora de ordem?

### PAY-ICE-003 - Cancelar invoice pendente com idempotencia

| Campo | Conteudo |
| --- | --- |
| Tipo | Feature |
| Problema/oportunidade | O ecommerce precisa cancelar cobrancas pendentes para impedir pagamento indevido, mantendo idempotencia e decisao clara quando o provedor divergir. |
| Usuario/cliente | Ecommerce Magazine Siara, Checkout, Payments, Atendimento, Operacao. |
| Outcome esperado | Invoice aberta pode ser cancelada com seguranca, sem chamada duplicada ao provedor e sem evento canonico incorreto. |
| Evidencia atual | Feature `Cancelar invoice no gateway de pagamentos`; necessidade de cancelamento de cobrancas ainda ativas. |
| Escopo MVP | Cancelar invoice `OPEN` no Asaas, registrar `CANCEL_REQUESTED`, confirmar `CANCELLED`, publicar `payment.cancelled`, impedir cancelamento apos `CONFIRMED`, tratar 404 de provedor. |
| Fora de escopo | Estorno apos pagamento confirmado, disputa financeira, cancelamento parcial, politicas avancadas de conciliacao. |
| Dependencias | Politica de estados da invoice, endpoint Asaas `DELETE /v3/payments/{id}`, idempotencia de cancelamento, evento `payment.cancelled`, politica para 404. |
| Riscos | Cobranca permanecer pagavel apos cancelamento local, publicacao de cancelamento sem confirmacao do provedor, cancelamento indevido apos pagamento, duplicidade de evento. |
| Telemetria minima | Cancel request, provider delete latency/error, status transition, idempotency hit/miss, webhook `PAYMENT_DELETED`, canonical cancellation published. |
| Criterios de aceite | Cenarios do arquivo [cancel-invoice.feature](features/cancel-invoice.feature) passam; invoice `CONFIRMED` nao e cancelada; retry com mesma chave nao chama o provedor; 404 nao publica `payment.cancelled` sem decisao explicita. |
| Score | Reach 3, Impact 4, Confidence 4, Effort 4, Operational Risk 2 = 13.7 |
| Status | Icebox |

**Perguntas de discovery**

- O evento `payment.cancelled` deve ser publicado no comando de cancelamento ou apenas apos webhook `PAYMENT_DELETED`?
- Qual politica operacional deve ser aplicada quando o Asaas retorna 404?
- Quais status permitem cancelamento e quais exigem fluxo de estorno?

## 8. Definition of Ready

Um item so deve sair do icebox para delivery quando atender aos criterios abaixo.

| Criterio | Evidencia esperada |
| --- | --- |
| Problema claro | Dor, oportunidade ou risco escrito em linguagem de negocio e operacao. |
| Outcome mensuravel | Metrica, evento ou comportamento esperado definido. |
| Usuario/cliente conhecido | Sistemas, pessoas ou times impactados identificados. |
| Escopo MVP delimitado | Inclusoes e exclusoes documentadas. |
| Contrato definido | API, evento, payload ou comportamento externo versionavel. |
| Estados e erros mapeados | Transicoes principais, falhas esperadas e regras de retry/idempotencia claras. |
| Observabilidade planejada | Logs, metricas, traces, auditoria e alertas minimos definidos. |
| Dependencias conhecidas | Times, credenciais, topicos, filas, tabelas e provedores mapeados. |
| Criterios de aceite | Cenarios testaveis e rastreaveis a feature file ou especificacao. |
| Owner definido | Responsavel de produto e tecnico nomeados. |

## 9. Definition of Done operacional

| Dimensao | Criterio |
| --- | --- |
| Produto | Outcome inicial validado ou plano de medicao ativo. |
| Engenharia | Testes automatizados relevantes passando, contrato versionado e deploy rastreavel. |
| Confiabilidade | Logs, metricas, traces e alertas minimos em funcionamento. |
| Operacao | Runbook ou procedimento de suporte atualizado para falhas conhecidas. |
| Dados | Eventos canonicos e auditoria persistidos quando aplicavel. |
| Seguranca | Segredos, tokens e payloads sensiveis protegidos em logs, erros e auditoria. |
| Aprendizado | Decisoes, limites e trade-offs registrados no artefato correspondente. |

## 10. Decisoes pendentes

| ID | Decisao | Impacto | Dono | Status |
| --- | --- | --- | --- | --- |
| DEC-001 | Definir contrato canonico de invoice entre ecommerce e Payments API. | Bloqueia estabilidade de API e testes de contrato. | Tech Lead Payments | Aberto |
| DEC-002 | Definir politica de publicacao para `payment.confirmed`, `payment.received` e `payment.cancelled`. | Afeta Orders, ecommerce e conciliacao. | PM Payments + Tech Lead Payments | Aberto |
| DEC-003 | Definir politica para erros 404, 409, 422, 5xx e timeout do Asaas. | Afeta retry, suporte e estado final da invoice. | Engenharia Payments | Aberto |
| DEC-004 | Definir retencao e mascaramento de eventos brutos de webhook. | Afeta auditoria, seguranca e LGPD. | Seguranca + Payments | Aberto |
| DEC-005 | Definir SLO inicial de confirmacao de pagamento. | Afeta dashboards, alertas e readiness operacional. | SRE + Payments | Aberto |

## 11. Proximas acoes recomendadas

| Acao | Dono sugerido | Saida esperada |
| --- | --- | --- |
| Revisar scores com PM, Tech Lead e SRE. | PM Payments | Priorizacao inicial validada. |
| Transformar PAY-ICE-002 em discovery tecnico-operacional. | Tech Lead Payments | Decisao sobre eventos, idempotencia e correlacao. |
| Especificar contrato canonico de invoice. | Engenharia Payments | OpenAPI ou contrato interno versionado. |
| Definir eventos canonicos e topicos de publicacao. | Payments + Orders | Contrato de integracao entre Payments e ecommerce/Orders. |
| Criar matriz de estados da invoice. | Engenharia Payments | Estados permitidos, transicoes e regras de erro. |
