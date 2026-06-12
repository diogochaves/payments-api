# Diagrama de Sequência de Eventos - Create Invoice

## Cenário 1: Cliente Encontrado (Happy Path)

```
┌─────────────────────────────────────────────────────────────────────┐
│ POST /invoices {customerId: "cust_found", amount: 1000}             │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ╔═══════════════════════════════════════════════════════════╗
        ║ InvoiceService.createInvoice()                            ║
        ║ TOUCHPOINT 1: checkout_payment_completed                 ║
        ╚═══════════════════════════════════════════════════════════╝
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     │                     │
  ┌───────────────────┐      │              ┌──────────────────────┐
  │ STEP 1: Emit      │      │              │                      │
  │ PAYMENT_INTENTION │      │              │                      │
  │ _RECEIVED         │      │              │                      │
  │ (coadjuvant)      │      │              │                      │
  │                   │      │              │                      │
  │ Payload:          │      │              │                      │
  │ - amount: 1000    │      │              │                      │
  │ - currency        │      │              │                      │
  │ - customerId      │      │              │                      │
  │ - tenantId        │      │              │                      │
  └───────────────────┘      │              │                      │
        ▼                     │              │                      │
  ┌─────────────────────────┐│              │                      │
  │ handlePaymentIntention  ││              │                      │
  │ Received() - Listener   ││              │                      │
  │ ✓ Registra intenção     ││              │                      │
  └─────────────────────────┘│              │                      │
        ✓                     │              │                      │
                              ▼              │                      │
                        ┌─────────────────┐  │                      │
                        │ STEP 2: Validate│  │                      │
                        │ Customer        │  │                      │
                        │ validateCustomer│  │                      │
                        │ ("cust_found")  │  │                      │
                        └─────────────────┘  │                      │
                              │              │                      │
                    Encontrado: SIM           │                      │
                              ▼              │                      │
                        ┌──────────────────┐ │                      │
                        │ Emit CUSTOMER    │ │                      │
                        │ _FOUND           │ │                      │
                        │ (coadjuvant)     │ │                      │
                        │                  │ │                      │
                        │ Payload:         │ │                      │
                        │ - customerId     │ │                      │
                        │ - tenantId       │ │                      │
                        └──────────────────┘ │                      │
                              ▼              │                      │
                        ┌──────────────────┐ │                      │
                        │ handleCustomer   │ │                      │
                        │ Found() - Listener│ │                      │
                        │                  │ │                      │
                        │ ACTION:           │ │                      │
                        │ Dispara          │ │                      │
                        │ payment_         │ │                      │
                        │ processed        │ │                      │
                        └──────────────────┘ │                      │
                              ▼              │                      │
                        ┌──────────────────┐ │                      │
                        │ PaymentProcessing│ │                      │
                        │ Service.process  │ │                      │
                        │ Payment()        │ │                      │
                        │                  │ │                      │
                        │ TOUCHPOINT 3     │ │                      │
                        └──────────────────┘ │                      │
                              ▼              │                      │
                        ┌──────────────────┐ │                      │
                        │ Emit PAYMENT     │ │                      │
                        │ _PROCESSED       │ │                      │
                        │ (protagonist)    │ │                      │
                        │                  │ │                      │
                        │ Payload:         │ │                      │
                        │ - paymentId      │ │                      │
                        │ - status: "ok"   │ │                      │
                        │ - tenantId       │ │                      │
                        └──────────────────┘ │                      │
                              ▼              │                      │
                        ┌──────────────────┐ │                      │
                        │ handlePayment    │ │                      │
                        │ Processed() -    │ │                      │
                        │ Listener         │ │                      │
                        │ ✓ Registra final │ │                      │
                        └──────────────────┘ │                      │
                              ✓              │                      │
                                             ▼                      │
                                        ┌──────────────────────┐   │
                                        │ STEP 3: Await        │   │
                                        │ Event Processing     │   │
                                        │ (delay 100ms)        │   │
                                        └──────────────────────┘   │
                                             ▼                      │
                                        ┌──────────────────────┐   │
                                        │ STEP 4: Emit         │   │
                                        │ INVOICE_CREATED      │   │
                                        │ (PROTAGONIST) ⭐     │◄──┘
                                        │                      │
                                        │ Payload:             │
                                        │ - paymentId          │
                                        │ - amount: 1000       │
                                        │ - tenantId           │
                                        └──────────────────────┘
                                             ▼
                                        ┌──────────────────────┐
                                        │ handleInvoiceCreated │
                                        │ () - Listener        │
                                        │ ✓ Registra evento    │
                                        │   protagonista       │
                                        └──────────────────────┘
                                             ✓
                                             ▼
                                      Response 201 Created
                                      {
                                        paymentId: "pay_xxx",
                                        success: true,
                                        message: "Fatura criada",
                                        state: "invoice_creation"
                                      }
```

