# Payments API Tester

Frontend Vite para montar um carrinho, gerar payloads de invoice, cancelar invoice e acionar webhooks de confirmação contra a API local.

## Rodando

```sh
cd test
npm install
npm run dev
```

Por padrão a tela usa `http://localhost:3011`, o mesmo host usado nos scripts sandbox do backend.

Para subir o backend local compatível com o testador:

```sh
cd ../api
./scripts/start-sandbox-api.sh
```

Esse script usa armazenamento em memória e mock do Asaas por padrão.

## Fluxos

- Criar invoice: `POST /invoices` usando o contrato de `CreateInvoiceDto`, `Idempotency-Key` e `X-Correlation-Id`.
- Cancelar invoice: `DELETE /invoices/:invoiceId` usando `X-Tenant-Id`, `Idempotency-Key` e a invoice criada no primeiro passo.
- Confirmar pagamento: `POST /webhook/payments` com eventos `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED` ou `PAYMENT_OVERDUE` usando a invoice criada e header `asaas-access-token`.

O JSON da invoice pode ser editado antes do envio. O botão `Sincronizar` recria o payload a partir do carrinho. Depois que a invoice retorna `OPEN`, os painéis de cancelamento e confirmação passam a usar `invoiceId`, `providerPaymentId` e `externalReference` retornados pelo backend.
