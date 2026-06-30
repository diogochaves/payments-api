# Payments API Tester

Frontend Vite para montar um carrinho, gerar payloads de pagamento e enviar requisições para a API local.

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

- `POST /invoices`: usa o contrato de `CreateInvoiceDto` e envia `Idempotency-Key`.
- `POST /payments`: usa o contrato de `CreatePaymentDto`.

O JSON pode ser editado antes do envio. O botão `Sincronizar` recria o payload a partir do carrinho.
