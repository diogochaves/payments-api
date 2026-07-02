# Documentacao BDD - Gateway de Pagamentos Magazine Siará

Esta pasta descreve o comportamento esperado da versao 1 do MVP do Gateway de Pagamentos do ecommerce Magazine Siará.

O objetivo e tirar a plataforma de uma dependencia direta da API do Itaú e introduzir uma camada de gateway capaz de rotear pagamentos para provedores diferentes. No MVP, o Itaú continua como provedor ja existente e o Asaas entra como segundo provedor habilitado.

## Escopo do MVP

- Criar invoice/cobranca.
- Receber confirmacao de pagamento.
- Cancelar invoice/cobranca.

## Documentos

- [Visao do gateway](./payment-gateway-mvp.md)
- [Notas de integracao Asaas](./asaas-integration.md)
- [Feature: Criar invoice](./features/create-invoice.feature)
- [Feature: Confirmacao de pagamento](./features/payment-confirmation.feature)
- [Feature: Cancelamento](./features/cancel-invoice.feature)

## Principios de mercado adotados

- Contrato unico para o ecommerce, independente do provedor de pagamento.
- Idempotencia em comandos de criacao, cancelamento e processamento de webhook.
- Conciliacao por `externalReference`, `orderId`, `invoiceId` e identificadores do provedor.
- Webhook como fonte preferencial para confirmacao de pagamento.
- Persistencia de estado interno antes e depois da chamada ao provedor.
- Observabilidade por logs estruturados, metricas e trilha de auditoria.
- Reprocessamento seguro de eventos, sem duplicar cobrancas nem liberar pedido duas vezes.
- Segredos fora do codigo e separados por ambiente.

## Glossario

- Ecommerce: plataforma Magazine Siará que solicita cobrancas e recebe status de pagamento.
- Gateway: API interna de pagamentos que padroniza contratos, estado e roteamento.
- Provedor: integracao externa responsavel por emitir ou processar a cobranca, como Itaú ou Asaas.
- Invoice: representacao interna de uma cobranca a pagar.
- Payment: pagamento confirmado, recebido, cancelado, estornado ou recusado.
- PSP: Payment Service Provider.
- Idempotency key: chave unica enviada pelo chamador para impedir duplicidade em retentativas.

