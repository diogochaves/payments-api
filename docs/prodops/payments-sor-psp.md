# Payments, SOR e PSP

Este documento define a fronteira conceitual entre Payments como produto interno da Magazine Siara e Asaas como provedor externo de meios de pagamento.

## O que e um SOR

`SOR` significa `System of Record`. Em uma arquitetura corporativa, um System of Record e o sistema que mantem a verdade oficial, historica, auditavel e reconciliavel de um dominio de negocio.

No contexto de pagamentos no varejo, um SOR responde com autoridade:

- Qual cobranca pertence a qual pedido.
- Qual cliente, canal, loja ou tenant originou a cobranca.
- Qual provedor executou a transacao.
- Qual identificador externo representa a transacao no provedor.
- Qual e o status interno oficial do pagamento.
- Qual evento confirmou, recebeu, cancelou ou estornou o pagamento.
- Qual valor foi cobrado, recebido, cancelado, estornado ou conciliado.
- Qual historico de transicoes levou ao estado atual.

Um SOR de Payments nao deve depender do vocabulário de um unico provedor. Ele normaliza diferentes status externos para um modelo interno comum.

Exemplo:

| Provedor | Evento/status externo | Status canonico Payments |
| --- | --- | --- |
| Asaas | `PAYMENT_CONFIRMED` | `CONFIRMED` |
| Asaas | `PAYMENT_RECEIVED` | `RECEIVED` |
| Asaas | `PAYMENT_DELETED` | `CANCELLED` |
| Itau | Status equivalente de pagamento confirmado | `CONFIRMED` |

## O que e um PSP

`PSP` significa `Payment Service Provider`. Na industria de meios de pagamento, um PSP e um provedor que oferece servicos para aceitar, processar, emitir ou gerenciar pagamentos.

Um PSP pode oferecer capacidades como:

- Criacao de cobrancas.
- Geração de boleto, Pix, link de pagamento ou checkout.
- Processamento de pagamento com cartao, Pix, boleto ou outros meios.
- Notificacao de eventos por webhook.
- APIs de consulta, cancelamento, estorno e conciliacao.
- Identificadores externos de transacao, cobranca, pagamento ou recebivel.

O PSP executa a transacao dentro da infraestrutura dele. Ele nao deve ser a fonte oficial da verdade operacional da empresa varejista.

## Payments como SOR

Para a Magazine Siara, Payments deve ser o `System of Record for Payments`.

Isso significa que Payments e o produto interno responsavel por manter o registro canonico de cobrancas, pagamentos, confirmacoes, cancelamentos, estornos, recebimentos e conciliacao financeira associados aos pedidos do ecommerce.

Payments deve ser dono de:

- `invoiceId` interno.
- `orderId` do ecommerce.
- `tenantId`, canal, loja ou unidade de negocio.
- `customerId` interno.
- Provedor escolhido para a execucao.
- `providerPaymentId` retornado pelo provedor.
- `externalReference` usado para conciliacao.
- Estados internos como `CREATED`, `PROVIDER_PENDING`, `OPEN`, `CONFIRMED`, `RECEIVED`, `CANCELLED` e `FAILED`.
- Idempotencia por comando.
- Historico de eventos e transicoes.
- Regras de liberacao operacional para Order Management.
- Eventos canonicos publicados para outros dominios.

Do ponto de vista de varejo, Payments protege:

- Conversao do checkout.
- Liberacao correta de pedidos.
- Rastreabilidade para atendimento.
- Conciliacao financeira.
- Independencia de provedores.
- Capacidade de fallback e multi-provider.

## Asaas como PSP

Asaas e um PSP. No desenho da Magazine Siara, ele e uma integracao externa usada por Payments para executar parte do ciclo de vida de uma cobranca.

Asaas e responsavel por:

- Cadastrar cliente no contexto Asaas via `POST /v3/customers`.
- Criar cobranca via `POST /v3/payments`.
- Gerar dados de pagamento, como URL de invoice, Pix ou boleto, conforme o meio usado.
- Manter o status externo da cobranca dentro do Asaas.
- Enviar webhooks, como `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED` e `PAYMENT_DELETED`.
- Cancelar ou remover cobrancas via `DELETE /v3/payments/{id}`.

Asaas nao deve ser dono de:

- Status oficial do pedido na Magazine Siara.
- Regra de liberacao do pedido.
- Modelo canonico de pagamento da empresa.
- Estrategia de roteamento entre provedores.
- Idempotencia interna do ecommerce.
- Historico corporativo final de conciliacao.

## Fronteira correta

```text
Ecommerce / Checkout / OMS
        |
        | contrato interno da Magazine Siara
        v
Payments API / Payments SOR
        |
        | contrato externo do PSP
        v
Asaas / Itau / outros provedores
```

O ecommerce nao deve falar diretamente com Asaas para criar cobrancas no desenho alvo. O ecommerce deve solicitar uma invoice ao Payments.

Payments decide o provedor, persiste a verdade interna, chama o PSP, normaliza a resposta e publica eventos para o restante da operacao.

## Exemplo de traducao

Quando o ecommerce chama:

```http
POST /invoices
```

Ele esta falando com Payments, o SOR interno.

Quando Payments chama:

```http
POST /v3/payments
```

Ele esta usando Asaas como PSP.

Quando Asaas retorna:

```json
{
  "id": "pay_ep211nodg0fklw20",
  "status": "PENDING",
  "invoiceUrl": "https://sandbox.asaas.com/i/..."
}
```

Payments traduz isso para:

```json
{
  "invoiceId": "inv_...",
  "orderId": "MS-100045",
  "provider": "ASAAS",
  "providerPaymentId": "pay_ep211nodg0fklw20",
  "status": "OPEN"
}
```

Para o negocio, a fonte oficial passa a ser o status `OPEN` em Payments, nao o status bruto `PENDING` do Asaas.

## Definicao objetiva

Payments e o SOR de pagamentos da Magazine Siara: o sistema interno que registra e governa a verdade oficial, auditavel e reconciliavel dos pagamentos associados aos pedidos.

Asaas e um PSP: o provedor externo usado por Payments para executar cobrancas, receber eventos de pagamento e operar meios como Pix, boleto e outros metodos suportados.

