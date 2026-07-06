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

describe('Criar Invoice', () => {
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

  afterEach(() => {
    jest.restoreAllMocks();
    process.env.ENABLED_PAYMENT_PROVIDERS = 'ASAAS';
    process.env.DEFAULT_PAYMENT_PROVIDER = 'ASAAS';
    process.env.ASAAS_MOCK = 'true';
    delete process.env.ASAAS_URL;
  });

  describe('Criação bem-sucedida', () => {
    it('cria invoice PIX com cliente ja vinculado ao Asaas', async () => {
      await repository.saveCustomerLink({
        tenantId: TENANT_ID,
        customerId: 'customer-123',
        provider: 'ASAAS',
        providerCustomerId: 'cus_asaas_123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const response = await request(app.getHttpServer())
        .post('/invoices')
        .set('X-Api-Token', TEST_API_TOKEN)
        .set('Idempotency-Key', 'MS-100045:create')
        .set('X-Correlation-Id', 'corr-create-linked')
        .send(BASE_PAYLOAD)
        .expect(201);

      expect(response.body).toMatchObject({
        orderId: 'MS-100045',
        provider: 'ASAAS',
        status: 'OPEN',
        amount: 159.9,
        currency: 'BRL',
        externalReference: 'MS-100045',
        providerPaymentId: 'pay_mock_MS-100045',
        paymentUrl: 'https://sandbox.asaas.com/i/pay_mock_MS-100045',
      });
      expect(response.body.invoiceId).toMatch(/^inv_/);
    });

    it('cria invoice de cartao hospedado', async () => {
      const response = await request(app.getHttpServer())
        .post('/invoices')
        .set('X-Api-Token', TEST_API_TOKEN)
        .set('Idempotency-Key', 'MS-100045:credit-card-hosted')
        .send({ ...BASE_PAYLOAD, billingType: 'CREDIT_CARD' })
        .expect(201);

      expect(response.body).toMatchObject({
        orderId: 'MS-100045',
        status: 'OPEN',
        providerPaymentId: 'pay_mock_MS-100045',
      });
    });

    it('cria cliente Asaas automaticamente quando nao ha vinculo previo', async () => {
      const response = await request(app.getHttpServer())
        .post('/invoices')
        .set('X-Api-Token', TEST_API_TOKEN)
        .set('Idempotency-Key', 'MS-100045:create')
        .send(BASE_PAYLOAD)
        .expect(201);

      expect(response.body).toMatchObject({
        status: 'OPEN',
        orderId: 'MS-100045',
        providerPaymentId: 'pay_mock_MS-100045',
      });

      const saved = await repository.findInvoice(TENANT_ID, response.body.invoiceId);
      expect(saved?.status).toBe('OPEN');
      expect(saved?.providerPaymentId).toBe('pay_mock_MS-100045');
    });

    it('retorna a mesma invoice em retentativa com mesma chave de idempotencia', async () => {
      const first = await request(app.getHttpServer())
        .post('/invoices')
        .set('X-Api-Token', TEST_API_TOKEN)
        .set('Idempotency-Key', 'MS-100045:create')
        .send(BASE_PAYLOAD)
        .expect(201);

      const second = await request(app.getHttpServer())
        .post('/invoices')
        .set('X-Api-Token', TEST_API_TOKEN)
        .set('Idempotency-Key', 'MS-100045:create')
        .send(BASE_PAYLOAD)
        .expect(201);

      expect(second.body).toEqual(first.body);
    });
  });

  describe('Validação de payload', () => {
    it('rejeita payload de cartao tokenizado enquanto o fluxo e hospedado', async () => {
      const response = await request(app.getHttpServer())
        .post('/invoices')
        .set('X-Api-Token', TEST_API_TOKEN)
        .set('Idempotency-Key', 'MS-100045:tokenized')
        .send({ ...BASE_PAYLOAD, billingType: 'CREDIT_CARD', creditCardToken: 'tok_xyz', remoteIp: '127.0.0.1' })
        .expect(400);

      expect(response.body.message).toContain('Hosted credit card flow does not accept card data fields');
    });

    it('rejeita provedor nao habilitado no ambiente', async () => {
      process.env.ENABLED_PAYMENT_PROVIDERS = 'ITAU';

      const response = await request(app.getHttpServer())
        .post('/invoices')
        .set('X-Api-Token', TEST_API_TOKEN)
        .set('Idempotency-Key', 'MS-100045:create')
        .send(BASE_PAYLOAD)
        .expect(400);

      expect(response.body.message).toBe('Provider ASAAS is not enabled');
    });
  });

  describe('Falhas do provedor', () => {
    it('retorna 503 em falha transiente do provedor de pagamento', async () => {
      jest.spyOn(asaas, 'createCharge').mockRejectedValueOnce(new Error('timeout'));

      const response = await request(app.getHttpServer())
        .post('/invoices')
        .set('X-Api-Token', TEST_API_TOKEN)
        .set('Idempotency-Key', 'MS-100045:create')
        .send(BASE_PAYLOAD)
        .expect(503);

      expect(response.body).toMatchObject({
        message: 'Failed to create invoice on payment provider',
        provider: 'ASAAS',
        orderId: 'MS-100045',
        detail: 'timeout',
      });
    });

    it('retorna 503 quando provedor rejeita dados invalidos do cliente', async () => {
      jest
        .spyOn(asaas, 'createCustomer')
        .mockRejectedValueOnce(new Error('invalid_mobilePhone: O celular informado é inválido.'));

      const response = await request(app.getHttpServer())
        .post('/invoices')
        .set('X-Api-Token', TEST_API_TOKEN)
        .set('Idempotency-Key', 'MS-100045:create')
        .send(BASE_PAYLOAD)
        .expect(503);

      expect(response.body).toMatchObject({
        message: 'Failed to create invoice on payment provider',
        provider: 'ASAAS',
        detail: 'invalid_mobilePhone: O celular informado é inválido.',
      });
      expect(JSON.stringify(response.body)).not.toContain('ASAAS_TOKEN');
    });

    it('retorna 503 quando provedor nao retorna identificador da cobranca', async () => {
      jest.spyOn(asaas, 'createCharge').mockResolvedValueOnce({
        id: '',
        status: 'PENDING',
        value: 159.9,
        dueDate: '2027-12-31',
        billingType: 'PIX',
        externalReference: 'MS-100045',
        invoiceUrl: 'https://sandbox.asaas.com/i/missing',
        payload: {},
      });

      const response = await request(app.getHttpServer())
        .post('/invoices')
        .set('X-Api-Token', TEST_API_TOKEN)
        .set('Idempotency-Key', 'MS-100045:create')
        .send(BASE_PAYLOAD)
        .expect(503);

      expect(response.body.detail).toBe('provider_contract_violation: missing payment id');
    });

    it('mapeia cobranca ja confirmada na sandbox como conflito de negocio', async () => {
      process.env.ASAAS_MOCK = 'false';
      process.env.ASAAS_URL = 'https://api-sandbox.asaas.com';

      jest
        .spyOn(asaas, 'confirmSandboxPayment')
        .mockRejectedValueOnce(
          Object.assign(new Error('invalid_action: Cobrança já confirmada.'), { status: 400 }),
        );

      const response = await request(app.getHttpServer())
        .post('/sandbox/asaas/payments/pay_already_confirmed/confirm')
        .expect(409);

      expect(response.body.message).toBe('invalid_action: Cobrança já confirmada.');
    });
  });
});
