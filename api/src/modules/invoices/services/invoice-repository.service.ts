import { Injectable } from '@nestjs/common';
import { DynamoService } from '../../../infra/dynamo.service';
import {
  CustomerProviderLink,
  InvoiceRecord,
  InvoiceStatus,
  PaymentProvider,
} from '../types/invoice.types';

const PAYMENTS_TABLE = process.env.PAYMENTS_TABLE ?? 'PaymentsTable';
const TRANSACTIONS_TABLE = process.env.TRANSACTIONS_TABLE ?? 'TransactionsTable';
const CUSTOMERS_TABLE = process.env.CUSTOMERS_TABLE ?? 'CustomersTable';

@Injectable()
export class InvoiceRepository {
  constructor(private readonly dynamo: DynamoService) {}

  async findByIdempotencyKey(
    tenantId: string,
    idempotencyKey: string,
  ): Promise<InvoiceRecord | undefined> {
    const item = await this.dynamo.getItem(
      PAYMENTS_TABLE,
      `TENANT#${tenantId}`,
      `IDEMPOTENCY#${idempotencyKey}`,
    );
    const invoiceId =
      typeof item?.invoiceId === 'string' ? item.invoiceId : undefined;

    if (!invoiceId) {
      return undefined;
    }

    return this.findInvoice(tenantId, invoiceId);
  }

  async saveInvoice(
    invoice: InvoiceRecord,
    idempotencyKey: string,
  ): Promise<void> {
    await this.dynamo.putItem(PAYMENTS_TABLE, this.toPaymentItem(invoice));
    await this.saveExternalReferenceLookup(invoice);
    await this.dynamo.putItem(PAYMENTS_TABLE, {
      PK: `TENANT#${invoice.tenantId}`,
      SK: `IDEMPOTENCY#${idempotencyKey}`,
      invoiceId: invoice.invoiceId,
      orderId: invoice.orderId,
      operation: 'CREATE_INVOICE',
      createdAt: invoice.createdAt,
    });
  }

  async saveIdempotencyKey(
    tenantId: string,
    idempotencyKey: string,
    invoice: InvoiceRecord,
  ): Promise<void> {
    await this.dynamo.putItem(PAYMENTS_TABLE, {
      PK: `TENANT#${tenantId}`,
      SK: `IDEMPOTENCY#${idempotencyKey}`,
      invoiceId: invoice.invoiceId,
      orderId: invoice.orderId,
      operation: 'CANCEL_INVOICE',
      createdAt: new Date().toISOString(),
    });
  }

  async updateInvoice(
    invoice: InvoiceRecord,
    status: InvoiceStatus,
    attrs: Partial<InvoiceRecord> = {},
  ): Promise<InvoiceRecord> {
    const updated: InvoiceRecord = {
      ...invoice,
      ...attrs,
      status,
      updatedAt: new Date().toISOString(),
    };

    await this.dynamo.putItem(PAYMENTS_TABLE, this.toPaymentItem(updated));
    await this.saveExternalReferenceLookup(updated);
    return updated;
  }

  async findInvoice(
    tenantId: string,
    invoiceId: string,
  ): Promise<InvoiceRecord | undefined> {
    const item = await this.dynamo.getItem(
      PAYMENTS_TABLE,
      `TENANT#${tenantId}`,
      `INVOICE#${invoiceId}`,
    );

    return item?.invoice as InvoiceRecord | undefined;
  }

  async findByProviderPaymentId(
    providerPaymentId: string,
  ): Promise<InvoiceRecord | undefined> {
    return this.findDynamoInvoiceByProviderPaymentId(providerPaymentId);
  }

  async findByExternalReference(
    externalReference: string,
  ): Promise<InvoiceRecord | undefined> {
    return this.findDynamoInvoiceByExternalReference(externalReference);
  }

