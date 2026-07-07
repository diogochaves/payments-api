# Service Deck - Compra com Pix

> Template aplicado a Value Stream Compra com Pix do produto Payments. Use como base para detalhar Service Blueprint, eventos, contratos observaveis, riscos e acionamentos.

## 1. Identificacao

| Campo | Conteudo |
| --- | --- |
| Nome da Value Stream | Compra com Pix |
| Produto principal | Payments |
| Produtos relacionados | Checkout, Order Management, Notification Service, Atendimento, Financeiro/Conciliacao |
| Resultado esperado | Cliente seleciona Pix, recebe QR Code/copia e cola, realiza pagamento, tem pagamento confirmado e pedido liberado. |
| Criticidade | Critica |
| Dono de produto | `[PM Payments]` |
| Dono tecnico | `[Tech Lead Payments]` |
| Ultima atualizacao | `[YYYY-MM-DD]` |

## 2. Delimitacao da jornada

| Item | Descricao |
| --- | --- |
| Inicio | Cliente seleciona Pix como meio de pagamento no checkout. |
| Fim | Pedido e liberado no Order Management e cliente recebe confirmacao. |
| Cliente/usuario | Cliente comprador no ecommerce. |
| Sucesso esperado | QR Code gerado, pagamento identificado, confirmacao publicada, pedido liberado e cliente notificado. |
| Falha relevante | Cliente paga, mas pedido nao avanca; QR Code nao e gerado; Pix expira sem clareza; status fica inconsistente. |
| Janela critica | Black Friday, campanhas de alto trafego, horario de pico e releases de Payments/Checkout. |

## 3. Service Blueprint

| Camada | Elementos |
| --- | --- |
| Pontos de contato | Checkout Web/App, tela de pagamento Pix, QR Code, copia e cola, tela de confirmacao, email/push/WhatsApp. |
| Acoes do cliente | Seleciona Pix, confirma compra, copia/escaneia QR Code, paga no banco, aguarda confirmacao. |
| Acoes de negocio | Criar intencao de pagamento, reservar pedido, gerar QR Code, aguardar liquidacao, confirmar pagamento, liberar pedido. |
| Eventos de dominio | `PagamentoIniciado`, `PixQRCodeGerado`, `PixPago`, `PagamentoConfirmado`, `PedidoLiberado`, `PagamentoExpirado`, `PagamentoFalhou`. |
| Sistemas e dependencias | Checkout, Payments API, Pix Provider, Payments DB, Message Broker, Order Management, Notification Service, Observability Stack. |
| Times e acionamentos | Payments, Checkout, Orders, Plataforma/SRE, Atendimento, Financeiro. |

## 4. Fluxo principal

1. Cliente escolhe Pix no checkout.
2. Checkout cria solicitacao em Payments.
3. Payments cria intencao de pagamento.
4. Payments solicita QR Code ao Pix Provider.
5. Pix Provider retorna QR Code e expiracao.
6. Checkout exibe QR Code/copia e cola.
7. Cliente realiza pagamento no banco.
8. Pix Provider envia confirmacao ou Payments consulta status.
9. Payments publica `PagamentoConfirmado`.
10. Order Management consome evento e libera pedido.
11. Notification Service informa cliente.

## 5. Event Storming

| Evento | Causa | Resultado | Sistema produtor | Observabilidade |
| --- | --- | --- | --- | --- |
| `PagamentoIniciado` | Cliente seleciona Pix e confirma compra. | Intencao de pagamento criada. | Checkout/Payments | correlationId, orderId, paymentId, amount, method=Pix |
| `PixQRCodeGerado` | Payments recebe QR Code do provider. | Cliente pode pagar. | Payments | provider, expiration, latency, status |
| `PixQRCodeFalhou` | Provider retorna erro/timeout. | Cliente nao recebe QR Code. | Payments | errorCode, provider, retryable, traceId |
| `PixPago` | Provider informa pagamento realizado. | Payments pode confirmar pagamento. | Pix Provider/Payments | providerEventId, paymentId, paidAt |
| `PagamentoConfirmado` | Payments valida Pix pago. | Orders pode liberar pedido. | Payments | paymentId, orderId, amount, confirmedAt |
| `PedidoLiberado` | Orders processa confirmacao. | Pedido segue para fulfillment. | Order Management | orderId, paymentId, releasedAt |
| `PagamentoExpirado` | QR Code expira sem pagamento. | Cliente precisa nova tentativa. | Payments | expiration, paymentId, orderId |
| `PagamentoFalhou` | Falha inesperada no fluxo. | Jornada entra em erro tratado. | Payments | dependency, errorCode, traceId |

## 6. Observable Business Contract

| Evento | SLI | SLO/limite inicial | Impacto | Resposta | Dono |
| --- | --- | --- | --- | --- | --- |
| `PixQRCodeGerado` | Percentual de QR Codes gerados com sucesso. | 99.5% em ate 3s | Cliente nao consegue pagar com Pix. | Verificar Pix Provider, Payments API e timeout. | Payments |
| `PixPago` | Percentual de pagamentos Pix recebidos pelo Payments apos liquidacao. | 99% em ate 10s apos notificacao provider | Cliente paga e fica sem retorno. | Verificar webhook/consulta provider e fila. | Payments + Financeiro |
| `PagamentoConfirmado` | Percentual de Pix pagos que geram confirmacao. | 99% em ate 30s | Pedido fica parado. | Acionar Payments; verificar consistencia Payments DB. | Payments |
| `PedidoLiberado` | Percentual de pagamentos confirmados refletidos em Orders. | 99% em ate 30s | Cliente pagou, mas pedido nao avancou. | Acionar Orders + Payments; verificar broker/consumer. | Orders + Payments |
| `PagamentoExpirado` | Percentual de expiracoes comunicadas corretamente. | 99% com resposta clara ao cliente | Cliente tenta pagar Pix vencido. | Verificar expiracao e comunicacao Checkout. | Payments + Checkout |

