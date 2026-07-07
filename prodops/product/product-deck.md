# Product Deck - Payments

> Template aplicado ao produto Payments citado no material do curso ProdOps, no contexto Magazine Siara. Use como ponto de partida e ajuste nomes de times, sistemas, links e indicadores reais.

## 1. Identificacao

| Campo | Conteudo |
| --- | --- |
| Nome do produto | Payments |
| Descricao curta | Produto responsavel por habilitar, autorizar, confirmar e observar pagamentos nas jornadas de compra do ecommerce. |
| Contexto de negocio | Magazine Siara, ecommerce com alto volume, dependencia de checkout, Pix, gateway de pagamento, antifraude, pedido e notificacao. |
| Dono de produto | `[Product Manager Payments]` |
| Dono tecnico | `[Tech Lead Payments]` |
| Times principais | Payments, Checkout, Order Management, Antifraude, Plataforma/SRE, Atendimento, Operacao. |
| Canal principal | `[Slack/Teams: #payments-prodops]` |
| Ultima atualizacao | `[YYYY-MM-DD]` |

## 2. Product Vision

Para clientes que compram no ecommerce da Magazine Siara, o produto Payments deve permitir pagamentos confiaveis, rapidos, rastreaveis e intercambiaveis, garantindo que cada tentativa de pagamento tenha resposta clara, confirmacao observavel e continuidade operacional mesmo diante de falhas em gateways, Pix, antifraude ou integracoes externas.

Payments existe para proteger conversao, GMV, confianca do cliente e capacidade operacional do checkout. O produto deve reduzir entropia na jornada de pagamento, permitir diagnostico rapido e sustentar mudancas como migracao de meios de pagamento, novo gateway, fallback e novas modalidades comerciais.

## 3. Problemas e oportunidades

| Item | Descricao | Dimensao |
| --- | --- | --- |
| Novo gateway de pagamento | Migrar ou integrar novo gateway sem quebrar checkout, pedidos e conciliacao. | Empresa, Tecnologia |
| Compra de 1 item por Pix | Criar confiabilidade para uma jornada critica e simples o suficiente para mapear ponta a ponta. | Cliente, Tecnologia |
| Problema no checkout | GMV pode cair mesmo com aumento de campanhas se pagamento/checkout degradar. | Cliente, Empresa |
| Baixa rastreabilidade | Falhas em pagamento precisam ser explicadas por evento de dominio, nao apenas por status tecnico. | Dados, Fluxos |
| Intercambiabilidade | Gateway deve ser substituivel via fallback, contratos claros e observabilidade preservada. | Tecnologia, Time |
| Alertas ruins | Alertas genericos ou sem contexto aumentam MTTR e fadiga operacional. | Dados, Time |

## 4. Services

| Servico ou jornada | Cliente/usuario | Resultado esperado | Criticidade |
| --- | --- | --- | --- |
| Autorizacao de pagamento | Cliente comprador | Pagamento autorizado ou recusado com resposta clara. | Critica |
| Compra com Pix | Cliente comprador | Pix gerado, pago, confirmado e pedido liberado. | Critica |
| Confirmacao de pagamento | Checkout, Order Management, cliente | Pedido recebe confirmacao confiavel e segue fluxo. | Critica |
| Fallback de gateway | Checkout, operacao | Gateway alternativo assume sem perda de rastreabilidade. | Alta |
| Consulta de status de pagamento | Atendimento, cliente, operacao | Status atual consistente para troubleshooting e suporte. | Alta |
| Conciliacao de pagamento | Financeiro, operacao | Pagamentos conciliados com pedidos e transacoes. | Alta |
| Notificacao de resultado | Cliente, Order Management | Cliente e pedido recebem atualizacao correta. | Media |

## 5. Time do produto

| Papel | Nome/time | Responsabilidade | Canal |
| --- | --- | --- | --- |
| Product Manager | `[PM Payments]` | Priorizar jornadas, risco, resultado e roadmap de Payments. | `[link]` |
| Tech Lead | `[Tech Lead Payments]` | Arquitetura, contratos, confiabilidade e decisao tecnica. | `[link]` |
| Engenharia Payments | `[Squad Payments]` | APIs, eventos, integracoes, logs, metricas e testes. | `[link]` |
| Checkout | `[Squad Checkout]` | Experiencia de pagamento no fluxo de compra. | `[link]` |
| Order Management | `[Squad Orders]` | Criacao/liberacao de pedidos apos confirmacao. | `[link]` |
| Antifraude | `[Squad Antifraude]` | Analise de risco e bloqueios. | `[link]` |
| Plataforma/SRE | `[SRE/Platform]` | Observabilidade, incidentes, SLO, dashboards e runbooks. | `[link]` |
| Atendimento | `[CX/Atendimento]` | Tratativa de clientes impactados e feedback operacional. | `[link]` |
| Financeiro/Conciliacao | `[Finance Ops]` | Conciliacao, chargeback e divergencias financeiras. | `[link]` |