  async saveRawProviderEvent(
    eventKey: string,
    payload: unknown,
  ): Promise<boolean> {
    const existing = await this.dynamo.getItem(
      TRANSACTIONS_TABLE,
      `PROVIDER_EVENT#${eventKey}`,
      'RAW',
    );

    if (existing) {
      return false;
    }

    await this.dynamo.putItem(TRANSACTIONS_TABLE, {
      PK: `PROVIDER_EVENT#${eventKey}`,
      SK: 'RAW',
      eventKey,
      payload,
      receivedAt: new Date().toISOString(),
    });
    return true;
  }

  async hasRawProviderEvent(eventKey: string): Promise<boolean> {
    const existing = await this.dynamo.getItem(
      TRANSACTIONS_TABLE,
      `PROVIDER_EVENT#${eventKey}`,
      'RAW',
    );
    return Boolean(existing);
  }

  async findCustomerLink(
    tenantId: string,
    customerId: string,
    provider: PaymentProvider,
  ): Promise<CustomerProviderLink | undefined> {
    const item = await this.dynamo.getItem(
      CUSTOMERS_TABLE,
      `TENANT#${tenantId}`,
      `CUSTOMER#${customerId}#PROVIDER#${provider}`,
    );

    return item?.link as CustomerProviderLink | undefined;
  }

  async saveCustomerLink(link: CustomerProviderLink): Promise<void> {
    await this.dynamo.putItem(CUSTOMERS_TABLE, {
      PK: `TENANT#${link.tenantId}`,
      SK: `CUSTOMER#${link.customerId}#PROVIDER#${link.provider}`,
      link,
      providerCustomerId: link.providerCustomerId,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
    });
  }

  private toPaymentItem(invoice: InvoiceRecord) {
    return {
      PK: `TENANT#${invoice.tenantId}`,
      SK: `INVOICE#${invoice.invoiceId}`,
      GSI1PK: `PROVIDER#${invoice.provider}`,
      GSI1SK: `PAYMENT#${invoice.providerPaymentId ?? 'PENDING'}`,
      GSI2PK: `STATUS#${invoice.status}`,
      GSI2SK: `ORDER#${invoice.orderId}`,
      invoice,
      invoiceId: invoice.invoiceId,
      orderId: invoice.orderId,
      provider: invoice.provider,
      providerPaymentId: invoice.providerPaymentId,
      status: invoice.status,
      amount: invoice.amount,
      currency: invoice.currency,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };
  }

  private async findDynamoInvoiceByProviderPaymentId(
    providerPaymentId: string,
  ): Promise<InvoiceRecord | undefined> {
    const providers: PaymentProvider[] = ['ASAAS', 'ITAU'];

    for (const provider of providers) {
      const [item] = await this.dynamo.queryByIndex(
        PAYMENTS_TABLE,
        'ProviderPaymentIndex',
        'GSI1PK',
        `PROVIDER#${provider}`,
        'GSI1SK',
        `PAYMENT#${providerPaymentId}`,
      );

      if (item?.invoice) {
        return item.invoice as InvoiceRecord;
      }
    }

    return undefined;
  }

  private async findDynamoInvoiceByExternalReference(
    externalReference: string,
  ): Promise<InvoiceRecord | undefined> {
    const item = await this.dynamo.getItem(
      PAYMENTS_TABLE,
      `EXTERNAL_REFERENCE#${externalReference}`,
      'INVOICE',
    );
    const tenantId = typeof item?.tenantId === 'string' ? item.tenantId : '';
    const invoiceId = typeof item?.invoiceId === 'string' ? item.invoiceId : '';

    if (!tenantId || !invoiceId) {
      return undefined;
    }

    return this.findInvoice(tenantId, invoiceId);
  }

  private async saveExternalReferenceLookup(
    invoice: InvoiceRecord,
  ): Promise<void> {
    await this.dynamo.putItem(PAYMENTS_TABLE, {
      PK: `EXTERNAL_REFERENCE#${invoice.externalReference}`,
      SK: 'INVOICE',
      tenantId: invoice.tenantId,
      invoiceId: invoice.invoiceId,
      orderId: invoice.orderId,
      provider: invoice.provider,
      updatedAt: invoice.updatedAt,
    });
  }
}