---

## Cenário 2: Cliente Não Encontrado

```
┌──────────────────────────────────────────────────────────────────────┐
│ POST /invoices {customerId: "cust_not_found", amount: 2000}          │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ╔════════════════════════════════════════════════════════════╗
        ║ InvoiceService.createInvoice()                             ║
        ║ TOUCHPOINT 1: checkout_payment_completed                  ║
        ╚════════════════════════════════════════════════════════════╝
                              │
        ┌─────────────────────┼─────────────────────────────────────┐
        │                     │                                     │
        ▼                     │                                     │
  ┌───────────────────┐      │                                     │
  │ STEP 1: Emit      │      │                                     │
  │ PAYMENT_INTENTION │      │                                     │
  │ _RECEIVED         │      │                                     │
  │ (coadjuvant)      │      │                                     │
  └───────────────────┘      │                                     │
        ▼                     │                                     │
  ┌─────────────────────────┐│                                     │
  │ handlePaymentIntention  ││                                     │
  │ Received() - Listener   ││                                     │
  │ ✓ Registra              ││                                     │
  └─────────────────────────┘│                                     │
        ✓                     │                                     │
                              ▼                                     │
                        ┌──────────────────┐                        │
                        │ STEP 2: Validate │                        │
                        │ Customer         │                        │
                        │("cust_not_found")│                        │
                        └──────────────────┘                        │
                              │                                     │
                    Encontrado: NÃO                                │
                              ▼                                     │
                        ┌──────────────────┐                        │
                        │ Emit CUSTOMER    │                        │
                        │ _NOT_FOUND       │                        │
                        │ (coadjuvant)     │                        │
                        └──────────────────┘                        │
                              ▼                                     │
                        ┌──────────────────────┐                    │
                        │ handleCustomerNotFound │                    │
                        │ () - Listener        │                    │
                        │                      │                    │
                        │ ACTION:              │                    │
                        │ Dispara              │                    │
                        │ customer_created     │                    │
                        └──────────────────────┘                    │
                              ▼                                     │
                        ╔══════════════════════════╗                │
                        ║ TOUCHPOINT 2:             ║                │
                        ║ customer_created          ║                │
                        ║ (acionado por ação)       ║                │
                        ╚══════════════════════════╝                │
                              │                                     │
                              ▼                                     │
                        ┌──────────────────────┐                    │
                        │ CustomerCreationService │                    │
                        │ .createCustomer()    │                    │
                        │ ✓ Cria cliente Asaas │                    │
                        └──────────────────────┘                    │
                              ▼                                     │
                        ┌──────────────────────┐                    │
                        │ Emit CUSTOMER_CREATED│                    │
                        │ (PROTAGONIST) ⭐     │                    │
                        │                      │                    │
                        │ Payload:             │                    │
                        │ - customerId         │                    │
                        │ - tenantId           │                    │
                        └──────────────────────┘                    │
                              ▼                                     │
                        ┌──────────────────────┐                    │
                        │ handleCustomerCreated│                    │
                        │ () - Listener        │                    │
                        │                      │                    │
                        │ ACTION:              │                    │
                        │ Dispara              │                    │
                        │ payment_processed    │                    │
                        └──────────────────────┘                    │
                              ▼                                     │
                        ╔══════════════════════════╗                │
                        ║ TOUCHPOINT 3:             ║                │
                        ║ payment_processed         ║                │
                        ║ (acionado por ação)       ║                │
                        ╚══════════════════════════╝                │
                              │                                     │
                              ▼                                     │
                        ┌──────────────────────┐                    │
                        │ PaymentProcessingService │                    │
                        │ .processPayment()    │                    │
                        │ ✓ Processa Asaas     │                    │
                        └──────────────────────┘                    │
                              ▼                                     │
                        ┌──────────────────────┐                    │
                        │ Emit PAYMENT_PROCESSED │                    │
                        │ (PROTAGONIST) ⭐     │                    │
                        │                      │                    │
                        │ Payload:             │                    │
                        │ - paymentId          │                    │
                        │ - status: "approved" │                    │
                        │ - tenantId           │                    │
                        └──────────────────────┘                    │
                              ▼                                     │
                        ┌──────────────────────┐                    │
                        │ handlePaymentProcessed │                    │
                        │ () - Listener        │                    │
                        │ ✓ Registra final     │                    │
                        └──────────────────────┘                    │
                              ✓                                     │
                                                                   ▼
                                        ┌──────────────────────────┐
                                        │ STEP 3: Await            │
                                        │ Event Processing         │
                                        │ (delay 100ms)            │
                                        └──────────────────────────┘
                                             ▼
                                        ┌──────────────────────────┐
                                        │ STEP 4: Emit             │
                                        │ INVOICE_CREATED          │
                                        │ (PROTAGONIST) ⭐     ◄───┘
                                        │                          │
                                        │ Payload:                 │
                                        │ - paymentId              │
                                        │ - amount: 2000           │
                                        │ - tenantId               │
                                        └──────────────────────────┘
                                             ▼
                                        ┌──────────────────────────┐
                                        │ handleInvoiceCreated     │
                                        │ () - Listener            │
                                        │ ✓ Registra evento        │
                                        │   protagonista           │
                                        └──────────────────────────┘
                                             ✓
                                             ▼
                                      Response 201 Created
                                      {
                                        paymentId: "pay_xxx",
                                        success: true,
                                        message: "Fatura criada",
                                        state: "invoice_creation"
                                      }
```

