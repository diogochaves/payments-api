/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AsaasService } from '../src/infra/asaas.service';
import { InvoiceRepository } from '../src/modules/invoices/services/invoice-repository.service';
import {
  buildTestFixture,
  teardownFixture,
  TEST_API_TOKEN,
  TENANT_ID,
  WEBHOOK_SECRET,
  truncateAllTables,
} from './support/app-fixture';

const BASE_PAYLOAD = {
  tenantId: TENANT_ID,
  orderId: 'MS-100045',
  customer: {
    id: 'customer-123',
    name: 'Maria Silva',
    document: '12345678909',
    email: 'maria@example.com',
    mobilePhone: '11987654321',
  },
  amount: 159.9,
  currency: 'BRL',
  dueDate: '2027-12-31',
  billingType: 'PIX',
  provider: 'ASAAS',
  description: 'Pedido MS-100045',
};

describe('Cancelar Invoice', () => {
  let app: INestApplication<App>;
  let repository: InvoiceRepository;
  let asaas: AsaasService;

  beforeAll(async () => {
    const fixture = await buildTestFixture();
    app = fixture.app;
    repository = fixture.repository;
    asaas = fixture.asaas;
  });

  afterAll(async () => {
    if (app) await teardownFixture({ app, repository, asaas });
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  async function criarInvoice(idempotencyKey = 'MS-100045:create') {
    return request(app.getHttpServer())
      .post('/invoices')
      .set('X-Api-Token', TEST_API_TOKEN)
      .set('Idempotency-Key', idempotencyKey)
      .send(BASE_PAYLOAD)
      .expect(201);
  }

  it('cancela invoice aberta com sucesso', async () => {
    const created = await criarInvoice();

    const response = await request(app.getHttpServer())
      .delete(`/invoices/${created.body.invoiceId}`)
      .set('X-Api-Token', TEST_API_TOKEN)
      .set('X-Tenant-Id', TENANT_ID)
      .set('Idempotency-Key', 'MS-100045:cancel')
      .expect(200);

    expect(response.body).toMatchObject({
      invoiceId: created.body.invoiceId,
      orderId: 'MS-100045',
      provider: 'ASAAS',
      providerPaymentId: created.body.providerPaymentId,
      status: 'CANCELLED',
    });
  });

  it('retorna o mesmo resultado em cancelamento repetido com mesma idempotencia', async () => {
    const created = await criarInvoice();

    const first = await request(app.getHttpServer())
      .delete(`/invoices/${created.body.invoiceId}`)
      .set('X-Api-Token', TEST_API_TOKEN)
      .set('X-Tenant-Id', TENANT_ID)
      .set('Idempotency-Key', 'MS-100045:cancel')
      .expect(200);

    const second = await request(app.getHttpServer())
      .delete(`/invoices/${created.body.invoiceId}`)
      .set('X-Api-Token', TEST_API_TOKEN)
      .set('X-Tenant-Id', TENANT_ID)
      .set('Idempotency-Key', 'MS-100045:cancel')
      .expect(200);

    expect(second.body).toEqual(first.body);
    expect(second.body.status).toBe('CANCELLED');
  });

  it('impede cancelamento apos pagamento confirmado', async () => {
    const created = await criarInvoice();

    const existing = await repository.findInvoice(
      TENANT_ID,
      created.body.invoiceId,
    );
    await repository.updateInvoice(existing!, 'CONFIRMED');

    const response = await request(app.getHttpServer())
      .delete(`/invoices/${created.body.invoiceId}`)
      .set('X-Api-Token', TEST_API_TOKEN)
      .set('X-Tenant-Id', TENANT_ID)
      .set('Idempotency-Key', 'MS-100045:cancel')
      .expect(400);

    expect(response.body.message).toBe(
      'Invoice cancellation after confirmation requires refund flow',
    );
  });

  it('confirma cancelamento quando webhook PAYMENT_DELETED chega apos solicitacao', async () => {
    const created = await criarInvoice();

    const existing = await repository.findInvoice(
      TENANT_ID,
      created.body.invoiceId,
    );
    await repository.updateInvoice(existing!, 'CANCEL_REQUESTED');

    await request(app.getHttpServer())
      .post('/webhook/payments')
      .set('asaas-access-token', WEBHOOK_SECRET)
      .send({
        event: 'PAYMENT_DELETED',
        payment: {
          id: created.body.providerPaymentId,
          status: 'DELETED',
          value: 159.9,
          customer: 'cus_mock_customer-123',
        },
      })
      .expect(200);

    const cancelled = await repository.findInvoice(
      TENANT_ID,
      created.body.invoiceId,
    );
    expect(cancelled?.status).toBe('CANCELLED');

    expect(
      await repository.hasRawProviderEvent(
        `PAYMENT_DELETED:${created.body.providerPaymentId}`,
      ),
    ).toBe(true);
  });
});
