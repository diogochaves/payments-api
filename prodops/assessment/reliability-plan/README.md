# Reliability Plan - Payments Release

> Documento gerado a partir de `prodops/assessment/reliability-plan/setup/reliability-plan.prompt.md`.
> Entrada principal: `prodops/assessment/iteration-plan.md`.

## Executive Summary

Este Reliability Plan considera exclusivamente as funcionalidades do Iteration Plan cuja decisao e exatamente `Entrou`. Pela regra do prompt, ficam fora deste plano os itens marcados como `Entrou como MVP`, `Dividida`, `Adiada` ou `Saiu`.

O escopo aprovado para a Release, portanto, e composto por: habilitar o novo gateway para o Checkout na jornada priorizada, criar invoice via Pix e confirmar pagamento. A API ja possui implementacao relevante para criacao de invoice, integracao Asaas, idempotencia, confirmacao por webhook, deduplicacao de evento e eventos observaveis. A suite de aceitacao em memoria foi executada anteriormente com 19 testes passando.

Os maiores riscos de confiabilidade para esse escopo aprovado estao na diferenca entre caminho local e caminho de producao, na Feature Flag do Checkout documentada como bloqueada por bug e em divergencias de documentacao que podem fazer Checkout, Asaas ou operacao configurarem contratos incorretos. A correlacao de webhook em Dynamo por `providerPaymentId` e `externalReference` foi implementada em 2026-06-30 e passa a ter cobertura de aceitacao com `DYNAMO_MOCK`.

## Funcionalidades consideradas

| Funcionalidade | Decisao no Iteration Plan | Evidencia |
| --- | --- | --- |
| Habilitar novo gateway para o Checkout na jornada priorizada | Entrou | `prodops/assessment/iteration-plan.md`, linha da tabela "Iteration Plan recomendado". |
| Criar invoice via Pix | Entrou | `prodops/assessment/iteration-plan.md`; `prodops/current-state/features/create-invoice.feature`; `InvoiceController.createInvoice`; `InvoiceService.createInvoice`. |
| Confirmacao de pagamento | Entrou | `prodops/assessment/iteration-plan.md`; `prodops/current-state/features/payment-confirmation.feature`; `AsaasWebhookController`; `InvoiceService.processProviderWebhook`. |

Itens explicitamente ignorados por nao terem decisao exatamente `Entrou`: `Notificacao de status de pagamento` (`Entrou como MVP`), `Criar invoice via Boleto` (`Dividida`), `Cancelar invoice pendente` (`Adiada`), `Integracao corporativa de incidentes/ITSM` (`Saiu`) e `Gateway fallback/Itau` (`Saiu`).

## Estado atual

| Funcionalidade | Implementacao existente | Dependencias | Estado de confiabilidade |
| --- | --- | --- | --- |
| Habilitar novo gateway para o Checkout na jornada priorizada | Nao ha implementacao de Feature Flag neste repositorio; Premortem informa que o Checkout esta preparado, mas a flag segue desabilitada por bug. | Checkout, Feature Flag, contrato Checkout -> Payments, Payments API. | Dependencia externa critica e ainda nao evidenciada como pronta. |
| Criar invoice via Pix | `POST /invoices` recebe `CreateInvoiceDto`, exige `Idempotency-Key`, resolve provider, cria cliente/cobranca Asaas e atualiza invoice para `OPEN`. | Asaas `/customers`, Asaas `/payments`, Payments DB, customer binding. | Implementado e coberto por testes em memoria; caminho Dynamo e timeout de provider ainda fragilizam a confiabilidade. |
| Confirmacao de pagamento | `POST /webhook/payments` valida token quando configurado, persiste evento bruto, deduplica e processa `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED` e `PAYMENT_OVERDUE`. | Webhook Asaas, `ASAAS_WEBHOOK_TOKEN`, Payments DB, evento canonico `payment.confirmed`. | Regras cobertas em memoria e em Dynamo mock para correlacao por `providerPaymentId` e `externalReference`; webhook nao correlacionado emite evento observavel. |

**Inconsistencias relevantes para o escopo aprovado**

