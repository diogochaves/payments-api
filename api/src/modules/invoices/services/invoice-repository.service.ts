import { Injectable } from '@nestjs/common';
import { DynamoService } from '../../../infra/dynamo.service';
import {
  CustomerProviderLink,
  InvoiceRecord,
  InvoiceStatus,
  PaymentProvider,
} from '../types/invoice.types';

@Injectable()
export class InvoiceRepository {
  private readonly invoices = new Map<string, InvoiceRecord>();
  private readonly idempotency = new Map<string, string>();
  private readonly customerLinks = new Map<string, CustomerProviderLink>();
  private readonly rawProviderEvents = new Map<string, unknown>();
  private readonly useDynamo = process.env.INVOICE_REPOSITORY === 'dynamo';

  constructor(private readonly dynamo: DynamoService) {}

  async findByIdempotencyKey(
    tenantId: string,
    idempotencyKey: string,
  ): Promise<InvoiceRecord | undefined> {
    const key = this.idempotencyKey(tenantId, idempotencyKey);

    if (!this.useDynamo) {
      const invoiceId = this.idempotency.get(key);
      return invoiceId
        ? this.invoices.get(this.invoiceKey(tenantId, invoiceId))
        : undefined;
    }

    const item = await this.dynamo.getItem(
      'PaymentsTable',
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
    if (!this.useDynamo) {
      this.invoices.set(
        this.invoiceKey(invoice.tenantId, invoice.invoiceId),
        invoice,
      );
      this.idempotency.set(
        this.idempotencyKey(invoice.tenantId, idempotencyKey),
        invoice.invoiceId,
      );
      return;
    }

    await this.dynamo.putItem('PaymentsTable', this.toPaymentItem(invoice));
    await this.dynamo.putItem('PaymentsTable', {
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
    if (!this.useDynamo) {
      this.idempotency.set(
        this.idempotencyKey(tenantId, idempotencyKey),
        invoice.invoiceId,
      );
      return;
    }

    await this.dynamo.putItem('PaymentsTable', {
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

    if (!this.useDynamo) {
      this.invoices.set(
        this.invoiceKey(updated.tenantId, updated.invoiceId),
        updated,
      );
      return updated;
    }

    await this.dynamo.putItem('PaymentsTable', this.toPaymentItem(updated));
    return updated;
  }

  async findInvoice(
    tenantId: string,
    invoiceId: string,
  ): Promise<InvoiceRecord | undefined> {
    if (!this.useDynamo) {
      return this.invoices.get(this.invoiceKey(tenantId, invoiceId));
    }

    const item = await this.dynamo.getItem(
      'PaymentsTable',
      `TENANT#${tenantId}`,
      `INVOICE#${invoiceId}`,
    );

    return item?.invoice as InvoiceRecord | undefined;
  }

  findByProviderPaymentId(
    providerPaymentId: string,
  ): Promise<InvoiceRecord | undefined> {
    if (!this.useDynamo) {
      return Promise.resolve(
        Array.from(this.invoices.values()).find(
          (invoice) => invoice.providerPaymentId === providerPaymentId,
        ),
      );
    }

    return Promise.resolve(undefined);
  }

  findByExternalReference(
    externalReference: string,
  ): Promise<InvoiceRecord | undefined> {
    if (!this.useDynamo) {
      return Promise.resolve(
        Array.from(this.invoices.values()).find(
          (invoice) =>
            invoice.externalReference === externalReference ||
            invoice.orderId === externalReference,
        ),
      );
    }

    return Promise.resolve(undefined);
  }

  async saveRawProviderEvent(
    eventKey: string,
    payload: unknown,
  ): Promise<boolean> {
    if (!this.useDynamo) {
      if (this.rawProviderEvents.has(eventKey)) {
        return false;
      }

      this.rawProviderEvents.set(eventKey, {
        eventKey,
        payload,
        receivedAt: new Date().toISOString(),
      });
      return true;
    }

    const existing = await this.dynamo.getItem(
      'TransactionsTable',
      `PROVIDER_EVENT#${eventKey}`,
      'RAW',
    );

    if (existing) {
      return false;
    }

    await this.dynamo.putItem('TransactionsTable', {
      PK: `PROVIDER_EVENT#${eventKey}`,
      SK: 'RAW',
      eventKey,
      payload,
      receivedAt: new Date().toISOString(),
    });
    return true;
  }

  async hasRawProviderEvent(eventKey: string): Promise<boolean> {
    if (!this.useDynamo) {
      return this.rawProviderEvents.has(eventKey);
    }

    const existing = await this.dynamo.getItem(
      'TransactionsTable',
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
    const key = this.customerLinkKey(tenantId, customerId, provider);

    if (!this.useDynamo) {
      return this.customerLinks.get(key);
    }

    const item = await this.dynamo.getItem(
      'CustomersTable',
      `TENANT#${tenantId}`,
      `CUSTOMER#${customerId}#PROVIDER#${provider}`,
    );

    return item?.link as CustomerProviderLink | undefined;
  }

  async saveCustomerLink(link: CustomerProviderLink): Promise<void> {
    if (!this.useDynamo) {
      this.customerLinks.set(
        this.customerLinkKey(link.tenantId, link.customerId, link.provider),
        link,
      );
      return;
    }

    await this.dynamo.putItem('CustomersTable', {
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

  private invoiceKey(tenantId: string, invoiceId: string) {
    return `${tenantId}:${invoiceId}`;
  }

  private idempotencyKey(tenantId: string, idempotencyKey: string) {
    return `${tenantId}:${idempotencyKey}`;
  }

  private customerLinkKey(
    tenantId: string,
    customerId: string,
    provider: PaymentProvider,
  ) {
    return `${tenantId}:${provider}:${customerId}`;
  }
}
