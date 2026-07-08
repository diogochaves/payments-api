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

const futureDate = (daysAhead = 3): string => {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + daysAhead);
  return date.toISOString().slice(0, 10);
};

const PAST_DUE_DATE = '2020-01-01';

const boletoPayload = (overrides: Record<string, unknown> = {}) => ({
  tenantId: TENANT_ID,
  orderId: 'MS-200010',
  customer: {
    id: 'customer-123',
    name: 'Maria Silva',
    document: '12345678909',
    email: 'maria@example.com',
    mobilePhone: '11987654321',
  },
  amount: 250.0,
  currency: 'BRL',
  dueDate: futureDate(3),
  billingType: 'BOLETO',
  provider: 'ASAAS',
  description: 'Pedido MS-200010 - Magazine Siara',
  ...overrides,
});

describe('Criar Invoice Boleto', () => {
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
    process.env.ENABLED_PAYMENT_PROVIDERS = 'ASAAS';
    process.env.DEFAULT_PAYMENT_PROVIDER = 'ASAAS';
    process.env.ASAAS_MOCK = 'true';
    jest.restoreAllMocks();
  });

  describe('Cenário: Criar boleto com sucesso para cliente já vinculado', () => {
    it('retorna invoice OPEN com bankSlipUrl e identificationField', async () => {
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
        .set('Idempotency-Key', 'MS-200010:create')
        .set('X-Correlation-Id', 'corr-boleto-linked')
        .send(boletoPayload())
        .expect(201);

      expect(response.body).toMatchObject({
        orderId: 'MS-200010',
        provider: 'ASAAS',
        status: 'OPEN',
        amount: 250.0,
        currency: 'BRL',
        billingType: 'BOLETO',
        dueDate: futureDate(3),
        providerPaymentId: expect.stringMatching(/^pay_mock_/),
        externalReference: expect.stringMatching(/^inv_/),
        bankSlipUrl: expect.stringMatching(
          /^https:\/\/sandbox\.asaas\.com\/b\/pdf\//,
        ),
        identificationField: expect.stringMatching(/^[0-9]/),
      });

      const saved = await repository.findInvoice(
        TENANT_ID,
        response.body.invoiceId,
      );
      expect(saved?.status).toBe('OPEN');
      expect(saved?.billingType).toBe('BOLETO');
      expect(saved?.bankSlipUrl).toBeDefined();
      expect(saved?.identificationField).toBeDefined();
    });
  });

  describe('Cenário: Criar cliente Asaas antes do boleto quando não houver vínculo', () => {
    it('cria cliente Asaas automaticamente e persiste o vinculo', async () => {
      const response = await request(app.getHttpServer())
        .post('/invoices')
        .set('X-Api-Token', TEST_API_TOKEN)
        .set('Idempotency-Key', 'MS-200010:no-link')
        .send(boletoPayload())
        .expect(201);

      expect(response.body).toMatchObject({
        orderId: 'MS-200010',
        status: 'OPEN',
        providerPaymentId: expect.stringMatching(/^pay_mock_/),
        bankSlipUrl: expect.stringMatching(
          /^https:\/\/sandbox\.asaas\.com\/b\/pdf\//,
        ),
        identificationField: expect.stringMatching(/^[0-9]/),
      });

      const link = await repository.findCustomerLink(
        TENANT_ID,
        'customer-123',
        'ASAAS',
      );
      expect(link?.providerCustomerId).toBeDefined();
    });
  });

  describe('Cenário: Rejeitar boleto com data de vencimento no passado', () => {
    it('rejeita com 400 antes de chamar o provedor', async () => {
      const createChargeSpy = jest.spyOn(asaas, 'createCharge');

      const response = await request(app.getHttpServer())
        .post('/invoices')
        .set('X-Api-Token', TEST_API_TOKEN)
        .set('Idempotency-Key', 'MS-200010:past-due')
        .send(boletoPayload({ dueDate: PAST_DUE_DATE }))
        .expect(400);

      expect(response.body.message).toContain('dueDate must be a future date');
      expect(createChargeSpy).not.toHaveBeenCalled();
    });
  });

  describe('Cenário: Rejeitar boleto sem data de vencimento', () => {
    it('rejeita com 400 sem chamar a Asaas', async () => {
      const createChargeSpy = jest.spyOn(asaas, 'createCharge');

      const payloadWithoutDue = { ...boletoPayload() };
      delete (payloadWithoutDue as { dueDate?: string }).dueDate;

      const response = await request(app.getHttpServer())
        .post('/invoices')
        .set('X-Api-Token', TEST_API_TOKEN)
        .set('Idempotency-Key', 'MS-200010:no-due')
        .send(payloadWithoutDue)
        .expect(400);

      expect(response.body.message).toContain('dueDate');
      expect(createChargeSpy).not.toHaveBeenCalled();
    });
  });

  describe('Cenário: Evitar duplicidade em retentativa do ecommerce', () => {
    it('retorna a mesma invoice em retentativa com mesma Idempotency-Key', async () => {
      const first = await request(app.getHttpServer())
        .post('/invoices')
        .set('X-Api-Token', TEST_API_TOKEN)
        .set('Idempotency-Key', 'MS-200010:create')
        .send(boletoPayload())
        .expect(201);

      const createChargeSpy = jest.spyOn(asaas, 'createCharge');

      const second = await request(app.getHttpServer())
        .post('/invoices')
        .set('X-Api-Token', TEST_API_TOKEN)
        .set('Idempotency-Key', 'MS-200010:create')
        .send(boletoPayload())
        .expect(201);

      expect(second.body).toEqual(first.body);
      expect(second.body.bankSlipUrl).toBeDefined();
      expect(second.body.identificationField).toBeDefined();
      expect(createChargeSpy).not.toHaveBeenCalled();
    });
  });

  describe('Cenário: Rejeitar provedor não habilitado', () => {
    it('rejeita com erro de business quando provedor desabilitado', async () => {
      process.env.ENABLED_PAYMENT_PROVIDERS = 'ITAU';
      const createChargeSpy = jest.spyOn(asaas, 'createCharge');

      const response = await request(app.getHttpServer())
        .post('/invoices')
        .set('X-Api-Token', TEST_API_TOKEN)
        .set('Idempotency-Key', 'MS-200010:provider-disabled')
        .send(boletoPayload())
        .expect(400);

      expect(response.body.message).toBe('Provider ASAAS is not enabled');
      expect(createChargeSpy).not.toHaveBeenCalled();
    });
  });

  describe('Cenário: Falha transiente ao criar boleto no provedor', () => {
    it('marca invoice como FAILED e permite retry seguro', async () => {
      const createChargeSpy = jest
        .spyOn(asaas, 'createCharge')
        .mockRejectedValueOnce(new Error('timeout calling Asaas'));

      const first = await request(app.getHttpServer())
        .post('/invoices')
        .set('X-Api-Token', TEST_API_TOKEN)
        .set('Idempotency-Key', 'MS-200010:transient')
        .send(boletoPayload())
        .expect(503);

      expect(first.body.message).toContain(
        'Failed to create invoice on payment provider',
      );
      expect(createChargeSpy).toHaveBeenCalledTimes(1);

      const failed = await repository.findByIdempotencyKey(
        TENANT_ID,
        'MS-200010:transient',
      );
      expect(failed?.status).toBe('FAILED');
    });
  });

  describe('Cenário: Falha de validação retornada pelo provedor', () => {
    it('marca invoice como FAILED e retorna erro sem expor segredo', async () => {
      const providerError = new Error(
        'invalid_dueDate: dueDate cannot be today',
      );
      jest.spyOn(asaas, 'createCharge').mockRejectedValueOnce(providerError);

      const response = await request(app.getHttpServer())
        .post('/invoices')
        .set('X-Api-Token', TEST_API_TOKEN)
        .set('Idempotency-Key', 'MS-200010:provider-validation')
        .send(boletoPayload())
        .expect(503);

      expect(response.body.message).toContain(
        'Failed to create invoice on payment provider',
      );
      expect(response.body).not.toHaveProperty('bankSlipUrl');
      expect(response.body).not.toHaveProperty('identificationField');

      const failed = await repository.findByIdempotencyKey(
        TENANT_ID,
        'MS-200010:provider-validation',
      );
      expect(failed?.status).toBe('FAILED');
    });
  });
});
