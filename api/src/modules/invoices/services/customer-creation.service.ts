import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { INVOICE_EVENTS } from '../events/domain-events';
import { CustomerCreatedDto } from '../dto/customer-created.dto';

/**
 * Customer Creation Service
 * 
 * Orquestra o touchpoint de Cadastro de Cliente
 * Responsável por criar cliente e disparar o evento protagonista CUSTOMER_CREATED
 * 
 * Depende de: CUSTOMER_NOT_FOUND (ação do checkout_payment_completed)
 * Dispara ação para: payment_processed
 */
@Injectable()
export class CustomerCreationService {
  private readonly logger = new Logger(CustomerCreationService.name);

  constructor(private eventEmitter: EventEmitter2) {}

  /**
   * Cria um novo cliente no sistema
   * Dispara evento protagonista: CUSTOMER_CREATED
   * 
   * Regra: Este serviço é acionado pela ação em CUSTOMER_NOT_FOUND
   * Portanto, é chamado como resposta ao evento CUSTOMER_NOT_FOUND
   */
  async createCustomer(
    customerId: string,
    tenantId: string,
    customerData?: any,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      this.logger.log(`[CUSTOMER_CREATED] Criando novo cliente: ${customerId}`);

      // TODO: Integrar com Asaas API: https://api-sandbox.asaas.com/v3/customers
      // Simula criação de cliente
      await this.createCustomerInAsaas(customerId, customerData);

      // Dispara evento protagonista CUSTOMER_CREATED
      // Este evento dispara ação para: payment_processed
      this.logger.log(
        `[CUSTOMER_CREATED] Disparando EVENTO PROTAGONISTA: ${INVOICE_EVENTS.CUSTOMER_CREATED}`,
      );
      const payload = new CustomerCreatedDto(customerId, tenantId);
      this.eventEmitter.emit(INVOICE_EVENTS.CUSTOMER_CREATED, payload);

      return {
        success: true,
        message: `Cliente ${customerId} criado com sucesso`,
      };
    } catch (error) {
      this.logger.error(`Erro ao criar cliente: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Erro ao criar cliente: ${error.message}`,
      };
    }
  }

  /**
   * Integra com Asaas API para criar cliente
   */
  private async createCustomerInAsaas(
    customerId: string,
    customerData?: any,
  ): Promise<void> {
    // TODO: Implementar chamada real para Asaas
    // POST https://api-sandbox.asaas.com/v3/customers
    this.logger.debug(`Simulando criação de cliente no Asaas: ${customerId}`);
    return Promise.resolve();
  }
}