| Funcionalidade | Inconsistencia | Evidencia | Risco |
| --- | --- | --- | --- |
| Habilitar novo gateway para o Checkout na jornada priorizada | Documentos antigos podem orientar Checkout para contrato divergente. | `docs/payment-gateway-mvp.md` cita outros caminhos; codigo usa `POST /invoices`. | Checkout integrar endpoint incorreto. |
| Criar invoice via Pix | ODD antigo referencia `/payments` e Asaas `/v3/paymentLinks`; codigo usa `/invoices` e `/v3/payments`. | `api/odd/create_invoice.yaml`; `AsaasService.createCharge`. | Observabilidade/contrato medir dependencia errada. |
| Confirmacao de pagamento | Documento antigo descreve webhook em `/webhooks/asaas/payments`; codigo usa `/webhook/payments`. | `docs/payment-gateway-mvp.md`; `AsaasWebhookController`. | Webhook Asaas configurado em URL incorreta. |

## Principais riscos

| Funcionalidade | Risco | Impacto | Probabilidade | Criticidade |
| --- | --- | --- | --- | --- |
| Habilitar novo gateway para o Checkout na jornada priorizada | Feature Flag segue bloqueada por bug documentado no Premortem. | Release nao ativa ou ativa sem previsibilidade. | Alta | Critica |
| Habilitar novo gateway para o Checkout na jornada priorizada | Contrato Checkout -> Payments pode divergir do endpoint real. | Checkout falha ao criar invoice apos ativacao da flag. | Media | Alta |
| Habilitar novo gateway para o Checkout na jornada priorizada | Falta evidencia neste repo de criterio de rollback para pedidos iniciados com gateway novo. | Pedidos ficam presos entre fluxo antigo e novo. | Media | Alta |
| Criar invoice via Pix | Testes atuais usam `INVOICE_REPOSITORY=memory`; persistencia Dynamo pode divergir. | Invoice criada localmente pode falhar no ambiente de Release. | Alta | Critica |
| Criar invoice via Pix | Timeout transiente marca invoice como `FAILED` com chave de idempotencia ja salva. | Retry seguro pode retornar estado falho sem recriar cobranca. | Media | Alta |
| Criar invoice via Pix | `AsaasService` nao define timeout explicito no client axios. | Chamada externa pode consumir janela da Lambda e degradar checkout. | Media | Alta |
| Criar invoice via Pix | Documentacao/ODD divergente sobre endpoint e provider operation. | Time mede ou integra rota/dependencia errada. | Media | Alta |
| Confirmacao de pagamento | Consultas Dynamo por `providerPaymentId` e `externalReference` precisam ser validadas contra tabela/indices reais do ambiente. | Pagamento confirmado pode nao atualizar invoice se o indice real divergir do modelo testado. | Media | Alta |
| Confirmacao de pagamento | Webhook nao correlacionado retorna sucesso tecnico e depende de consumo operacional do evento observavel. | Evento pago pode ficar invisivel se nao houver monitoramento sobre o sinal emitido. | Media | Alta |
| Confirmacao de pagamento | Evento canonico e emitido por `EventEmitter2` local; nao ha evidencia de publicacao duravel no repo. | Confirmacao pode nao chegar a consumidores fora do processo. | Media | Alta |
| Confirmacao de pagamento | `ASAAS_WEBHOOK_TOKEN` so e exigido quando configurado. | Ambiente mal configurado pode aceitar webhook sem validacao. | Media | Alta |

## Analise por funcionalidade

### Habilitar novo gateway para o Checkout na jornada priorizada

**Riscos**

- Premortem informa que o Checkout esta preparado, mas a ativacao segue desabilitada por Feature Flag devido a bug localizado.
- A Feature Flag e dependencia fora deste repositorio; a API pode estar funcional e a Release ainda nao estar pronta.
- Documentacao divergente pode causar integracao com endpoint errado.
- Falta evidencia de politica para pedidos criados durante ativacao e depois rollback.

**Dependencias**

- Checkout.
- Sistema de Feature Flag.
- Contrato real `POST /invoices`.
- Identificadores de correlacao enviados pelo Checkout: `Idempotency-Key` e `X-Correlation-Id`.

**Pontos de atencao**

