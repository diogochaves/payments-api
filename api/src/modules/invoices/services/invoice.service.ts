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
  ProviderChargeResponse,
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
    correlationId?: string,
  ): Promise<InvoiceResponseDto> {
    this.validateCreateInvoice(createInvoiceDto, idempotencyKey);
    const resolvedCorrelationId = correlationId?.trim() || `corr_${ulid()}`;

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

    let provider: PaymentProvider;

    try {
      provider = this.providerRouter.resolve(createInvoiceDto.provider);
    } catch (error) {
      this.emitObservable(
        'pagamento.cobranca.checkout.intencao.de.pagamento.salva_exception',
        {
          tenantId: createInvoiceDto.tenantId,
          orderId: createInvoiceDto.orderId,
          provider: createInvoiceDto.provider ?? 'UNKNOWN',
          correlationId: resolvedCorrelationId,
          stage: 'pagamento_salva',
          flow: 'caminho-feliz',
          step: 1,
          errorType: 'provider_not_enabled',
          errorCode: error instanceof Error ? error.message : 'unknown_error',
          retryable: false,
        },
      );
      throw error;
    }

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
    this.emitObservable(
      'pagamento.cobranca.checkout.intencao.de.pagamento.salva',
      {
        invoice,
        correlationId: resolvedCorrelationId,
        stage: 'pagamento_salva',
        flow: 'caminho-feliz',
        step: 1,
      },
    );

    const pendingInvoice = await this.repository.updateInvoice(
      invoice,
      'PROVIDER_PENDING',
    );

    try {
      const customerLink = await this.ensureProviderCustomer(
        pendingInvoice,
        provider,
        resolvedCorrelationId,
      );

      const charge = await this.asaas.createCharge({
        customer: customerLink.providerCustomerId,
        billingType: pendingInvoice.billingType,
        value: pendingInvoice.amount,
        dueDate: pendingInvoice.dueDate,
        description: pendingInvoice.description ?? pendingInvoice.orderId,
        externalReference: pendingInvoice.externalReference,
      });

      this.assertProviderChargeContract(pendingInvoice, charge);
      this.emitObservable(
        'pagamento.processamento.pagamentos.pagamento.pendente',
        {
          invoice: pendingInvoice,
          correlationId: resolvedCorrelationId,
          stage: 'pagamento_pendente',
          flow: 'caminho-feliz',
          step: 3,
          providerOperation: 'POST /v3/payments',
          providerPaymentId: charge.id,
          providerStatus: charge.status,
          paymentUrl:
            charge.invoiceUrl ??
            charge.bankSlipUrl ??
            charge.transactionReceiptUrl,
          amount: charge.value,
          dueDate: charge.dueDate,
          billingType: charge.billingType,
        },
      );

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
      this.emitObservable('pagamento.processamento.pagamentos.fatura.criada', {
        invoice: openInvoice,
        correlationId: resolvedCorrelationId,
        stage: 'fatura_criada',
        flow: 'caminho-feliz',
        step: 4,
        providerOperation: 'POST /v3/payments',
        providerPaymentId: charge.id,
        providerStatus: charge.status,
        paymentUrl: openInvoice.paymentUrl,
        amount: charge.value,
        dueDate: charge.dueDate,
        billingType: charge.billingType,
      });

      return this.toResponse(openInvoice);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const errorType = message.includes('provider_contract_violation')
        ? 'provider_contract_violation'
        : 'provider_error';

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
      this.emitObservable(
        'pagamento.processamento.pagamentos.pagamento.pendente_exception',
        {
          invoice: pendingInvoice,
          correlationId: resolvedCorrelationId,
          stage: 'pagamento_pendente',
          flow: 'caminho-feliz',
          step: 3,
          providerOperation: 'POST /v3/payments',
          errorType,
          errorCode: message,
          retryable: this.isRetryableProviderError(message),
        },
      );
      this.emitObservable(
        'pagamento.processamento.pagamentos.fatura.criada_exception',
        {
          invoice: pendingInvoice,
          correlationId: resolvedCorrelationId,
          stage: 'fatura_criada',
          flow: 'caminho-feliz',
          step: 4,
          providerOperation: 'POST /v3/payments',
          errorType,
          errorCode: message,
          retryable: this.isRetryableProviderError(message),
        },
      );

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
    correlationId: string,
  ): Promise<CustomerProviderLink> {
    const existing = await this.repository.findCustomerLink(
      invoice.tenantId,
      invoice.customer.id,
      provider,
    );

    if (existing) {
      this.emitObservable(
        'pagamento.processamento.pagamentos.cliente.encontrado.view',
        {
          invoice,
          correlationId,
          stage: 'cliente_encontrado',
          flow: 'caminho-feliz',
          step: 2,
          providerCustomerId: existing.providerCustomerId,
        },
      );
      return existing;
    }

    if (provider !== 'ASAAS') {
      throw new BadRequestException(`Provider ${provider} is not supported`);
    }

    this.emitObservable(
      'pagamento.cobranca.cadastrada.cliente.nao.encontrado.failure',
      {
        invoice,
        correlationId,
        stage: 'cliente_nao_encontrado',
        flow: 'caminho-alternativo',
        step: 2,
      },
    );

    let customer: { id: string };

    try {
      customer = await this.asaas.createCustomer({
        name: invoice.customer.name,
        cpfCnpj: invoice.customer.document,
        email: invoice.customer.email,
        mobilePhone: invoice.customer.mobilePhone,
        externalReference: invoice.customer.id,
        notificationDisabled: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.emitObservable(
        'pagamento.cobranca.cadastrada.cliente.cadastrado_exception',
        {
          invoice,
          correlationId,
          stage: 'cliente_cadastrado',
          flow: 'caminho-alternativo',
          step: 3,
          providerOperation: 'POST /v3/customers',
          errorType: 'provider_error',
          errorCode: this.sanitizeError(message),
          retryable: this.isRetryableProviderError(message),
        },
      );
      throw error;
    }

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
    this.emitObservable('pagamento.cobranca.cadastrada.cliente.cadastrado', {
      invoice,
      correlationId,
      stage: 'cliente_cadastrado',
      flow: 'caminho-alternativo',
      step: 3,
      providerOperation: 'POST /v3/customers',
      providerCustomerId: customer.id,
    });

    return link;
  }

  private assertProviderChargeContract(
    invoice: InvoiceRecord,
    charge: ProviderChargeResponse,
  ): void {
    if (!charge.id) {
      throw new Error('provider_contract_violation: missing payment id');
    }

    if (
      charge.externalReference !== undefined &&
      charge.externalReference !== invoice.externalReference
    ) {
      throw new Error(
        'provider_contract_violation: externalReference mismatch',
      );
    }

    if (charge.value !== undefined && charge.value !== invoice.amount) {
      throw new Error('provider_contract_violation: value mismatch');
    }

    if (charge.dueDate !== undefined && charge.dueDate !== invoice.dueDate) {
      throw new Error('provider_contract_violation: dueDate mismatch');
    }

    if (
      charge.billingType !== undefined &&
      charge.billingType !== invoice.billingType
    ) {
      throw new Error('provider_contract_violation: billingType mismatch');
    }
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

  private emitObservable(
    eventKey: string,
    payload: {
      invoice?: InvoiceRecord;
      tenantId?: string;
      orderId?: string;
      provider?: string;
      correlationId: string;
      stage: string;
      flow: string;
      step: number;
      [key: string]: unknown;
    },
  ): void {
    const invoice = payload.invoice;
    const event = {
      event_key: eventKey,
      env: process.env.OBSERVABILITY_ENV ?? 'dev',
      stage: payload.stage,
      flow: payload.flow,
      step: payload.step,
      correlationId: payload.correlationId,
      tenantId: invoice?.tenantId ?? payload.tenantId,
      orderId: invoice?.orderId ?? payload.orderId,
      invoiceId: invoice?.invoiceId,
      provider: invoice?.provider ?? payload.provider,
      providerPaymentId:
        invoice?.providerPaymentId ?? payload.providerPaymentId,
      timestamp: new Date().toISOString(),
      ...this.withoutInternalPayload(payload),
    };

    this.eventEmitter.emit('payments.observability', event);
  }

  private withoutInternalPayload(payload: Record<string, unknown>) {
    const { invoice, correlationId, stage, flow, step, ...rest } = payload;
    return rest;
  }

  private sanitizeError(message: string): string {
    return message
      .replace(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g, '[document]')
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
      .replace(/\b\d{10,11}\b/g, '[phone]');
  }

  private isRetryableProviderError(message: string): boolean {
    return /timeout|5\d\d|ECONNRESET|ETIMEDOUT/i.test(message);
  }
}
