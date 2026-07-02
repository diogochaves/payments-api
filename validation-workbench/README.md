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

## Fluxos

- Criar invoice: `POST /invoices` usando o contrato de `CreateInvoiceDto`, `Idempotency-Key` e `X-Correlation-Id`.
- Cancelar invoice: `DELETE /invoices/:invoiceId` usando `X-Tenant-Id`, `Idempotency-Key` e a invoice criada no primeiro passo.
- Confirmar pagamento: `POST /webhook/payments` com eventos `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED` ou `PAYMENT_OVERDUE` usando a invoice criada e header `asaas-access-token`.

O JSON da invoice pode ser editado antes do envio. O botão `Sincronizar` recria
o payload a partir do carrinho. Depois que a invoice retorna `OPEN`, os painéis
de cancelamento e confirmação passam a usar `invoiceId`, `providerPaymentId` e
`externalReference` retornados pelo backend.
