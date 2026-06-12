# Quick Start Guide - Invoice Module

## 📂 Estrutura Criada

```
src/modules/invoices/
├── __tests__/
│   ├── invoice-event-sequence.spec.ts       ← Testes de sequência
│   └── invoice-integrated-flow.spec.ts      ← Testes integrados
├── controllers/
│   └── invoice.controller.ts                ← POST /invoices
├── dto/
│   ├── payment-intention.dto.ts
│   ├── customer-not-found.dto.ts
│   ├── customer-found.dto.ts
│   ├── invoice-created.dto.ts
│   ├── customer-created.dto.ts
│   ├── payment-processed.dto.ts
│   └── create-invoice.dto.ts
├── events/
│   └── domain-events.ts                     ← Constantes de eventos
├── listeners/
│   └── invoice.listeners.ts                 ← 6 @OnEvent handlers
├── services/
│   ├── invoice.service.ts                   ← Orquestrador
│   ├── customer.service.ts                  ← Validação
│   ├── customer-creation.service.ts         ← Touchpoint 2
│   └── payment-processing.service.ts        ← Touchpoint 3
├── invoices.module.ts                       ← NestJS Module
├── IMPLEMENTATION.md                        ← Guia detalhado
├── SEQUENCE_DIAGRAM.md                      ← Diagramas visuais
├── VALIDATION_CHECKLIST.md                  ← Checklist
└── SUMMARY.md                               ← Resumo
```

## 🧪 Executar Testes

### Teste de Sequência (40+ testes)

```bash
npm test -- invoice-event-sequence.spec.ts

# Testes validam:
# ✅ Ordem correta de eventos
# ✅ CUSTOMER_NOT_FOUND/FOUND antes de INVOICE_CREATED
# ✅ Payloads corretos
# ✅ PaymentId válido
# ✅ Regra crítica protagonista/coadjuvante
```

### Testes Integrados (15+ testes)

```bash
npm test -- invoice-integrated-flow.spec.ts

# Testes validam:
# ✅ Fluxo completo cliente encontrado
# ✅ Fluxo completo cliente não encontrado
# ✅ Ações executadas corretamente
# ✅ Estados rastreados
# ✅ Listeners funcionando
```

### Todos os Testes do Módulo

```bash
npm test -- invoices

# Executa ambos os arquivos de teste
```

### Com Cobertura

```bash
npm test:cov -- invoices
```

## 🔍 Verificar Implementação

### 1. Verificar Services

```bash
# InvoiceService: Orquestra fluxo completo
cat src/modules/invoices/services/invoice.service.ts

# CustomerService: Valida cliente
cat src/modules/invoices/services/customer.service.ts

# CustomerCreationService: Cria cliente
cat src/modules/invoices/services/customer-creation.service.ts

# PaymentProcessingService: Processa pagamento
cat src/modules/invoices/services/payment-processing.service.ts
```

### 2. Verificar Listeners

```bash
# 6 @OnEvent handlers para cada evento
cat src/modules/invoices/listeners/invoice.listeners.ts
```

### 3. Verificar Module

```bash
# Módulo NestJS com todas as dependências
cat src/modules/invoices/invoices.module.ts
```

### 4. Verificar Eventos

```bash
# Constantes centralizadas de eventos
cat src/modules/invoices/events/domain-events.ts
```

## 🌍 Integrar no AppModule

```typescript
// src/app.module.ts

import { InvoicesModule } from './modules/invoices/invoices.module';

@Module({
  imports: [
    // ... outros módulos
    InvoicesModule,  // ← Adicionar
  ],
})
export class AppModule {}
```

## 🚀 Testar Endpoint

### Start da API

```bash
npm run start:dev
```

### Chamar Endpoint (Cliente Encontrado)

```bash
curl -X POST http://localhost:3000/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant_123",
    "customerId": "cust_found",
    "amount": 1000.0,
    "currency": "BRL"
  }'

# Response:
# {
#   "paymentId": "pay_abc123...",
#   "success": true,
#   "message": "Fatura criada com sucesso",
#   "state": "invoice_creation"
# }
```

### Chamar Endpoint (Cliente Não Encontrado)

