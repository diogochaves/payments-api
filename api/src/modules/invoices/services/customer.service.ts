import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { INVOICE_EVENTS } from '../events/domain-events';
import { CustomerNotFoundDto } from '../dto/customer-not-found.dto';
import { CustomerFoundDto } from '../dto/customer-found.dto';

/**
 * Customer Service
 * Responsável por validar se o cliente existe
 * Dispara eventos coadjuvantes: CUSTOMER_NOT_FOUND ou CUSTOMER_FOUND
 */
@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);

  constructor(private eventEmitter: EventEmitter2) {}

  /**
   * Valida se cliente existe e dispara evento apropriado
   * Retorna boolean indicando se cliente foi encontrado
   */
  async validateCustomer(
    customerId: string,
    tenantId: string,
  ): Promise<boolean> {
    this.logger.debug(
      `Validando cliente: ${customerId} para tenant: ${tenantId}`,
    );

    const customerExists = await this.findCustomerInDatabase(
      customerId,
      tenantId,
    );

    if (!customerExists) {
      this.logger.warn(
        `Cliente não encontrado: ${customerId}. Disparando evento CUSTOMER_NOT_FOUND.`,
      );
      const payload = new CustomerNotFoundDto(customerId, tenantId);
      this.eventEmitter.emit(INVOICE_EVENTS.CUSTOMER_NOT_FOUND, payload);
      return false;
    }

    this.logger.debug(
      `Cliente encontrado: ${customerId}. Disparando evento CUSTOMER_FOUND.`,
    );
    const payload = new CustomerFoundDto(customerId, tenantId);
    this.eventEmitter.emit(INVOICE_EVENTS.CUSTOMER_FOUND, payload);
    return true;
  }

  /**
   * Simula busca do cliente no banco de dados
   * Em produção, integraria com DynamoService real
   */
  private async findCustomerInDatabase(
    customerId: string,
    tenantId: string,
  ): Promise<boolean> {
    // TODO: Integrar com DynamoService real
    // Simula que clienteID = 'cust_found' sempre existe
    return Promise.resolve(customerId !== 'cust_not_found');
  }
}