## 7. Matriz de confiabilidade

| No/aresta | Falha possivel | Impacto | Sinal | Acionamento | Runbook |
| --- | --- | --- | --- | --- | --- |
| Checkout -> Payments | Erro ao criar pagamento Pix | Cliente nao inicia pagamento. | 5xx/4xx inesperado em `POST /payments/pix`. | Checkout + Payments | `[link]` |
| Payments -> Pix Provider | Timeout ao gerar QR Code | QR Code nao exibido. | Latencia p95/p99 e taxa de timeout. | Payments + SRE | `[link]` |
| Pix Provider -> Payments | Webhook nao recebido | Pix pago sem confirmacao. | `PixPago` ausente apos provider confirmar. | Payments + Financeiro | `[link]` |
| Payments DB | Estado inconsistente | Status divergente. | paymentId em estado invalido/estagnado. | Payments | `[link]` |
| Payments -> Broker | Evento nao publicado | Orders nao libera pedido. | `PagamentoConfirmado` sem publish/ack. | Payments + Plataforma | `[link]` |
| Broker -> Orders | Consumer parado ou com erro | Pedido nao avanca. | Lag/erro no consumer Orders. | Orders + Plataforma | `[link]` |
| Orders -> Notification | Confirmacao nao notificada | Cliente sem retorno. | `PedidoLiberado` sem notificacao. | Orders + Comunicacao | `[link]` |

## 8. Indicadores e dashboards

| Indicador | Pergunta que responde | Fonte | Dashboard |
| --- | --- | --- | --- |
| Taxa de QR Code Pix gerado | Cliente consegue iniciar Pix? | Payments/Pix Provider | `[link]` |
| Latencia para gerar QR Code | O Pix esta rapido? | Traces/APM | `[link]` |
| Pix pago sem confirmacao | Existe quebra entre provider e Payments? | Eventos/consistencia | `[link]` |
| Pagamento confirmado sem pedido liberado | Existe quebra entre Payments e Orders? | Eventos/Broker | `[link]` |
| Expiracoes de Pix | Clientes estao perdendo a janela de pagamento? | Payments | `[link]` |
| Erros por provider | A dependencia Pix esta degradada? | Metrics/APM | `[link]` |
| Chamados sobre Pix | Cliente esta percebendo falha? | Atendimento | `[link]` |

## 9. Riscos

| Risco | Dimensao | Probabilidade | Impacto | Acao |
| --- | --- | --- | --- | --- |
| Provider Pix instavel em pico. | Tecnologia/Pecas | Media | Alto | Timeout, retry controlado, fallback operacional e alerta acionavel. |
| Cliente paga, mas pedido nao libera. | Cliente/Fluxos | Media | Alto | Contrato `PagamentoConfirmado -> PedidoLiberado` com SLO e reconciliacao. |
| Status divergente entre Payments, Provider e Orders. | Dados | Alta | Alto | Job/consulta de reconciliacao e dashboard de divergencias. |
| QR Code expira sem mensagem clara. | Cliente | Media | Medio | Contrato de expiracao e UX de nova tentativa. |
| Alertas sem contexto de orderId/paymentId. | Time/Dados | Alta | Alto | Logs estruturados com correlationId, paymentId e orderId. |

## 10. Testes e validacoes

| Cenario | Tipo | Resultado esperado |
| --- | --- | --- |
| Criar Pix com payload valido | Starter/One Step | HTTP 201, paymentId e QR Code retornados. |
| Criar Pix com contrato invalido | Explanation/Contract | HTTP 400 com erro de contrato claro. |
| Pix Provider indisponivel | Crash Test Dummy | Erro tratado, alerta, log e sem estado inconsistente. |
| Pix pago e confirmado | End-to-end | `PixPago`, `PagamentoConfirmado`, `PedidoLiberado`. |
| Pix pago sem evento de Orders | Regression | Alerta de confirmacao sem pedido. |
| QR Code expirado | Boundary | Evento `PagamentoExpirado` e resposta clara ao cliente. |

## 11. Runbooks

| Runbook | Quando usar | Link |
| --- | --- | --- |
| Pix QR Code nao gerado | Aumento de erro/timeout na geracao. | `[link]` |
| Pix pago sem confirmacao | Cliente pagou, mas Payments nao confirmou. | `[link]` |
| Pagamento confirmado sem pedido | Orders nao liberou pedido apos confirmacao. | `[link]` |
| Divergencia de status Pix | Provider, Payments e Orders divergem. | `[link]` |

## 12. Links

| Tipo | Link |
| --- | --- |
| Product Deck Payments | `templates/product-deck-payments.md` |
| OpenAPI Payments Pix | `[link]` |
| Dashboard Pix | `[link]` |
| Topicos/eventos | `[link]` |
| Alertas | `[link]` |
| Runbooks | `[link]` |
| Backlog | `[link]` |

## 13. Criterios de pronto

- Service Blueprint revisado com Payments, Checkout, Orders e SRE.
- Eventos principais definidos e publicados no catalogo.
- Observable Business Contract inicial aprovado.
- Dashboard Pix com sucesso, erro, latencia e divergencia.
- Alerta para Pix pago sem confirmacao.
- Runbook minimo para os cenarios criticos.
- Backlog com acoes de confiabilidade priorizadas.