- A prontidao da Release depende da flag e do contrato do consumidor, nao apenas da API.
- O Premortem classifica a ativacao do gateway como risco central.
- Este plano nao inclui Notification, Boleto ou cancelamento porque nao possuem decisao exatamente `Entrou`.

**Recomendacoes**

- Definir readiness tecnico da Feature Flag para esta jornada: estado inicial, criterios de ativacao, criterio de rollback e dono da decisao.
- Atualizar o contrato exposto ao Checkout para refletir o endpoint real e headers obrigatorios.
- Registrar evidencia de ativacao/desativacao da flag em ambiente controlado antes da Release.

### Criar invoice via Pix

**Riscos**

- Implementacao em memoria esta coberta, mas Dynamo ainda precisa ser validado para o mesmo fluxo.
- Retry de falha transiente pode ficar preso em invoice `FAILED` associada a mesma idempotency key.
- `AsaasService` usa axios sem timeout explicito.
- O contrato aceita outros `billingType`, mas a funcionalidade aprovada aqui e Pix; dados de Boleto nao devem ser usados como evidencia de prontidao de Pix.

**Dependencias**

- Asaas `/customers`.
- Asaas `/payments`.
- Payments DB.
- Customer provider link.
- Checkout enviando payload Pix e idempotency key.

**Pontos de atencao**

- `InvoiceService.createInvoice` salva a invoice antes da chamada ao provider, o que ajuda auditoria.
- `assertProviderChargeContract` reduz risco de sucesso falso quando o provider responde sem dados essenciais.
- Eventos observaveis do fluxo Pix ja possuem `correlationId`, `orderId`, `invoiceId`, provider e etapa.

**Recomendacoes**

- Validar o fluxo Pix com a mesma persistencia prevista para a Release.
- Definir comportamento confiavel para retry de falha transiente com idempotency key ja persistida.
- Configurar timeout explicito e erro classificado para chamadas ao Asaas.
- Atualizar ODD/documentacao de Pix para usar `/invoices` e `/v3/payments`.

### Confirmacao de pagamento

**Riscos**

- `findByProviderPaymentId` e `findByExternalReference` funcionam em memoria e possuem implementacao/cobertura com Dynamo mock.
- `processProviderWebhook` pode responder sucesso tecnico quando nao encontrou invoice, mas agora emite evento observavel especifico de nao correlacao.
- `PAYMENT_RECEIVED` atualiza para `RECEIVED`; precisa preservar a regra de nao republicar confirmacao.
- `payment.confirmed` e emitido via EventEmitter local; nao ha durabilidade evidenciada para consumidores externos.
- Token de webhook depende de configuracao de ambiente.

**Dependencias**

- Asaas webhook.
- `ASAAS_WEBHOOK_TOKEN`.
- Payments DB.
- Indices de consulta por provider payment e referencia externa.
- Evento canonico `payment.confirmed`.

**Pontos de atencao**

- Testes cobrem webhook autenticado, invalido, duplicado, `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE` e correlacao por `externalReference`.
- A cobertura atual e forte para regra de dominio, mas insuficiente para o modo Dynamo.
- Confirmacao e funcionalidade aprovada como `Entrou`; qualquer iniciativa aqui precisa parar na confiabilidade da confirmacao, sem planejar notificacao.

**Recomendacoes**

- Validar consultas Dynamo para encontrar invoice por `providerPaymentId` e `externalReference` contra tabela/indices reais do ambiente.
- Conectar o evento de webhook nao correlacionado a dashboard/alerta operacional e definir reprocessamento.
- Definir mecanismo duravel ou limite explicito do evento canonico `payment.confirmed`.
- Exigir token de webhook em ambientes de Release e falhar configuracao insegura.

## Reliability Roadmap