## 6. Arquitetura do produto

> Diagrama de componentes: [`prodops/assessment/architecture/overview.md`](../assessment/architecture/overview.md)
>
> O diagrama é a fonte canônica da estrutura do sistema. Atualizar sempre que
> houver mudança estrutural (novo módulo, rota, dependência externa, tabela ou
> tópico de evento). Ver regra completa em `AGENTS.md`.

| Peca | Tipo | Dono | Criticidade | Observacao |
| --- | --- | --- | --- | --- |
| Checkout Web/App | Frontend/BFF | Checkout | Critica | Inicia tentativa de pagamento e apresenta resposta ao cliente. |
| Payments API | API | Payments | Critica | Orquestra meios de pagamento, contratos e status. |
| Pix Provider | Integracao externa | Payments/Financeiro | Critica | Gera QR Code, recebe confirmacao e consulta status. |
| Gateway Primario | Integracao externa | Payments | Critica | Autorizacao/cartao/outros meios. |
| Gateway Fallback | Integracao externa | Payments | Alta | Deve assumir falhas do gateway primario com contrato claro. |
| Antifraude API | API/integracao | Antifraude | Alta | Pode aprovar, negar ou colocar transacao em analise. |
| Order Management | API/event consumer | Orders | Critica | Libera pedido apos pagamento confirmado. |
| Message Broker | Fila/eventos | Plataforma | Critica | Distribui eventos de pagamento e pedido. |
| Payments DB | Banco | Payments | Critica | Estado transacional de pagamentos. |
| Observability Stack | Logs/metrics/traces | Plataforma/SRE | Critica | Dashboards, alertas, traces e correlation id. |
| Notification Service | API/event consumer | Comunicacao | Media | Notifica cliente sobre resultado. |

## 7. Matriz de confiabilidade

| Jornada | Peca/dependencia | Falha possivel | Impacto | Sinal | Acionamento |
| --- | --- | --- | --- | --- | --- |
| Compra com Pix | Pix Provider | QR Code nao gerado | Cliente nao conclui compra; queda de conversao. | Taxa de erro em `PixQRCodeGerado`; erro 5xx/timeout. | Payments + Plataforma |
| Compra com Pix | Pix Provider | Pagamento realizado, mas nao confirmado | Pedido fica parado; abertura de chamados. | Evento `PixPago` sem `PagamentoConfirmado` em ate N minutos. | Payments + Orders |
| Autorizacao | Gateway Primario | Timeout ou indisponibilidade | Checkout degrada; GMV impactado. | Aumento de latencia/timeout por gateway. | Payments + SRE |
| Autorizacao | Gateway Fallback | Fallback nao acionado | Falha deixa de ser intercambiavel. | Falha primaria sem evento `GatewayFallbackAcionado`. | Payments |
| Antifraude | Antifraude API | Analise indisponivel | Pagamentos bloqueados ou risco aumentado. | Erro/timeout em decisao antifraude. | Antifraude + Payments |
| Confirmacao | Message Broker | Evento nao publicado | Orders nao libera pedido. | Ausencia de `PagamentoConfirmado` no topico esperado. | Plataforma + Payments |
| Confirmacao | Order Management | Pedido nao atualizado | Cliente paga e pedido nao avanca. | `PagamentoConfirmado` sem `PedidoLiberado`. | Orders + Payments |
| Atendimento | Consulta Status | Status inconsistente | Suporte sem resposta confiavel. | Divergencia Payments DB x Gateway x Orders. | Payments + Atendimento |

## 8. Product Analytics

