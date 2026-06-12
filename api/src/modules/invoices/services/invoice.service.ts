import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { INVOICE_EVENTS, ProcessingState } from '../events/domain-events';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { PaymentIntentionDto } from '../dto/payment-intention.dto';
import { InvoiceCreatedDto } from '../dto/invoice-created.dto';
import { CustomerService } from './customer.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Invoice Service
 * 
 * Orquestra o fluxo de criação de faturas respeitando a sequência:
 * 1. Dispara PAYMENT_INTENTION_RECEIVED (coadjuvant)
 * 2. Valida cliente → CUSTOMER_NOT_FOUND ou CUSTOMER_FOUND (coadjuvants)
 * 3. Aguarda ações dos coadjuvantes serem processadas
 * 4. Dispara INVOICE_CREATED (protagonist) - SÓ DEPOIS dos coadjuvantes
 * 
 * Regra: O protagonista INVOICE_CREATED só pode ser disparado após:
 * - PAYMENT_INTENTION_RECEIVED ser recebido
 * - CUSTOMER_NOT_FOUND ou CUSTOMER_FOUND ser processado E sua ação
 */
@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    private eventEmitter: EventEmitter2,
    private customerService: CustomerService,
  ) {}

  /**
   * Cria uma nova fatura respeitando a sequência de eventos da spec
   * 
   * SEQUÊNCIA OBRIGATÓRIA:
   * 1. Dispara PAYMENT_INTENTION_RECEIVED (coadjuvant)
   * 2. Valida cliente:
   *    - Se não encontrado → dispara CUSTOMER_NOT_FOUND (coadjuvant)
   *      → Aguarda ação: customer_created ser processado
   *    - Se encontrado → dispara CUSTOMER_FOUND (coadjuvant)
   *      → Aguarda ação: payment_processed ser processado
   * 3. Dispara INVOICE_CREATED (PROTAGONIST - só depois dos coadjuvantes)
   */
  async createInvoice(createInvoiceDto: CreateInvoiceDto): Promise<{
    paymentId: string;
    success: boolean;
    message: string;
    state: string;
  }> {
    const { tenantId, customerId, amount, currency, description } =
      createInvoiceDto;
    const paymentId = this.generatePaymentId();

    try {
      // STEP 1: Dispara PAYMENT_INTENTION_RECEIVED (coadjuvant)
      this.logger.log(
        `[STEP 1] Disparando ${INVOICE_EVENTS.PAYMENT_INTENTION_RECEIVED}`,
      );
      const intentionPayload = new PaymentIntentionDto(
        amount,
        currency,
        customerId,
        tenantId,
      );
      this.eventEmitter.emit(
        INVOICE_EVENTS.PAYMENT_INTENTION_RECEIVED,
        intentionPayload,
      );

      // STEP 2: Valida cliente e dispara CUSTOMER_NOT_FOUND ou CUSTOMER_FOUND
      this.logger.log(
        `[STEP 2] Validando cliente e disparando evento coadjuvante`,
      );
      const customerExists = await this.customerService.validateCustomer(
        customerId,
        tenantId,
      );

      // STEP 3: Aguarda ações dos coadjuvantes
      // Simula delay para garantir que os listeners processem os eventos
      this.logger.log(`[STEP 3] Aguardando processamento de ações...`);
      await this.delayForEventProcessing();

      // STEP 4: Dispara INVOICE_CREATED (PROTAGONIST)
      // CRÍTICO: Só pode ser disparado APÓS coadjuvantes processarem suas ações
      this.logger.log(
        `[STEP 4] Disparando EVENTO PROTAGONISTA: ${INVOICE_EVENTS.INVOICE_CREATED}`,
      );
      const invoicePayload = new InvoiceCreatedDto(
        paymentId,
        amount,
        tenantId,
      );
      this.eventEmitter.emit(INVOICE_EVENTS.INVOICE_CREATED, invoicePayload);

      return {
        paymentId,
        success: true,
        message: 'Fatura criada com sucesso',
        state: ProcessingState.INVOICE_CREATION,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao criar fatura: ${error.message}`,
        error.stack,
      );
      return {
        paymentId,
        success: false,
        message: `Erro ao criar fatura: ${error.message}`,
        state: ProcessingState.FAILED,
      };
    }
  }

  /**
   * Aguarda processamento de eventos pelos listeners
   * Simula o tempo necessário para que os handlers processem
   */
  private async delayForEventProcessing(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Gera um ID único para o pagamento
   */
  private generatePaymentId(): string {
    return `pay_${uuidv4().replace(/-/g, '').substring(0, 20)}`;
  }
}
