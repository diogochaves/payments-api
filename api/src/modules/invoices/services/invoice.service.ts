import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ulid } from 'ulid';
import { AsaasService } from '../../../infra/asaas.service';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { InvoiceResponseDto } from '../dto/invoice-response.dto';
import {
  CustomerProviderLink,
  InvoiceRecord,
  PaymentProvider,
} from '../types/invoice.types';
import { InvoiceRepository } from './invoice-repository.service';
import { ProviderRouterService } from './provider-router.service';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    private readonly repository: InvoiceRepository,
    private readonly providerRouter: ProviderRouterService,
    private readonly asaas: AsaasService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createInvoice(
    createInvoiceDto: CreateInvoiceDto,
    idempotencyKey: string,
  ): Promise<InvoiceResponseDto> {
    this.validateCreateInvoice(createInvoiceDto, idempotencyKey);

    const existing = await this.repository.findByIdempotencyKey(
      createInvoiceDto.tenantId,
      idempotencyKey,
    );

    if (existing) {
      this.logger.log(
        `Returning idempotent invoice ${existing.invoiceId} for order ${existing.orderId}`,
      );
      return this.toResponse(existing);
    }

    const provider = this.providerRouter.resolve(createInvoiceDto.provider);
    const now = new Date().toISOString();
    const invoice: InvoiceRecord = {
      invoiceId: `inv_${ulid()}`,
      tenantId: createInvoiceDto.tenantId,
      orderId: createInvoiceDto.orderId,
      customer: createInvoiceDto.customer,
      amount: createInvoiceDto.amount,
      currency: createInvoiceDto.currency,
      dueDate: createInvoiceDto.dueDate,
      billingType: createInvoiceDto.billingType,
      provider,
      status: 'CREATED',
      description:
        createInvoiceDto.description ??
        `Pedido ${createInvoiceDto.orderId} - Magazine Siará`,
      externalReference: createInvoiceDto.orderId,
      createdAt: now,
      updatedAt: now,
    };

    await this.repository.saveInvoice(invoice, idempotencyKey);
    this.eventEmitter.emit('payments.invoice.created', {
      invoiceId: invoice.invoiceId,
      orderId: invoice.orderId,
      provider: invoice.provider,
      status: invoice.status,
      timestamp: now,
    });

    const pendingInvoice = await this.repository.updateInvoice(
      invoice,
      'PROVIDER_PENDING',
    );

    try {
      const customerLink = await this.ensureProviderCustomer(
        pendingInvoice,
        provider,
      );

      const charge = await this.asaas.createCharge({
        customer: customerLink.providerCustomerId,
        billingType: pendingInvoice.billingType,
        value: pendingInvoice.amount,
        dueDate: pendingInvoice.dueDate,
        description: pendingInvoice.description ?? pendingInvoice.orderId,
        externalReference: pendingInvoice.externalReference,
      });

      const openInvoice = await this.repository.updateInvoice(
        pendingInvoice,
        'OPEN',
        {
          providerPaymentId: charge.id,
          providerPayload: charge.payload,
          paymentUrl:
            charge.invoiceUrl ??
            charge.bankSlipUrl ??
            charge.transactionReceiptUrl,
        },
      );

      this.eventEmitter.emit('payments.invoice.opened', {
        invoiceId: openInvoice.invoiceId,
        orderId: openInvoice.orderId,
        provider: openInvoice.provider,
        providerPaymentId: openInvoice.providerPaymentId,
        status: openInvoice.status,
        timestamp: openInvoice.updatedAt,
      });

      return this.toResponse(openInvoice);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      await this.repository.updateInvoice(pendingInvoice, 'FAILED', {
        failureReason: message,
      });

      this.eventEmitter.emit('payments.invoice.provider_failed', {
        invoiceId: pendingInvoice.invoiceId,
        orderId: pendingInvoice.orderId,
        provider: pendingInvoice.provider,
        message,
        timestamp: new Date().toISOString(),
      });

      throw new ServiceUnavailableException({
        message: 'Failed to create invoice on payment provider',
        provider,
        orderId: pendingInvoice.orderId,
        detail: message,
      });
    }
  }

  private async ensureProviderCustomer(
    invoice: InvoiceRecord,
    provider: PaymentProvider,
  ): Promise<CustomerProviderLink> {
    const existing = await this.repository.findCustomerLink(
      invoice.tenantId,
      invoice.customer.id,
      provider,
    );

    if (existing) {
      return existing;
    }

    if (provider !== 'ASAAS') {
      throw new BadRequestException(`Provider ${provider} is not supported`);
    }

    const customer = await this.asaas.createCustomer({
      name: invoice.customer.name,
      cpfCnpj: invoice.customer.document,
      email: invoice.customer.email,
      mobilePhone: invoice.customer.mobilePhone,
      externalReference: invoice.customer.id,
      notificationDisabled: false,
    });

    const now = new Date().toISOString();
    const link: CustomerProviderLink = {
      tenantId: invoice.tenantId,
      customerId: invoice.customer.id,
      provider,
      providerCustomerId: customer.id,
      createdAt: now,
      updatedAt: now,
    };

    await this.repository.saveCustomerLink(link);
    this.eventEmitter.emit('payments.customer.provider_linked', {
      tenantId: invoice.tenantId,
      customerId: invoice.customer.id,
      provider,
      providerCustomerId: customer.id,
      timestamp: now,
    });

    return link;
  }

  private validateCreateInvoice(
    dto: CreateInvoiceDto,
    idempotencyKey: string,
  ): void {
    if (!idempotencyKey?.trim()) {
      throw new BadRequestException('Idempotency-Key header is required');
    }

    const requiredFields: Array<[string, unknown]> = [
      ['tenantId', dto.tenantId],
      ['orderId', dto.orderId],
      ['amount', dto.amount],
      ['currency', dto.currency],
      ['dueDate', dto.dueDate],
      ['billingType', dto.billingType],
      ['customer.id', dto.customer?.id],
      ['customer.name', dto.customer?.name],
      ['customer.document', dto.customer?.document],
    ];

    const missingFields = requiredFields
      .filter(
        ([, value]) => value === undefined || value === null || value === '',
      )
      .map(([field]) => field);

    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Missing required fields: ${missingFields.join(', ')}`,
      );
    }

    if (dto.amount <= 0) {
      throw new BadRequestException('amount must be greater than zero');
    }

    if (dto.currency !== 'BRL') {
      throw new BadRequestException('Only BRL currency is supported');
    }

    if (
      !['BOLETO', 'PIX', 'CREDIT_CARD', 'UNDEFINED'].includes(dto.billingType)
    ) {
      throw new BadRequestException(`Invalid billingType ${dto.billingType}`);
    }

    if (Number.isNaN(Date.parse(dto.dueDate))) {
      throw new BadRequestException('dueDate must be a valid date');
    }
  }

  private toResponse(invoice: InvoiceRecord): InvoiceResponseDto {
    if (!invoice.providerPaymentId) {
      throw new ServiceUnavailableException({
        message: 'Invoice was not opened on payment provider',
        invoiceId: invoice.invoiceId,
        status: invoice.status,
      });
    }

    return {
      invoiceId: invoice.invoiceId,
      orderId: invoice.orderId,
      provider: invoice.provider,
      providerPaymentId: invoice.providerPaymentId,
      status: invoice.status,
      amount: invoice.amount,
      currency: invoice.currency,
      paymentUrl: invoice.paymentUrl,
      externalReference: invoice.externalReference,
    };
  }
}