| Funcionalidade | Iniciativa | Objetivo | Prioridade | Risco mitigado | Esforco | Dependencias |
| --- | --- | --- | --- | --- | --- | --- |
| Habilitar novo gateway para o Checkout na jornada priorizada | Readiness tecnico da Feature Flag | Confirmar que a flag permite ativacao, rollback e rastreabilidade da jornada aprovada. | P0 | Flag bloqueada por bug ou rollback inconsistente. | Medio | Checkout, sistema de Feature Flag, Payments. |
| Habilitar novo gateway para o Checkout na jornada priorizada | Sincronizar contrato Checkout -> Payments | Garantir que Checkout use `POST /invoices`, `Idempotency-Key` e `X-Correlation-Id`. | P0 | Integracao com endpoint/header incorreto. | Baixo | Checkout, docs tecnicos, API Payments. |
| Habilitar novo gateway para o Checkout na jornada priorizada | Evidenciar politica para pedidos durante rollback | Definir o que acontece com pedidos ja iniciados no gateway novo quando a flag desligar. | P0 | Pedido preso entre fluxo antigo e novo. | Medio | Checkout, Payments, operacao de release. |
| Criar invoice via Pix | Validar fluxo Pix no modo Dynamo | Garantir que criacao, idempotencia e leitura de invoice funcionem na persistencia da Release. | P0 | Testes em memoria mascararem falha de persistencia. | Medio | DynamoService, PaymentsTable, ambiente local/homologacao. |
| Criar invoice via Pix | Definir politica de retry para falha transiente | Evitar que timeout de provider transforme retry seguro em retorno permanente de `FAILED`. | P0 | Cliente/Checkout sem recuperacao apos erro transiente. | Medio | InvoiceService, idempotencia, regra de estados. |
| Criar invoice via Pix | Configurar timeout explicito para Asaas | Evitar que chamadas externas consumam a janela da Lambda e degradem Checkout. | P1 | Latencia alta e falha em cascata. | Baixo | AsaasService, configuracao de ambiente. |
| Criar invoice via Pix | Corrigir documentacao/ODD do fluxo Pix | Alinhar endpoint real `/invoices` e provider operation `/v3/payments`. | P1 | Observabilidade ou integracao medindo dependencia errada. | Baixo | Docs, ODD, Payments. |
| Criar invoice via Pix | Dashboard minimo de criacao Pix | Expor sucesso, erro e latencia das etapas de criacao aprovadas. | P1 | Baixa visibilidade sobre falha de criacao Pix. | Medio | Eventos `payments.observability`, DataDog/APM. |
| Confirmacao de pagamento | Implementar consulta Dynamo por `providerPaymentId` | Permitir que webhook encontre invoice no ambiente persistente. | P0 | Pagamento confirmado sem atualizacao interna. | Medio | `ProviderPaymentIndex`, InvoiceRepository. |
| Confirmacao de pagamento | Implementar consulta Dynamo por `externalReference` | Suportar webhook que chega antes da consolidacao do provider payment id. | P0 | Evento antecipado nao correlacionado. | Medio | Modelo Dynamo, indice por pedido/referencia. |
| Confirmacao de pagamento | Cobrir webhook com repositorio Dynamo/local mock | Validar confirmacao, deduplicacao e correlacao no caminho de persistencia da Release. | P0 | Falsa seguranca dos testes em memoria. | Medio | DynamoService, LocalStack ou `DYNAMO_MOCK`. |
| Confirmacao de pagamento | Evento observavel para webhook nao correlacionado | Dar sinal claro quando o provider envia pagamento sem invoice encontrada. | P0 | Evento pago invisivel operacionalmente. | Baixo | InvoiceService, eventos observaveis. |
| Confirmacao de pagamento | Validar configuracao obrigatoria do token de webhook | Impedir ambiente de Release aceitando webhook sem `ASAAS_WEBHOOK_TOKEN`. | P0 | Falha de seguranca por configuracao ausente. | Baixo | ConfigModule, ambiente de deploy. |
| Confirmacao de pagamento | Definir durabilidade do evento `payment.confirmed` | Garantir que a confirmacao aprovada nao dependa apenas de listener local sem persistencia. | P1 | Perda de evento canonico em restart/falha de processo. | Medio/alto | EventEmitter atual, broker futuro ou decisao arquitetural. |
| Confirmacao de pagamento | Dashboard minimo de confirmacao | Expor webhooks recebidos, confirmados, duplicados, invalidos e nao correlacionados. | P1 | MTTR alto em falha de confirmacao. | Medio | Eventos de webhook, DataDog/APM. |

## Quick Wins

