# Architecture Overview — Payments API

> Update whenever there is a structural change: new module, route, external
> dependency, database table or event topic. See rule in `AGENTS.md`.
>
> Last update: 2026-07-03

## Component Diagram

```mermaid
graph TB
    subgraph Externos["Sistemas Externos"]
        Checkout["Checkout\nWeb / App"]
        Asaas["Asaas\nGateway de Pagamento"]
        Consumer["Consumidor\nWebhook Callback"]
    end

    subgraph API["Payments API — NestJS / Lambda"]
        subgraph Auth["Autenticação"]
            Guard["ApiTokenGuard\nheader: X-Api-Token"]
        end

        subgraph Controllers["Controllers"]
            InvCtrl["InvoiceController\nPOST  /invoices\nDELETE /invoices/:id"]
            WkCtrl["WebhookConfigController\nPOST   /webhooks\nGET    /webhooks\nDELETE /webhooks/:id"]
            AsaasWkCtrl["AsaasWebhookController\nPOST /webhook/payments\nGET  /webhook/payments/queue"]
            SandboxCtrl["AsaasSandboxController\nPOST /sandbox/asaas/payments/:id/confirm"]
        end

        subgraph Services["Services"]
            InvSvc["InvoiceService"]
            WkSvc["WebhookService"]
            WkDelivery["WebhookDeliveryService\n@OnEvent payment.confirmed\n@OnEvent payment.cancelled"]
            ObsListener["ObservabilityListener\n@OnEvent payments.observability"]
            EventBus(["EventEmitter2\n─────────────\npayment.confirmed\npayment.cancelled\npayments.observability"])
        end
    end

    subgraph Storage["Armazenamento — DynamoDB"]
        DynPay[("PaymentsTable\nCustomersTable\nTenantsTable\nProvidersTable")]
        DynWk[("WebhooksTable\nGSI: TenantWebhooksIndex")]
        SQS[("SQS\nWebhookQueue\nDeadLetterQueue")]
    end

    subgraph Obs["Observabilidade"]
        DD["Datadog\nAPM · Métricas · Logs"]
    end

    %% Consumers → API
    Checkout -->|"X-Api-Token"| Guard
    Guard --> InvCtrl
    Guard --> WkCtrl
    Asaas -->|"asaas-access-token"| AsaasWkCtrl

    %% Controllers → Services
    InvCtrl --> InvSvc
    WkCtrl --> WkSvc
    AsaasWkCtrl --> InvSvc
    SandboxCtrl -->|"confirma pagamento\nna Sandbox"| Asaas

    %% Services → Storage
    InvSvc --> DynPay
    InvSvc -->|"POST /v3/payments\nPOST /v3/customers"| Asaas
    InvSvc -->|"async (WEBHOOK_PROCESSING_MODE=async)"| SQS
    WkSvc --> DynWk
    WkDelivery --> DynWk

    %% Internal event bus
    InvSvc -->|"emit"| EventBus
    EventBus -->|"@OnEvent"| WkDelivery
    EventBus -->|"@OnEvent"| ObsListener

    %% Outbound delivery
    WkDelivery -->|"HTTPS POST\nX-Payments-Signature\nX-Payments-Delivery-Id"| Consumer

    %% Observability
    ObsListener --> DD
```

## Structural Changes Requiring Updates to This Diagram

| Type of Change | Examples |
| --- | --- |
| New NestJS Module | `WebhooksModule`, `NotificationsModule` |
| New route or route group | `GET /invoices/:id`, `POST /refunds` |
| New external dependency | New gateway, Notification Service, antifraud |
| New DynamoDB table or index | `NotificationsTable`, new GSI on `PaymentsTable` |
| New event topic or queue | `payment.refunded`, new SQS queue |
| Authentication change in a route | Add/remove guard in controller |

**Does not** require updates: new DTO fields, bugfixes within an existing service, new BDD scenarios without new infrastructure, internal refactors without contract changes.

## Structural Change History

| Date | Change |
| --- | --- |
| 2026-07-03 | Initial diagram creation. Modules: `InvoicesModule`, `AuthModule`, `WebhooksModule`, `ObservabilityModule`. Tables: `PaymentsTable`, `CustomersTable`, `TenantsTable`, `ProvidersTable`, `WebhooksTable`. |