---

## Resumo da Sequência de Eventos

### Ordem Rigorosa Obrigatória:

#### Cenário 1 (Cliente Encontrado):
1. ✅ `PAYMENT_INTENTION_RECEIVED` (coadjuvant)
2. ✅ `CUSTOMER_FOUND` (coadjuvant)
3. 🔄 ACTION: `payment_processed` (Touchpoint 3)
   - ✅ `PAYMENT_PROCESSED` (protagonist)
4. ✅ `INVOICE_CREATED` (PROTAGONIST) ← **SÓ AQUI!**

#### Cenário 2 (Cliente Não Encontrado):
1. ✅ `PAYMENT_INTENTION_RECEIVED` (coadjuvant)
2. ✅ `CUSTOMER_NOT_FOUND` (coadjuvant)
3. 🔄 ACTION: `customer_created` (Touchpoint 2)
   - ✅ `CUSTOMER_CREATED` (protagonist)
   - 🔄 ACTION: `payment_processed` (Touchpoint 3)
     - ✅ `PAYMENT_PROCESSED` (protagonist)
4. ✅ `INVOICE_CREATED` (PROTAGONIST) ← **SÓ AQUI!**

---

## Validação Implementada

### ✅ Regra 1: Protagonista após coadjuvantes
- INVOICE_CREATED só é disparado APÓS todos os coadjuvantes

### ✅ Regra 2: Ações executadas antes do protagonista
- CUSTOMER_NOT_FOUND → ação customer_created → CUSTOMER_CREATED
- CUSTOMER_FOUND → ação payment_processed → PAYMENT_PROCESSED
- CUSTOMER_CREATED → ação payment_processed → PAYMENT_PROCESSED
- TUDO ISTO → DEPOIS INVOICE_CREATED

### ✅ Regra 3: Payloads corretos
- Cada evento contém suas propriedades esperadas

### ✅ Regra 4: Order estrita
- Testes validam a ordem exata de emissão

---

**Implementado em:** NestJS + Event Emitter
**Testado com:** Jest + Test Runner
**Padrão:** Event-Driven Architecture + Saga Pattern
