# Payments API Validation Workbench

Frontend Vite usado como bancada funcional de validação Upstream.

Ele permite montar um carrinho, gerar payloads de invoice, cancelar invoice e
acionar webhooks de confirmação contra a API local. Este diretório não
representa testes técnicos automatizados; ele existe para validar fluxos de
negócio, comportamento de OBCs, integrações, BDDs, UX e contratos antes de uma
capability ser promovida para Downstream.

## Rodando

```sh
cd validation-workbench
npm install
npm run dev
```

Por padrão a tela usa `http://localhost:3011`, o mesmo host usado nos scripts sandbox do backend.

Para subir o backend local compatível com o Validation Workbench:

```sh
cd ../api
./scripts/start-sandbox-api.sh
```

Esse script usa armazenamento em memória e mock do Asaas por padrão.

Para validar contra a Sandbox real da Asaas:

```sh
cd ../api
./scripts/start-asaas-sandbox-real.sh
```

No Workbench, selecione o runtime `Asaas Sandbox real`. Nesse modo, o painel
continua criando invoices pela Payments API, mostra o link de cobrança retornado
pela Asaas e desativa o envio manual de webhook. A confirmação deve vir da
própria Asaas, usando o webhook configurado pelo script.

O botão `Confirmar na Sandbox Asaas` executa a confirmação oficial da Sandbox
pela Payments API local. A chamada fica no backend para manter `ASAAS_TOKEN`
fora do browser:

```text
POST /sandbox/asaas/payments/:providerPaymentId/confirm
```

Na Sandbox da Asaas, criar uma cobrança deixa o pagamento `PENDING`. Para gerar
o webhook de confirmação sem usar a interface web da Asaas, use no backend:

```sh
CONFIRM_SANDBOX_PAYMENT=true ./scripts/create-invoice-sandbox.sh
BILLING_TYPE=CREDIT_CARD CONFIRM_SANDBOX_PAYMENT=true ./scripts/create-invoice-sandbox.sh
```

O painel `Fila de webhook` consulta `GET /webhook/payments/queue` na Payments
API. Com `./scripts/start-asaas-sandbox-real.sh`, o backend sobe LocalStack,
cria SQS/DLQ e inicia um worker local por padrão; nesse caso o painel deve
mostrar `WEBHOOK_QUEUE_URL`, `WEBHOOK_DLQ_URL` e os contadores aproximados. Em
modo sync/memória ele mostra que a fila não está configurada.

## Fluxos

- Criar invoice: `POST /invoices` usando o contrato de `CreateInvoiceDto`, `Idempotency-Key` e `X-Correlation-Id`.
- Cancelar invoice: `DELETE /invoices/:invoiceId` usando `X-Tenant-Id`, `Idempotency-Key` e a invoice criada no primeiro passo.
- Confirmar pagamento: `POST /webhook/payments` com eventos `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED` ou `PAYMENT_OVERDUE` usando a invoice criada e header `asaas-access-token`.
- Visualizar fila: `GET /webhook/payments/queue` para inspecionar modo de
  processamento, URL da fila, URL da DLQ e contadores aproximados.

O JSON da invoice pode ser editado antes do envio. O botão `Sincronizar` recria
o payload a partir do carrinho. Depois que a invoice retorna `OPEN`, os painéis
de cancelamento e confirmação passam a usar `invoiceId`, `providerPaymentId` e
`externalReference` retornados pelo backend.
