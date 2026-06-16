import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { AsaasService } from '../src/infra/asaas.service';
import { InvoiceRepository } from '../src/modules/invoices/services/invoice-repository.service';

class AsaasServiceStub {
  createCustomer = jest.fn(async (payload) => ({
    id: `cus_stub_${payload.externalReference}`,
    object: 'customer',
    ...payload,
  }));

  createCharge = jest.fn(async (payload) => ({
    id: `pay_stub_${payload.externalReference}`,
    status: 'PENDING',
    invoiceUrl: `https://sandbox.asaas.com/i/${payload.externalReference}`,
    payload: {
      object: 'payment',
      id: `pay_stub_${payload.externalReference}`,
      status: 'PENDING',
      ...payload,
    },
  }));
}

describe('Criar Invoice (acceptance)', () => {
  let app: INestApplication<App>;
  let asaas: AsaasServiceStub;
  let repository: InvoiceRepository;

  const basePayload = {
    tenantId: 'magazine-siara',
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
    dueDate: '2026-06-20',
    billingType: 'PIX',
    provider: 'ASAAS',
    description: 'Pedido MS-100045',
  };

  beforeEach(async () => {
    process.env.INVOICE_REPOSITORY = 'memory';
    process.env.ENABLED_PAYMENT_PROVIDERS = 'ASAAS';
    process.env.DEFAULT_PAYMENT_PROVIDER = 'ASAAS';

    asaas = new AsaasServiceStub();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AsaasService)
      .useValue(asaas)
      .compile();

    app = moduleFixture.createNestApplication();
    repository = moduleFixture.get(InvoiceRepository);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    delete process.env.INVOICE_REPOSITORY;
    delete process.env.ENABLED_PAYMENT_PROVIDERS;
    delete process.env.DEFAULT_PAYMENT_PROVIDER;
  });

  it('cria invoice com sucesso no Asaas usando cliente ja vinculado', async () => {
    await repository.saveCustomerLink({
      tenantId: basePayload.tenantId,
      customerId: basePayload.customer.id,
      provider: 'ASAAS',
      providerCustomerId: 'cus_asaas_123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const response = await request(app.getHttpServer())
      .post('/invoices')
      .set('Idempotency-Key', 'MS-100045:create')
      .send(basePayload)
      .expect(201);

    expect(response.body).toMatchObject({
      orderId: 'MS-100045',
      provider: 'ASAAS',
      providerPaymentId: 'pay_stub_MS-100045',
      status: 'OPEN',
      amount: 159.9,
      currency: 'BRL',
      paymentUrl: 'https://sandbox.asaas.com/i/MS-100045',
      externalReference: 'MS-100045',
    });
    expect(response.body.invoiceId).toMatch(/^inv_/);
    expect(asaas.createCustomer).not.toHaveBeenCalled();
    expect(asaas.createCharge).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_asaas_123',
        billingType: 'PIX',
        value: 159.9,
        dueDate: '2026-06-20',
        description: 'Pedido MS-100045',
        externalReference: 'MS-100045',
      }),
    );
  });

  it('cria cliente Asaas antes da invoice quando nao houver vinculo', async () => {
    await request(app.getHttpServer())
      .post('/invoices')
      .set('Idempotency-Key', 'MS-100045:create')
      .send(basePayload)
      .expect(201);

    expect(asaas.createCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Maria Silva',
        cpfCnpj: '12345678909',
        email: 'maria@example.com',
        mobilePhone: '11987654321',
        externalReference: 'customer-123',
      }),
    );
    expect(asaas.createCharge).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_stub_customer-123',
        externalReference: 'MS-100045',
      }),
    );
  });

  it('evita duplicidade em retentativa do ecommerce', async () => {
    const first = await request(app.getHttpServer())
      .post('/invoices')
      .set('Idempotency-Key', 'MS-100045:create')
      .send(basePayload)
      .expect(201);

    const second = await request(app.getHttpServer())
      .post('/invoices')
      .set('Idempotency-Key', 'MS-100045:create')
      .send(basePayload)
      .expect(201);

    expect(second.body).toEqual(first.body);
    expect(asaas.createCustomer).toHaveBeenCalledTimes(1);
    expect(asaas.createCharge).toHaveBeenCalledTimes(1);
  });

  it('rejeita provedor nao habilitado sem chamar a API da Asaas', async () => {
    process.env.ENABLED_PAYMENT_PROVIDERS = 'ITAU';

    const response = await request(app.getHttpServer())
      .post('/invoices')
      .set('Idempotency-Key', 'MS-100045:create')
      .send(basePayload)
      .expect(400);

    expect(response.body.message).toBe('Provider ASAAS is not enabled');
    expect(asaas.createCustomer).not.toHaveBeenCalled();
    expect(asaas.createCharge).not.toHaveBeenCalled();
  });

  it('marca falha transiente do provedor como erro recuperavel para retry seguro', async () => {
    asaas.createCharge.mockRejectedValueOnce(new Error('timeout'));

    const response = await request(app.getHttpServer())
      .post('/invoices')
      .set('Idempotency-Key', 'MS-100045:create')
      .send(basePayload)
      .expect(503);

    expect(response.body).toMatchObject({
      message: 'Failed to create invoice on payment provider',
      provider: 'ASAAS',
      orderId: 'MS-100045',
      detail: 'timeout',
    });
    expect(asaas.createCharge).toHaveBeenCalledTimes(1);
  });

  it('retorna erro claro quando o provedor rejeita dados invalidos', async () => {
    asaas.createCustomer.mockRejectedValueOnce(
      new Error('invalid_mobilePhone: O celular informado é inválido.'),
    );

    const response = await request(app.getHttpServer())
      .post('/invoices')
      .set('Idempotency-Key', 'MS-100045:create')
      .send({
        ...basePayload,
        customer: {
          ...basePayload.customer,
          mobilePhone: '11999999999',
        },
      })
      .expect(503);

    expect(response.body).toMatchObject({
      message: 'Failed to create invoice on payment provider',
      provider: 'ASAAS',
      orderId: 'MS-100045',
      detail: 'invalid_mobilePhone: O celular informado é inválido.',
    });
    expect(JSON.stringify(response.body)).not.toContain('ASAAS_TOKEN');
  });
});