```bash
curl -X POST http://localhost:3000/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant_123",
    "customerId": "cust_not_found",
    "amount": 2000.0,
    "currency": "USD"
  }'

# Response:
# {
#   "paymentId": "pay_xyz789...",
#   "success": true,
#   "message": "Fatura criada com sucesso",
#   "state": "invoice_creation"
# }
```

## 📋 Verificar Sequência de Eventos

### Abrir Log do Servidor

Você verá logs como:

```
[NestFactory] Starting Nest application...
[InvoiceService] [STEP 1] Disparando payments.payment.intention_received
[InvoiceListeners] [payments.payment.intention_received] Intenção de pagamento recebida
[InvoiceService] [STEP 2] Validando cliente...
[InvoiceListeners] [payments.customer.found] Cliente encontrado...
[InvoiceListeners] [ACTION] Disparando ação: payment_processed
[PaymentProcessingService] [PAYMENT_PROCESSED] Processando pagamento...
[InvoiceListeners] [payments.payment.processed] ⭐ EVENTO PROTAGONISTA: Pagamento processado
[InvoiceService] [STEP 3] Aguardando processamento de ações...
[InvoiceService] [STEP 4] Disparando EVENTO PROTAGONISTA: payments.invoice.created
[InvoiceListeners] [payments.invoice.created] ⭐ EVENTO PROTAGONISTA: Fatura criada com sucesso
```

## 🎯 Verificações Rápidas

### Verificar se Module está Exportando

```bash
grep -n "exports:" src/modules/invoices/invoices.module.ts
```

Deve mostrar:
```
exports: [InvoiceService, CustomerService, ...]
```

### Verificar se Listeners têm @OnEvent

```bash
grep -n "@OnEvent" src/modules/invoices/listeners/invoice.listeners.ts
```

Deve mostrar 6 decoradores:
```
@OnEvent(PAYMENT_INTENTION_RECEIVED)
@OnEvent(CUSTOMER_NOT_FOUND)
@OnEvent(CUSTOMER_FOUND)
@OnEvent(INVOICE_CREATED)
@OnEvent(CUSTOMER_CREATED)
@OnEvent(PAYMENT_PROCESSED)
```

### Verificar se Services estão Injetados

```bash
grep -n "constructor(" src/modules/invoices/services/*.ts
```

Todos devem ter EventEmitter2 injetado.

## 📚 Documentação Rápida

| Arquivo | Conteúdo |
|---------|----------|
| `IMPLEMENTATION.md` | Guia detalhado de arquitetura |
| `SEQUENCE_DIAGRAM.md` | Diagramas visuais ASCII da sequência |
| `VALIDATION_CHECKLIST.md` | Checklist completo de validações |
| `SUMMARY.md` | Resumo executivo |
| `QUICK_START.md` | Este arquivo |

## 🔐 Regra Crítica Implementada

```
Evento protagonista NUNCA é disparado antes de:
1. Seus coadjuvantes serem disparados
2. As ações dos coadjuvantes serem processadas
3. Os protagonistas das ações serem disparados
```

**Exemplo:**
```
INVOICE_CREATED (protagonist)
  ↑
  └─ Só depois de:
      ├─ PAYMENT_INTENTION_RECEIVED (coadjuvant) ✅
      ├─ CUSTOMER_NOT_FOUND ou CUSTOMER_FOUND (coadjuvant) ✅
      └─ Ações processadas (customer_created ou payment_processed) ✅
```

## ✅ Validações Presentes

- [x] Ordem rigorosa de eventos
- [x] Protagonista após coadjuvantes
- [x] Ações executadas antes de protagonista
- [x] Payloads validados
- [x] Estados rastreados
- [x] Listeners respondendo
- [x] Testes cobrindo tudo

## 🎨 Padrões Implementados

- ✅ **Event-Driven Architecture** - Eventos como drivers
- ✅ **Saga Pattern** - Ações orchestradas
- ✅ **Domain-Driven Design** - Eventos de domínio
- ✅ **Dependency Injection** - Todas dependências injetadas
- ✅ **Single Responsibility** - Cada serviço uma responsabilidade
- ✅ **Type Safety** - TypeScript stricto
- ✅ **SOLID Principles** - Bem organizado

---

**Tudo pronto para usar!** 🚀
Confira os testes rodando e a documentação para detalhes.