| Indicador | Tipo | Pergunta que responde | Fonte | Cadencia |
| --- | --- | --- | --- | --- |
| Taxa de autorizacao por meio de pagamento | Cliente/Empresa | Clientes conseguem pagar? | Payments/Gateway | Tempo real + diaria |
| Conversao do checkout apos selecao de pagamento | Cliente/Empresa | Pagamento esta impactando GMV? | Analytics/Checkout | Tempo real + diaria |
| Latencia p95/p99 de autorizacao | Tecnologia | O fluxo esta rapido o suficiente? | Traces/APM | Tempo real |
| Taxa de erro por gateway | Tecnologia | Qual dependencia esta degradando? | Metrics/APM | Tempo real |
| Percentual de fallback acionado | Tecnologia/Empresa | Intercambiabilidade esta funcionando? | Payments events | Tempo real + semanal |
| Pagamentos confirmados sem pedido liberado | Fluxo/Dados | Existe quebra entre Payments e Orders? | Eventos/consistencia | Tempo real |
| Pix pago sem confirmacao no prazo | Cliente/Tecnologia | Cliente pagou e ficou sem retorno? | Eventos Pix/Payments | Tempo real |
| MTTR de incidentes Payments | Time/Tecnologia | O time recupera a jornada rapido? | Incident tool | Mensal |
| Alertas acionaveis vs alertas ruidosos | Time/Dados | Observabilidade esta gerando acao ou ruido? | Alert manager | Quinzenal |

## 9. Eventos de dominio

| Evento | Descricao | Produtor | Consumidores | Observabilidade minima |
| --- | --- | --- | --- | --- |
| `PagamentoIniciado` | Cliente escolheu meio de pagamento e iniciou tentativa. | Checkout/Payments | Payments, Analytics | correlationId, paymentId, orderId, method |
| `PixQRCodeGerado` | QR Code Pix foi criado com sucesso. | Payments | Checkout, Analytics | provider, expiration, latency |
| `PagamentoAutorizado` | Gateway autorizou pagamento. | Payments | Orders, Analytics, Notifications | gateway, amount, method, latency |
| `PagamentoRecusado` | Pagamento foi recusado com motivo conhecido. | Payments | Checkout, Analytics, Atendimento | reasonCode, gateway, method |
| `PagamentoConfirmado` | Pagamento foi confirmado e pode liberar pedido. | Payments | Orders, Notifications, Analytics | paymentId, orderId, amount, confirmedAt |
| `PagamentoExpirado` | Janela de pagamento expirou. | Payments | Checkout, Orders, Atendimento | method, expiration, orderId |
| `GatewayFallbackAcionado` | Fluxo usou gateway alternativo. | Payments | SRE, Analytics | gatewayOrigem, gatewayDestino, reason |
| `PagamentoFalhou` | Falha tecnica ou inesperada no processamento. | Payments | SRE, Atendimento | errorCode, dependency, traceId |

## 10. Observable Business Contracts

| Evento | SLI | SLO/limite inicial | Impacto | Resposta | Dono |
| --- | --- | --- | --- | --- | --- |
| `PagamentoConfirmado` | Percentual de pagamentos confirmados refletidos em Orders. | 99% em ate 30s | Pedido parado apos pagamento. | Acionar Payments + Orders; verificar broker e consumer. | Payments/Orders |
| `PixQRCodeGerado` | Percentual de QR Codes gerados com sucesso. | 99.5% em ate 3s | Cliente nao consegue pagar com Pix. | Acionar Payments; avaliar provider e fallback operacional. | Payments |
| `GatewayFallbackAcionado` | Percentual de falhas elegiveis com fallback executado. | 95% das falhas elegiveis | Falha de gateway vira indisponibilidade. | Acionar Payments; verificar regras de roteamento. | Payments |
| `PagamentoRecusado` | Percentual de recusas com motivo de negocio mapeado. | 99% com reasonCode conhecido | Cliente e atendimento sem explicacao. | Acionar Payments + Antifraude/Gateway. | Payments |
| `PagamentoFalhou` | Tempo ate alerta acionavel com contexto. | Alerta em ate 2min | MTTR alto e troubleshooting lento. | Acionar SRE + Payments com runbook. | SRE/Payments |

## 11. SLOs iniciais

| SLO | Janela | Justificativa |
| --- | --- | --- |
| 99.5% das tentativas de pagamento respondem com sucesso, recusa conhecida ou erro tratado. | 30 dias | O cliente precisa receber resposta clara, nao ficar em estado desconhecido. |
| 99% dos pagamentos confirmados liberam pedido em ate 30 segundos. | 30 dias | Evita cliente pago sem pedido avancar. |
| p95 de autorizacao abaixo de 3 segundos para gateway primario. | 7 dias | Latencia impacta conversao do checkout. |
| 95% das falhas elegiveis acionam fallback automaticamente. | 30 dias | Garante intercambiabilidade do gateway. |
| 100% dos incidentes SEV1/SEV2 de Payments geram postmortem e atualizacao de artefato. | Mensal | Fecha o ciclo ProdOps de aprendizado. |