| Funcionalidade | Melhoria | Beneficio | Esforco |
| --- | --- | --- | --- |
| Habilitar novo gateway para o Checkout na jornada priorizada | Criar checklist curto de readiness da Feature Flag. | Alinha criterio de ativacao e rollback entre Checkout e Payments. | Baixo |
| Habilitar novo gateway para o Checkout na jornada priorizada | Atualizar documentacao do consumidor com `POST /invoices`. | Reduz risco de integracao incorreta. | Baixo |
| Criar invoice via Pix | Registrar no release trail o resultado de `npm run test:acceptance`. | Cria evidencia objetiva da base funcional atual. | Baixo |
| Criar invoice via Pix | Adicionar timeout configuravel no axios do Asaas. | Reduz risco de chamada externa longa. | Baixo |
| Criar invoice via Pix | Remover referencias do ODD a `/v3/paymentLinks`. | Evita dashboard/dependencia errada para Pix. | Baixo |
| Confirmacao de pagamento | Emitir evento observavel quando webhook nao encontra invoice. | Torna falha critica visivel rapidamente. | Baixo |
| Confirmacao de pagamento | Falhar startup/deploy quando token de webhook estiver ausente em ambiente nao local. | Evita configuracao insegura. | Baixo |
| Confirmacao de pagamento | Documentar chaves de correlacao do webhook: `providerPaymentId` e `externalReference`. | Facilita diagnostico e alinhamento com Asaas. | Baixo |

## Backlog futuro

Estas melhorias estao relacionadas a funcionalidades que nao fazem parte desta Release porque nao possuem decisao exatamente `Entrou` no Iteration Plan.

- `Notificacao de status de pagamento` (`Entrou como MVP`): planejar contrato Payments -> Notification, deduplicacao ponta a ponta, status de entrega e alertas de confirmacao sem comunicacao ao cliente quando houver nova decisao `Entrou`.
- `Criar invoice via Boleto` (`Dividida`): criar criterios especificos de Boleto, retorno de linha digitavel/URL, mensagens ao cliente e testes de contrato quando a parte de Boleto for aprovada.
- `Cancelar invoice pendente` (`Adiada`): retomar hardening de cancelamento, webhook `PAYMENT_DELETED`, reconciliacao 404 e concorrencia com confirmacao quando entrar em Release.
- `Integracao corporativa de incidentes/ITSM` (`Saiu`): planejar integracao DataDog/APM com ITSM em iniciativa propria.
- `Gateway fallback/Itau` (`Saiu`): planejar roteamento/fallback multi-provedor apenas quando houver decisao de negocio e contrato tecnico aprovado.

## Premissas

- A palavra `Entrou` foi interpretada de forma estrita conforme o prompt. `Entrou como MVP` nao foi considerado no escopo deste Reliability Plan.
- O escopo tecnico desta Release ficou restrito a tres funcionalidades: habilitar gateway no Checkout, criar invoice via Pix e confirmar pagamento.
- A persistencia pretendida para Release e Dynamo, pois o repositorio possui `INVOICE_REPOSITORY=dynamo` e infraestrutura `PaymentsTable`.
- Checkout e Feature Flag ficam fora deste repositorio, mas sao dependencias diretas da funcionalidade aprovada de habilitacao do gateway.
- A suite de aceitacao atual usa repositorio em memoria e Asaas stub; ela valida regras de dominio, mas nao prova confiabilidade em Dynamo.
- As iniciativas deste documento nao alteram o Iteration Plan e nao adicionam novas funcionalidades de negocio.

## Fontes consultadas

- `prodops/assessment/iteration-plan.md`
- `prodops/assessment/premortem.md`
- `prodops/assessment/reliability-plan/risks.md`
- `prodops/current-state/service-decks/compra-com-pix.md`
- `prodops/current-state/features/create-invoice.feature`
- `prodops/current-state/features/payment-confirmation.feature`
- `api/src/modules/invoices/controllers/invoice.controller.ts`
- `api/src/modules/invoices/controllers/asaas-webhook.controller.ts`
- `api/src/modules/invoices/services/invoice.service.ts`
- `api/src/modules/invoices/services/invoice-repository.service.ts`
- `api/src/infra/asaas.service.ts`
- `api/infra/dynamodb.yaml`
- `api/test/create-invoice.acceptance.e2e-spec.ts`
