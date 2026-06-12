import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { INVOICE_EVENTS } from '../events/domain-events';
import { PaymentIntentionDto } from '../dto/payment-intention.dto';
import { CustomerNotFoundDto } from '../dto/customer-not-found.dto';
import { CustomerFoundDto } from '../dto/customer-found.dto';
import { InvoiceCreatedDto } from '../dto/invoice-created.dto';
import { CustomerCreatedDto } from '../dto/customer-created.dto';
import { PaymentProcessedDto } from '../dto/payment-processed.dto';
import { CustomerCreationService } from '../services/customer-creation.service';
import { PaymentProcessingService } from '../services/payment-processing.service';

/**
 * Invoice Event Listeners
 * 
 * Escuta e processa os eventos de domínio
 * 
 * Regra de Sequência:
 * - Listeners de COADJUVANTES processam suas ações
 * - Listeners de PROTAGONISTAS registram o evento final
 */
@Injectable()
export class InvoiceListeners {
  private readonly logger = new Logger(InvoiceListeners.name);

  constructor(
    private customerCreationService: CustomerCreationService,
    private paymentProcessingService: PaymentProcessingService,
  ) {}

  // ============================================================================
  // TOUCHPOINT 1: checkout_payment_completed
  // ============================================================================

  /**
   * Listener para evento PAYMENT_INTENTION_RECEIVED (coadjuvant)
   * Loga a intenção de pagamento recebida
   */
  @OnEvent(INVOICE_EVENTS.PAYMENT_INTENTION_RECEIVED)
  async handlePaymentIntentionReceived(
    payload: PaymentIntentionDto,
  ): Promise<void> {
    this.logger.log(
      `[${INVOICE_EVENTS.PAYMENT_INTENTION_RECEIVED}] Intenção de pagamento recebida`,
      {
        customerId: payload.customerId,
        amount: payload.amount,
        currency: payload.currency,
        tenantId: payload.tenantId,
      },
    );
    // Ação: Registra a intenção para auditoria/rastreamento
  }

  /**
   * Listener para evento CUSTOMER_NOT_FOUND (coadjuvant)
   * Ação: Dispara customer_created para criar cliente
   * 
   * CRÍTICO: Esta ação DEVE ser executada ANTES do protagonista INVOICE_CREATED
   */
  @OnEvent(INVOICE_EVENTS.CUSTOMER_NOT_FOUND)
  async handleCustomerNotFound(payload: CustomerNotFoundDto): Promise<void> {
    this.logger.warn(
      `[${INVOICE_EVENTS.CUSTOMER_NOT_FOUND}] Cliente não encontrado`,
      {
        customerId: payload.customerId,
        tenantId: payload.tenantId,
      },
    );

    // Ação: Executar touchpoint customer_created
    this.logger.log(
      `[ACTION] Disparando ação: customer_created para ${payload.customerId}`,
    );
    await this.customerCreationService.createCustomer(
      payload.customerId,
      payload.tenantId,
    );
  }

  /**
   * Listener para evento CUSTOMER_FOUND (coadjuvant)
   * Ação: Dispara payment_processed para processar pagamento
   * 
   * CRÍTICO: Esta ação DEVE ser executada ANTES do protagonista INVOICE_CREATED
   */
  @OnEvent(INVOICE_EVENTS.CUSTOMER_FOUND)
  async handleCustomerFound(payload: CustomerFoundDto): Promise<void> {
    this.logger.debug(
      `[${INVOICE_EVENTS.CUSTOMER_FOUND}] Cliente encontrado na base de dados`,
      {
        customerId: payload.customerId,
        tenantId: payload.tenantId,
      },
    );

    // Ação: Executar touchpoint payment_processed
    this.logger.log(`[ACTION] Disparando ação: payment_processed`);
    // Nota: paymentId seria obtido do contexto de execução (seria melhor usar saga)
    // Por agora, usamos um placeholder
    await this.paymentProcessingService.processPayment(
      'pay_placeholder',
      payload.tenantId,
    );
  }

  /**
   * Listener para evento INVOICE_CREATED (PROTAGONIST)
   * 
   * CRÍTICO: Este é o evento protagonista que só é disparado APÓS
   * os coadjuvantes (PAYMENT_INTENTION_RECEIVED, CUSTOMER_NOT_FOUND/FOUND)
   * processarem suas ações
   */
  @OnEvent(INVOICE_EVENTS.INVOICE_CREATED)
  async handleInvoiceCreated(payload: InvoiceCreatedDto): Promise<void> {
    this.logger.log(
      `[${INVOICE_EVENTS.INVOICE_CREATED}] ⭐ EVENTO PROTAGONISTA: Fatura criada com sucesso`,
      {
        paymentId: payload.paymentId,
        amount: payload.amount,
        tenantId: payload.tenantId,
      },
    );

    // Ações do evento protagonista:
    // - Persistir fatura em auditoria
    // - Notificar clientes
    // - Atualizar dashboard
  }

  // ============================================================================
  // TOUCHPOINT 2: customer_created
  // ============================================================================

  /**
   * Listener para evento CUSTOMER_CREATED (PROTAGONIST)
   * 
   * CRÍTICO: Este é o evento protagonista que só é disparado APÓS
   * o cliente ser criado com sucesso
   * 
   * Ação: Dispara payment_processed
   */
  @OnEvent(INVOICE_EVENTS.CUSTOMER_CREATED)
  async handleCustomerCreated(payload: CustomerCreatedDto): Promise<void> {
    this.logger.log(
      `[${INVOICE_EVENTS.CUSTOMER_CREATED}] ⭐ EVENTO PROTAGONISTA: Cliente criado com sucesso`,
      {
        customerId: payload.customerId,
        tenantId: payload.tenantId,
      },
    );

    // Ação: Executar touchpoint payment_processed
    this.logger.log(
      `[ACTION] Disparando ação: payment_processed (após cliente criado)`,
    );
    await this.paymentProcessingService.processPayment(
      'pay_placeholder',
      payload.tenantId,
    );
  }

  // ============================================================================
  // TOUCHPOINT 3: payment_processed
  // ============================================================================

  /**
   * Listener para evento PAYMENT_PROCESSED (PROTAGONIST)
   * 
   * CRÍTICO: Este é o evento protagonista final que só é disparado APÓS
   * o pagamento ser processado com sucesso
   * 
   * Sem ações subsequentes (última etapa do fluxo)
   */
  @OnEvent(INVOICE_EVENTS.PAYMENT_PROCESSED)
  async handlePaymentProcessed(payload: PaymentProcessedDto): Promise<void> {
    this.logger.log(
      `[${INVOICE_EVENTS.PAYMENT_PROCESSED}] ⭐ EVENTO PROTAGONISTA: Pagamento processado`,
      {
        paymentId: payload.paymentId,
        status: payload.status,
        tenantId: payload.tenantId,
      },
    );

    // Ações finais:
    // - Atualizar status na base de dados
    // - Enviar confirmação ao cliente
    // - Disparar webhooks
  }
}
