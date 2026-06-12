import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { INVOICE_EVENTS } from '../events/domain-events';
import { PaymentProcessedDto } from '../dto/payment-processed.dto';

/**
 * Payment Processing Service
 * 
 * Orquestra o touchpoint de Processamento de Pagamentos
 * Responsável por processar pagamentos e disparar o evento protagonista PAYMENT_PROCESSED
 * 
 * Pode ser acionado por:
 * - CUSTOMER_FOUND (ação do checkout_payment_completed)
 * - CUSTOMER_CREATED (ação do customer_created)
 */
@Injectable()
export class PaymentProcessingService {
  private readonly logger = new Logger(PaymentProcessingService.name);

  constructor(private eventEmitter: EventEmitter2) {}

  /**
   * Processa um pagamento no gateway ASAAS
   * Dispara evento protagonista: PAYMENT_PROCESSED
   * 
   * Regra: Este serviço é acionado como ação de:
   * - CUSTOMER_FOUND: quando cliente já existe
   * - CUSTOMER_CREATED: quando cliente foi criado
   */
  async processPayment(
    paymentId: string,
    tenantId: string,
    amount?: number,
  ): Promise<{
    success: boolean;
    status: string;
    message: string;
  }> {
    try {
      this.logger.log(`[PAYMENT_PROCESSED] Processando pagamento: ${paymentId}`);

      // TODO: Integrar com Asaas Payment Gateway
      // POST https://api-sandbox.asaas.com/v3/paymentLinks
      const status = await this.processWithAsaas(paymentId, amount);

      // Dispara evento protagonista PAYMENT_PROCESSED
      this.logger.log(
        `[PAYMENT_PROCESSED] Disparando EVENTO PROTAGONISTA: ${INVOICE_EVENTS.PAYMENT_PROCESSED}`,
      );
      const payload = new PaymentProcessedDto(paymentId, status, tenantId);
      this.eventEmitter.emit(INVOICE_EVENTS.PAYMENT_PROCESSED, payload);

      return {
        success: true,
        status,
        message: `Pagamento ${paymentId} processado com sucesso`,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao processar pagamento: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        status: 'failed',
        message: `Erro ao processar pagamento: ${error.message}`,
      };
    }
  }

  /**
   * Integra com gateway Asaas para processar pagamento
   */
  private async processWithAsaas(
    paymentId: string,
    amount?: number,
  ): Promise<string> {
    // TODO: Implementar chamada real para Asaas
    // POST https://api-sandbox.asaas.com/v3/paymentLinks
    this.logger.debug(
      `Simulando processamento de pagamento no Asaas: ${paymentId}`,
    );
    return Promise.resolve('approved');
  }
}