## 12. Dashboards

| Dashboard | Perguntas que deve responder | Link |
| --- | --- | --- |
| Payments - Jornada Checkout | Cliente consegue pagar? Onde esta a queda? | `[link]` |
| Payments - Pix | QR Code, expiracao, confirmacao e divergencias estao saudaveis? | `[link]` |
| Payments - Gateways | Qual gateway esta lento, recusando ou falhando? | `[link]` |
| Payments - Orders Consistency | Pagamento confirmado virou pedido liberado? | `[link]` |
| Payments - Incidents | Quais incidentes ocorreram, MTTR e recorrencia? | `[link]` |

## 13. Runbooks

| Runbook | Quando usar | Link |
| --- | --- | --- |
| Pix pago sem confirmacao | Cliente pagou, mas pedido nao avancou. | `[link]` |
| Gateway primario indisponivel | Aumento de timeout/5xx no gateway. | `[link]` |
| Fallback nao acionado | Falha elegivel sem evento de fallback. | `[link]` |
| Pagamento confirmado sem pedido | Evento Payments nao refletiu em Orders. | `[link]` |
| Divergencia de status | Atendimento consulta status divergente. | `[link]` |

## 14. Stakeholders

| Stakeholder | Interesse | Decisao que toma | Canal |
| --- | --- | --- | --- |
| Diretoria Ecommerce | GMV, conversao, confianca na Black Friday. | Priorizacao de risco e investimento. | `[link]` |
| Produto Checkout | Experiencia e conversao. | Priorizacao de UX e jornadas. | `[link]` |
| Produto Payments | Roadmap de meios de pagamento e confiabilidade. | Prioridade do produto Payments. | `[link]` |
| Financeiro | Conciliacao, custo, chargeback. | Regras financeiras e aceitacao de risco. | `[link]` |
| Atendimento | Reducao de chamados e respostas confiaveis. | Procedimentos de suporte. | `[link]` |
| Plataforma/SRE | Operabilidade, SLO, incidentes. | Padroes de observabilidade e resposta. | `[link]` |
| Seguranca/Antifraude | Risco, fraude e compliance. | Politicas de aprovacao e bloqueio. | `[link]` |

## 15. Links

| Tipo | Link |
| --- | --- |
| Repositorio Payments API | `[link]` |
| Repositorio Checkout/BFF | `[link]` |
| Pipelines Payments | `[link]` |
| OpenAPI/Contratos | `[link]` |
| Topicos/Eventos | `[link]` |
| Dashboards | `[link]` |
| Alertas | `[link]` |
| Runbooks | `[link]` |
| Backlog | `[link]` |
| Postmortems | `[link]` |

## 16. Tracking List inicial

| Item | Origem | Dimensao | Dono | Status | Proxima acao |
| --- | --- | --- | --- | --- | --- |
| Confirmar SLO de Pix com negocio. | Continuous Assessment | Cliente/Empresa | PM Payments | Aberto | Validar meta inicial. |
| Mapear contratos com gateway primario e fallback. | Service Deck | Tecnologia/Pecas | Tech Lead Payments | Aberto | Revisar OpenAPI e erros. |
| Criar alerta para Pix pago sem confirmacao. | ODD | Dados/Fluxos | SRE + Payments | Aberto | Definir query e runbook. |
| Validar evento `GatewayFallbackAcionado`. | Reliability Plan | Tecnologia/Dados | Payments | Aberto | Implementar ou confirmar evento. |
| Revisar fluxo PagamentoConfirmado -> PedidoLiberado. | Matriz de Confiabilidade | Fluxos/Times | Payments + Orders | Aberto | Desenhar Service Blueprint. |

## 17. Proximos artefatos recomendados

- Service Deck da jornada `Compra com Pix`.
- Matriz de Confiabilidade detalhada para `PagamentoConfirmado -> PedidoLiberado`.
- Reliability Plan para migracao ou adocao de novo gateway de pagamento.
- Observable Business Contract para `PagamentoConfirmado`.
- Runbook `Pix pago sem confirmacao`.
