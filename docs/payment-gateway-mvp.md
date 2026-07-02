# Gateway de Pagamentos - MVP BDD

## Objetivo

Construir uma API de pagamentos para o ecommerce Magazine Siará que padronize criacao, confirmacao e cancelamento de invoices, removendo o acoplamento direto do ecommerce com a API do Itaú e preparando a operacao para multiplos provedores.

## Contexto atual

Hoje a plataforma depende diretamente do Itaú. No MVP, o gateway deve aceitar comandos do ecommerce, escolher o provedor configurado e persistir o estado da invoice antes de chamar o provedor externo.

O Asaas sera o segundo provedor habilitado. O Itaú deve ser mantido por compatibilidade, mas acessado pelo gateway, nao diretamente pela plataforma no desenho alvo.

## Capacidades da versao 1

| Capacidade | Resultado esperado |
| --- | --- |
| Criar invoice | Gateway cria uma cobranca no provedor selecionado e retorna identificadores, status e dados de pagamento. |
| Confirmar pagamento | Gateway recebe webhook/confirmacao do provedor, atualiza estado interno e publica evento para o ecommerce. |
| Cancelar invoice | Gateway cancela uma cobranca pendente no provedor e atualiza estado interno. |

## Estados internos da invoice

| Estado | Significado |
| --- | --- |
| `CREATED` | Invoice registrada internamente. |
| `PROVIDER_PENDING` | Chamada ao provedor iniciada. |
| `OPEN` | Cobranca criada no provedor e aguardando pagamento. |
| `CONFIRMED` | Pagamento confirmado pelo provedor. |
| `RECEIVED` | Valor recebido/disponivel quando o provedor diferenciar confirmacao e recebimento. |
| `CANCEL_REQUESTED` | Cancelamento solicitado. |
| `CANCELLED` | Cobranca cancelada/removida no provedor. |
| `FAILED` | Falha permanente ou nao recuperavel. |

## Contrato canonico recomendado

### Criar invoice

```http
POST /invoices
Idempotency-Key: <uuid ou orderId:evento>
Content-Type: application/json
```

```json
{
  "orderId": "MS-100045",
  "customer": {
    "id": "customer-123",
    "name": "Maria Silva",
    "document": "12345678909",
    "email": "maria@example.com",
    "mobilePhone": "11999999999"
  },
  "amount": 159.9,
  "currency": "BRL",
  "dueDate": "2026-06-20",
  "billingType": "PIX",
  "description": "Pedido MS-100045",
  "provider": "ASAAS"
}
```

Resposta:

```json
{
  "invoiceId": "inv_01J...",
  "orderId": "MS-100045",
  "provider": "ASAAS",
  "providerPaymentId": "pay_...",
  "status": "OPEN",
  "amount": 159.9,
  "currency": "BRL",
  "paymentUrl": "https://...",
  "externalReference": "MS-100045"
}
```

### Confirmacao de pagamento

Entrada do provedor:

```http
POST /webhooks/asaas/payments
asaas-access-token: <token configurado>
```

Saida para o ecommerce:

```json
{
  "event": "payment.confirmed",
  "invoiceId": "inv_01J...",
  "orderId": "MS-100045",
  "provider": "ASAAS",
  "providerPaymentId": "pay_...",
  "status": "CONFIRMED",
  "confirmedAt": "2026-06-16T10:15:30-03:00"
}
```

### Cancelar invoice

```http
POST /invoices/{invoiceId}/cancel
Idempotency-Key: <uuid ou orderId:cancel>
Content-Type: application/json
```

```json
{
  "reason": "CUSTOMER_REQUESTED",
  "requestedBy": "ecommerce"
}
```

Resposta:

```json
{
  "invoiceId": "inv_01J...",
  "orderId": "MS-100045",
  "provider": "ASAAS",
  "status": "CANCELLED"
}
```

## Regras de roteamento

- Se o request informar `provider`, o gateway deve usar esse provedor quando estiver habilitado para o tenant/canal.
- Se o request nao informar `provider`, o gateway deve usar regra configurada: inicialmente `ITAU` como padrao e `ASAAS` por feature flag, percentual, tenant ou tipo de pagamento.
- Se o provedor selecionado estiver indisponivel antes da criacao, o gateway pode tentar outro provedor apenas se a regra de negocio permitir e se nenhuma cobranca tiver sido criada.
- Depois que uma cobranca for criada em um provedor, todos os comandos seguintes da mesma invoice devem usar o mesmo provedor.

## Requisitos nao funcionais

- Idempotencia: repetir o mesmo comando com a mesma chave deve retornar o mesmo resultado sem criar nova cobranca.
- Consistencia: webhook duplicado ou fora de ordem nao pode regredir estado.
- Auditoria: salvar payload de entrada, payload normalizado, resposta do provedor e transicoes de estado.
- Observabilidade: logs com `correlationId`, `invoiceId`, `orderId`, `provider` e `providerPaymentId`.
- Resiliencia: timeouts curtos, retry com backoff para falhas transientes e fila de reprocessamento para webhooks.
- Seguranca: segredos em variaveis/secret manager, TLS, validacao de token de webhook e mascaramento de dados sensiveis.
- Compliance: reduzir exposicao de dados de cartao; para cartao, preferir tokenizacao/checkout do provedor se aplicavel.

## Definition of Ready

- Contrato de API aprovado pelo ecommerce.
- Provedor selecionado e habilitado por configuracao.
- Credenciais de sandbox configuradas fora do repositorio.
- Webhook do provedor apontando para ambiente de homologacao.
- Criterios de idempotencia definidos por operacao.

## Definition of Done

- Cenarios BDD automatizados ou mapeados para testes de contrato.
- Criacao, confirmacao e cancelamento persistem transicoes de estado.
- Logs e metricas permitem rastrear uma invoice de ponta a ponta.
- Webhook invalido e webhook duplicado sao rejeitados/tratados sem efeito colateral.
- Fluxos Asaas validados em sandbox.

