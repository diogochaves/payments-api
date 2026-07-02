# Integracao Asaas - Referencia para o MVP

Este documento resume os pontos da documentacao tecnica da Asaas usados para os cenarios BDD do MVP. Ele nao substitui a documentacao oficial.

## Autenticacao e ambientes

A Asaas autentica chamadas por API key no header `access_token`, junto de `Content-Type: application/json`. Para contas raiz novas, a documentacao tambem exige `User-Agent` em todas as chamadas.

Ambientes:

- Producao: `https://api.asaas.com/v3`
- Sandbox: `https://api-sandbox.asaas.com/v3`

As chaves de sandbox e producao sao distintas. O gateway deve bloquear configuracao cruzada, por exemplo chave de sandbox em URL de producao.

Fonte: [Autenticacao - Asaas](https://docs.asaas.com/docs/autentica%C3%A7%C3%A3o-1)

## Cliente

Para criar uma cobranca, a Asaas exige que ela seja vinculada a um cliente Asaas pelo campo `customer`.

Endpoint:

```http
POST /v3/customers
```

Campos relevantes:

- `name`
- `cpfCnpj`
- `mobilePhone`
- `email`
- `externalReference`
- `notificationDisabled`

A propria documentacao informa que a API permite clientes duplicados. Portanto, o gateway deve manter uma tabela de vinculo entre cliente Magazine Siará e cliente Asaas, buscar/reutilizar cadastro existente e usar `externalReference`.

Fonte: [Criar novo cliente - Asaas](https://docs.asaas.com/reference/criar-novo-cliente)

## Criar cobranca

Endpoint:

```http
POST /v3/payments
```

Campos centrais:

- `customer`: identificador do cliente no Asaas.
- `billingType`: `BOLETO`, `PIX`, `CREDIT_CARD` ou `UNDEFINED`.
- `value`: valor da cobranca avulsa.
- `dueDate`: vencimento.
- `description`: descricao.
- `externalReference`: identificador da cobranca no sistema de origem.
- `callback`: URLs de redirecionamento quando aplicavel.

Regras importantes:

- Uma unica cobranca nao pode ser criada com dois `billingType` simultaneos.
- Quando o pagador puder escolher a forma de pagamento, usar `UNDEFINED`, desde que os meios estejam habilitados na conta Asaas.
- Para cobranca avulsa de parcela unica, enviar `value`, nao campos de parcelamento.

Fonte: [Criar nova cobranca - Asaas](https://docs.asaas.com/reference/criar-nova-cobranca)

## Confirmacao de pagamento

A confirmacao deve ser dirigida por webhook. Eventos relevantes para o MVP:

- `PAYMENT_CONFIRMED`: cobranca confirmada, pagamento efetuado, saldo ainda nao disponibilizado.
- `PAYMENT_RECEIVED`: cobranca recebida, valor disponivel na conta Asaas.
- `PAYMENT_DELETED`: cobranca removida.
- `PAYMENT_REFUNDED` e `PAYMENT_PARTIALLY_REFUNDED`: estorno total ou parcial.
- `PAYMENT_OVERDUE`: cobranca vencida.

Para o ecommerce, a liberacao do pedido deve acontecer uma unica vez. A recomendacao para o MVP e tratar `PAYMENT_CONFIRMED` como pagamento aprovado para liberacao operacional e `PAYMENT_RECEIVED` como evento financeiro para conciliacao.

Fonte: [Eventos para cobrancas - Asaas](https://docs.asaas.com/docs/webhook-para-cobrancas)

## Seguranca de webhook

Ao configurar o webhook na aplicacao web da Asaas, e possivel definir um token de autenticacao. A Asaas envia esse token no header `asaas-access-token` em todas as chamadas para a aplicacao.

O gateway deve:

- Validar `asaas-access-token` antes de aceitar o payload.
- Responder rapidamente com sucesso apos persistir o evento recebido.
- Processar o efeito do evento de forma assincrona quando possivel.
- Tornar o processamento idempotente pelo par `provider`, `event`, `payment.id` e, se existir, identificador unico do evento.

Fonte: [Criar novo Webhook pela aplicacao web - Asaas](https://docs.asaas.com/docs/criar-novo-webhook-pela-aplicacao-web)

## Cancelamento

Endpoint:

```http
DELETE /v3/payments/{id}
```

Uso esperado:

- Remover cobrancas emitidas incorretamente.
- Cancelar uma cobranca antes de pagamento.
- Substituir uma cobranca por outra com dados corrigidos.

Respostas documentadas: `200`, `400`, `401`, `404`.

O gateway deve validar se a invoice interna ainda permite cancelamento. Depois de pagamento confirmado, cancelamento deve virar fluxo de estorno, fora do escopo do MVP.

Fonte: [Excluir cobranca - Asaas](https://docs.asaas.com/reference/excluir-cobranca)

## Lacunas observadas no codigo atual

- O servico `api/src/infra/asaas.service.ts` chama `/v3/paymentLinks`, mas o fluxo de cobranca do MVP deve usar `/v3/payments`.
- O webhook atual recebe payload em `/webhook/payments`, mas ainda nao valida o header `asaas-access-token`.
- O DTO de webhook contem apenas campos minimos. Para producao, deve preservar o payload bruto ou os campos necessarios para auditoria e conciliacao.
- A criacao de invoice existente em `api/src/modules/invoices` gera eventos internos, mas ainda precisa consolidar contrato externo, persistencia de idempotencia e adaptadores por provedor.

