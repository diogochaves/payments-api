import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { InvoiceController } from './controllers/invoice.controller';
import { AsaasWebhookController } from './controllers/asaas-webhook.controller';
import { InvoiceService } from './services/invoice.service';
import { DynamoService } from '../../infra/dynamo.service';
import { AsaasService } from '../../infra/asaas.service';
import { InvoiceRepository } from './services/invoice-repository.service';
import { ProviderRouterService } from './services/provider-router.service';

/**
 * Invoices Module
 *
 * Módulo funcional para gestão de faturas e pagamentos
 * Implementa a especificação ODD com sequência rigorosa de eventos
 *
 * ARQUITETURA:
 * - Controllers: Endpoints REST (POST /invoices)
 * - Services: Lógica de negócio orquestrada
 * - Listeners: Reação aos eventos de domínio
 * - DTOs: Modelos de dados dos eventos
 * - Events: Definição centralizada de eventos
 *
 * REGRA DE SEQUÊNCIA (CRITICAL):
 * 1. COADJUVANTES são disparados e suas ações executadas
 * 2. PROTAGONISTA é disparado APÓS coadjuvantes processarem
 *
 * Touchpoints:
 * 1. checkout_payment_completed
 *    - Coadjuvantes: PAYMENT_INTENTION_RECEIVED, CUSTOMER_NOT_FOUND/FOUND
 *    - Protagonista: INVOICE_CREATED
 *
 * 2. customer_created (ação de CUSTOMER_NOT_FOUND)
 *    - Protagonista: CUSTOMER_CREATED
 *
 * 3. payment_processed (ação de CUSTOMER_FOUND ou CUSTOMER_CREATED)
 *    - Protagonista: PAYMENT_PROCESSED
 */
@Module({
  imports: [EventEmitterModule],
  controllers: [InvoiceController, AsaasWebhookController],
  providers: [
    InvoiceService,
    DynamoService,
    AsaasService,
    InvoiceRepository,
    ProviderRouterService,
  ],
  exports: [InvoiceService, InvoiceRepository, ProviderRouterService],
})
export class InvoicesModule {}
