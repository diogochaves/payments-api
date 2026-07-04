/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { INestApplication } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { AsaasService } from '../src/infra/asaas.service';
import { InvoiceRepository } from '../src/modules/invoices/services/invoice-repository.service';
import { setupTestTables, truncateAllTables } from './dynamo-test-utils';

class AsaasServiceStub {
  createCustomer = jest.fn(async (payload) => ({
    id: `cus_stub_${payload.externalReference}`,
    object: 'customer',
    ...payload,
  }));

  createCharge = jest.fn(async (payload) => ({
    id: `pay_stub_${payload.externalReference}`,
    status: 'PENDING',
    value: payload.value,
    dueDate: payload.dueDate,
    billingType: payload.billingType,
    externalReference: payload.externalReference,
    invoiceUrl: `https://sandbox.asaas.com/i/${payload.externalReference}`,
    payload: {
      object: 'payment',
      id: `pay_stub_${payload.externalReference}`,
      status: 'PENDING',
      invoiceUrl: `https://sandbox.asaas.com/i/${payload.externalReference}`,
      ...payload,
    },
  }));

  cancelCharge = jest.fn(async (providerPaymentId: string) => ({
    id: providerPaymentId,
    status: 'DELETED',
  }));

  confirmSandboxPayment = jest.fn(async (providerPaymentId: string) => ({
    id: providerPaymentId,
    status: 'CONFIRMED',
  }));
}

describe('Criar Invoice (acceptance)', () => {
  let app: INestApplication<App>;
  let asaas: AsaasServiceStub;
  let repository: InvoiceRepository;
  let emitSpy: jest.SpyInstance;

  beforeAll(async () => {
    process.env.AWS_DYNAMODB_ENDPOINT ??=
      'http://localhost.localstack.cloud:4566';
    await setupTestTables();
  });

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
    await truncateAllTables();
    process.env.ENABLED_PAYMENT_PROVIDERS = 'ASAAS';
    process.env.DEFAULT_PAYMENT_PROVIDER = 'ASAAS';
    process.env.ASAAS_MOCK = 'true';
    process.env.ASAAS_WEBHOOK_TOKEN = 'webhook-secret';
    process.env.WEBHOOK_PROCESSING_MODE = 'sync';
    delete process.env.WEBHOOK_QUEUE_URL;
    delete process.env.WEBHOOK_DLQ_URL;

    asaas = new AsaasServiceStub();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AsaasService)
      .useValue(asaas)
      .compile();

    app = moduleFixture.createNestApplication();
    repository = moduleFixture.get(InvoiceRepository);
    emitSpy = jest.spyOn(moduleFixture.get(EventEmitter2), 'emit');
    await app.init();
  });

  afterEach(async () => {
    emitSpy.mockRestore();
    await app.close();
    delete process.env.ENABLED_PAYMENT_PROVIDERS;
    delete process.env.DEFAULT_PAYMENT_PROVIDER;
    delete process.env.ASAAS_MOCK;
    delete process.env.ASAAS_URL;
    delete process.env.ASAAS_WEBHOOK_TOKEN;
    delete process.env.WEBHOOK_PROCESSING_MODE;
    delete process.env.WEBHOOK_QUEUE_URL;
    delete process.env.WEBHOOK_DLQ_URL;
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
      .set('X-Correlation-Id', 'corr-create-linked')
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
    expect(observableEventKeys()).toEqual(
      expect.arrayContaining([
        'pagamento.cobranca.checkout.intencao.de.pagamento.salva',
        'pagamento.processamento.pagamentos.cliente.encontrado.view',
        'pagamento.processamento.pagamentos.pagamento.pendente',
        'pagamento.processamento.pagamentos.fatura.criada',
      ]),
    );
    expect(
      observableEvent('pagamento.processamento.pagamentos.fatura.criada'),
    ).toMatchObject({
      event_key: 'pagamento.processamento.pagamentos.fatura.criada',
      env: 'dev',
      stage: 'fatura_criada',
      correlationId: 'corr-create-linked',
      tenantId: 'magazine-siara',
      orderId: 'MS-100045',
      provider: 'ASAAS',
      providerPaymentId: 'pay_stub_MS-100045',
      providerStatus: 'PENDING',
      paymentUrl: 'https://sandbox.asaas.com/i/MS-100045',
      amount: 159.9,
      dueDate: '2026-06-20',
      billingType: 'PIX',
    });
  });

  it('mapeia cobranca ja confirmada na Sandbox da Asaas como conflito de negocio', async () => {
    asaas.confirmSandboxPayment.mockRejectedValueOnce(
      Object.assign(new Error('invalid_action: Cobrança já confirmada.'), {
        status: 400,
      }),
    );
    process.env.ASAAS_MOCK = 'false';
    process.env.ASAAS_URL = 'https://api-sandbox.asaas.com/v3';

    const response = await request(app.getHttpServer())
      .post('/sandbox/asaas/payments/pay_already_confirmed/confirm')
      .expect(409);

    expect(response.body.message).toBe(
      'invalid_action: Cobrança já confirmada.',
    );
  });

  it('cria invoice de cartao hospedado usando o contrato generico do Asaas', async () => {
    const response = await request(app.getHttpServer())
      .post('/invoices')
      .set('Idempotency-Key', 'MS-100045:credit-card-hosted')
      .set('X-Correlation-Id', 'corr-credit-card-hosted')
      .send({
        ...basePayload,
        billingType: 'CREDIT_CARD',
        description: 'Pedido MS-100045 com cartao hospedado',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      orderId: 'MS-100045',
      provider: 'ASAAS',
      providerPaymentId: 'pay_stub_MS-100045',
      status: 'OPEN',
      paymentUrl: 'https://sandbox.asaas.com/i/MS-100045',
      externalReference: 'MS-100045',
    });
    expect(asaas.createCharge).toHaveBeenCalledWith(
      expect.objectContaining({
        billingType: 'CREDIT_CARD',
        description: 'Pedido MS-100045 com cartao hospedado',
        externalReference: 'MS-100045',
      }),
    );
    expect(
      observableEvent('pagamento.processamento.pagamentos.fatura.criada'),
    ).toMatchObject({
      billingType: 'CREDIT_CARD',
      paymentUrl: 'https://sandbox.asaas.com/i/MS-100045',
      providerOperation: 'POST /v3/payments',
    });
  });

  it('rejeita payload de cartao tokenizado enquanto o primeiro slice e hospedado', async () => {
    const response = await request(app.getHttpServer())
      .post('/invoices')
      .set('Idempotency-Key', 'MS-100045:credit-card-tokenized')
      .set('X-Correlation-Id', 'corr-credit-card-tokenized')
      .send({
        ...basePayload,
        billingType: 'CREDIT_CARD',
        creditCardToken: 'card_token_sandbox',
        remoteIp: '127.0.0.1',
      })
      .expect(400);

    expect(response.body.message).toContain(
      'Hosted credit card flow does not accept card data fields',
    );
    expect(asaas.createCharge).not.toHaveBeenCalled();
  });

  it('cria cliente Asaas antes da invoice quando nao houver vinculo', async () => {
    await request(app.getHttpServer())
      .post('/invoices')
      .set('Idempotency-Key', 'MS-100045:create')
      .set('X-Correlation-Id', 'corr-create-new-customer')
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
    expect(observableEventKeys()).toEqual(
      expect.arrayContaining([
        'pagamento.cobranca.checkout.intencao.de.pagamento.salva',
        'pagamento.cobranca.cadastrada.cliente.nao.encontrado.failure',
        'pagamento.cobranca.cadastrada.cliente.cadastrado',
        'pagamento.processamento.pagamentos.pagamento.pendente',
        'pagamento.processamento.pagamentos.fatura.criada',
      ]),
    );
  });

  it('evita duplicidade em retentativa do ecommerce', async () => {
    const first = await request(app.getHttpServer())
      .post('/invoices')
      .set('Idempotency-Key', 'MS-100045:create')
      .set('X-Correlation-Id', 'corr-idempotent-first')
      .send(basePayload)
      .expect(201);

    const second = await request(app.getHttpServer())
      .post('/invoices')
      .set('Idempotency-Key', 'MS-100045:create')
      .set('X-Correlation-Id', 'corr-idempotent-second')
      .send(basePayload)
      .expect(201);

    expect(second.body).toEqual(first.body);
    expect(second.body).toMatchObject({
      invoiceId: first.body.invoiceId,
      providerPaymentId: first.body.providerPaymentId,
      paymentUrl: first.body.paymentUrl,
      externalReference: first.body.externalReference,
    });
    expect(asaas.createCustomer).toHaveBeenCalledTimes(1);
    expect(asaas.createCharge).toHaveBeenCalledTimes(1);
  });

  it('rejeita provedor nao habilitado sem chamar a API da Asaas', async () => {
    process.env.ENABLED_PAYMENT_PROVIDERS = 'ITAU';

    const response = await request(app.getHttpServer())
      .post('/invoices')
      .set('Idempotency-Key', 'MS-100045:create')
      .set('X-Correlation-Id', 'corr-provider-disabled')
      .send(basePayload)
      .expect(400);

    expect(response.body.message).toBe('Provider ASAAS is not enabled');
    expect(asaas.createCustomer).not.toHaveBeenCalled();
    expect(asaas.createCharge).not.toHaveBeenCalled();
    expect(
      observableEvent(
        'pagamento.cobranca.checkout.intencao.de.pagamento.salva_exception',
      ),
    ).toMatchObject({
      event_key:
        'pagamento.cobranca.checkout.intencao.de.pagamento.salva_exception',
      stage: 'pagamento_salva',
      correlationId: 'corr-provider-disabled',
      errorType: 'provider_not_enabled',
      retryable: false,
    });
  });

  it('marca falha transiente do provedor como erro recuperavel para retry seguro', async () => {
    asaas.createCharge.mockRejectedValueOnce(new Error('timeout'));

    const response = await request(app.getHttpServer())
      .post('/invoices')
      .set('Idempotency-Key', 'MS-100045:create')
      .set('X-Correlation-Id', 'corr-provider-timeout')
      .send(basePayload)
      .expect(503);

    expect(response.body).toMatchObject({
      message: 'Failed to create invoice on payment provider',
      provider: 'ASAAS',
      orderId: 'MS-100045',
      detail: 'timeout',
    });
    expect(asaas.createCharge).toHaveBeenCalledTimes(1);
    expect(
      observableEvent(
        'pagamento.processamento.pagamentos.pagamento.pendente_exception',
      ),
    ).toMatchObject({
      event_key:
        'pagamento.processamento.pagamentos.pagamento.pendente_exception',
      stage: 'pagamento_pendente',
      correlationId: 'corr-provider-timeout',
      errorType: 'provider_error',
      errorCode: 'timeout',
      retryable: true,
    });
    expect(
      observableEvent(
        'pagamento.processamento.pagamentos.fatura.criada_exception',
      ),
    ).toMatchObject({
      event_key: 'pagamento.processamento.pagamentos.fatura.criada_exception',
      stage: 'fatura_criada',
      errorType: 'provider_error',
    });
  });

  it('retorna erro claro quando o provedor rejeita dados invalidos', async () => {
    asaas.createCustomer.mockRejectedValueOnce(
      new Error('invalid_mobilePhone: O celular informado é inválido.'),
    );

    const response = await request(app.getHttpServer())
      .post('/invoices')
      .set('Idempotency-Key', 'MS-100045:create')
      .set('X-Correlation-Id', 'corr-invalid-customer')
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
    expect(
      observableEvent(
        'pagamento.cobranca.cadastrada.cliente.cadastrado_exception',
      ),
    ).toMatchObject({
      event_key: 'pagamento.cobranca.cadastrada.cliente.cadastrado_exception',
      stage: 'cliente_cadastrado',
      correlationId: 'corr-invalid-customer',
      errorType: 'provider_error',
      retryable: false,
    });
    expect(
      JSON.stringify(
        observableEvent(
          'pagamento.cobranca.cadastrada.cliente.cadastrado_exception',
        ),
      ),
    ).not.toContain('11999999999');
  });

  it('valida a cobranca criada no Asaas como criterio fundamental de aceite', async () => {
    const response = await request(app.getHttpServer())
      .post('/invoices')
      .set('Idempotency-Key', 'MS-100045:create')
      .set('X-Correlation-Id', 'corr-provider-contract')
      .send(basePayload)
      .expect(201);

    expect(response.body).toMatchObject({
      orderId: 'MS-100045',
      providerPaymentId: 'pay_stub_MS-100045',
      status: 'OPEN',
      amount: 159.9,
      paymentUrl: 'https://sandbox.asaas.com/i/MS-100045',
      externalReference: 'MS-100045',
    });
    expect(asaas.createCharge).toHaveBeenCalledWith(
      expect.objectContaining({
        value: 159.9,
        dueDate: '2026-06-20',
        billingType: 'PIX',
        externalReference: 'MS-100045',
      }),
    );
    expect(
      observableEvent('pagamento.processamento.pagamentos.fatura.criada'),
    ).toMatchObject({
      providerPaymentId: 'pay_stub_MS-100045',
      providerStatus: 'PENDING',
      paymentUrl: 'https://sandbox.asaas.com/i/MS-100045',
      amount: 159.9,
      dueDate: '2026-06-20',
      billingType: 'PIX',
    });
  });

  it('bloqueia sucesso falso quando o Asaas nao retorna identificador da cobranca', async () => {
    asaas.createCharge.mockResolvedValueOnce({
      id: '',
      status: 'PENDING',
      value: 159.9,
      dueDate: '2026-06-20',
      billingType: 'PIX',
      externalReference: 'MS-100045',
      invoiceUrl: 'https://sandbox.asaas.com/i/missing-id',
      payload: {},
    });

    const response = await request(app.getHttpServer())
      .post('/invoices')
      .set('Idempotency-Key', 'MS-100045:create')
      .set('X-Correlation-Id', 'corr-contract-violation')
      .send(basePayload)
      .expect(503);

    expect(response.body.detail).toBe(
      'provider_contract_violation: missing payment id',
    );
    expect(
      observableEvent('pagamento.processamento.pagamentos.fatura.criada'),
    ).toBeUndefined();
    expect(
      observableEvent(
        'pagamento.processamento.pagamentos.fatura.criada_exception',
      ),
    ).toMatchObject({
      event_key: 'pagamento.processamento.pagamentos.fatura.criada_exception',
      stage: 'fatura_criada',
      provider: 'ASAAS',
      errorType: 'provider_contract_violation',
      errorCode: 'provider_contract_violation: missing payment id',
    });
  });

  describe('Cancelar Invoice', () => {
    it('cancela invoice aberta com sucesso no Asaas', async () => {
      const created = await request(app.getHttpServer())
        .post('/invoices')
        .set('Idempotency-Key', 'MS-100045:create')
        .set('X-Correlation-Id', 'corr-cancel-create')
        .send(basePayload)
        .expect(201);

      const response = await request(app.getHttpServer())
        .delete(`/invoices/${created.body.invoiceId}`)
        .set('X-Tenant-Id', basePayload.tenantId)
        .set('Idempotency-Key', 'MS-100045:cancel')
        .set('X-Correlation-Id', 'corr-cancel-success')
        .expect(200);

      expect(response.body).toMatchObject({
        invoiceId: created.body.invoiceId,
        orderId: 'MS-100045',
        provider: 'ASAAS',
        providerPaymentId: 'pay_stub_MS-100045',
        status: 'CANCELLED',
      });
      expect(asaas.cancelCharge).toHaveBeenCalledWith('pay_stub_MS-100045');
      expect(observableEventKeys()).toEqual(
        expect.arrayContaining([
          'pagamento.cancelamento.cobranca.cancelamento.solicitado',
          'pagamento.cancelamento.cobranca.cancelada',
        ]),
      );
      expect(emitSpy).toHaveBeenCalledWith(
        'payment.cancelled',
        expect.objectContaining({
          invoiceId: created.body.invoiceId,
          orderId: 'MS-100045',
          provider: 'ASAAS',
          providerPaymentId: 'pay_stub_MS-100045',
        }),
      );
    });

    it('nao chama Asaas novamente quando cancelamento e repetido com mesma idempotencia', async () => {
      const created = await request(app.getHttpServer())
        .post('/invoices')
        .set('Idempotency-Key', 'MS-100045:create')
        .send(basePayload)
        .expect(201);

      const first = await request(app.getHttpServer())
        .delete(`/invoices/${created.body.invoiceId}`)
        .set('X-Tenant-Id', basePayload.tenantId)
        .set('Idempotency-Key', 'MS-100045:cancel')
        .expect(200);

      const second = await request(app.getHttpServer())
        .delete(`/invoices/${created.body.invoiceId}`)
        .set('X-Tenant-Id', basePayload.tenantId)
        .set('Idempotency-Key', 'MS-100045:cancel')
        .expect(200);

      expect(second.body).toEqual(first.body);
      expect(second.body.status).toBe('CANCELLED');
      expect(asaas.cancelCharge).toHaveBeenCalledTimes(1);
    });

    it('impede cancelamento apos pagamento confirmado', async () => {
      const created = await request(app.getHttpServer())
        .post('/invoices')
        .set('Idempotency-Key', 'MS-100045:create')
        .send(basePayload)
        .expect(201);

      const existing = await repository.findInvoice(
        basePayload.tenantId,
        created.body.invoiceId,
      );
      await repository.updateInvoice(existing!, 'CONFIRMED');

      const response = await request(app.getHttpServer())
        .delete(`/invoices/${created.body.invoiceId}`)
        .set('X-Tenant-Id', basePayload.tenantId)
        .set('Idempotency-Key', 'MS-100045:cancel')
        .expect(400);

      expect(response.body.message).toBe(
        'Invoice cancellation after confirmation requires refund flow',
      );
      expect(asaas.cancelCharge).not.toHaveBeenCalled();
    });

    it('mantem invoice para investigacao quando provedor informa cobranca inexistente', async () => {
      const created = await request(app.getHttpServer())
        .post('/invoices')
        .set('Idempotency-Key', 'MS-100045:create')
        .send(basePayload)
        .expect(201);

      asaas.cancelCharge.mockRejectedValueOnce(
        Object.assign(new Error('payment not found'), { status: 404 }),
      );

      const response = await request(app.getHttpServer())
        .delete(`/invoices/${created.body.invoiceId}`)
        .set('X-Tenant-Id', basePayload.tenantId)
        .set('Idempotency-Key', 'MS-100045:cancel')
        .expect(409);

      expect(response.body.message).toBe(
        'Payment provider cancellation requires operational reconciliation',
      );
      expect(response.body.status).toBe('CANCEL_RECONCILIATION_REQUIRED');
      expect(emitSpy).not.toHaveBeenCalledWith(
        'payment.cancelled',
        expect.anything(),
      );
    });

    it('confirma cancelamento por webhook PAYMENT_DELETED sem duplicar evento canonico', async () => {
      const created = await request(app.getHttpServer())
        .post('/invoices')
        .set('Idempotency-Key', 'MS-100045:create')
        .send(basePayload)
        .expect(201);
      const existing = await repository.findInvoice(
        basePayload.tenantId,
        created.body.invoiceId,
      );
      await repository.updateInvoice(existing!, 'CANCEL_REQUESTED');

      await request(app.getHttpServer())
        .post('/webhook/payments')
        .set('asaas-access-token', 'webhook-secret')
        .send({
          event: 'PAYMENT_DELETED',
          payment: {
            id: created.body.providerPaymentId,
            status: 'DELETED',
            value: 159.9,
            customer: 'cus_stub_customer-123',
          },
        })
        .expect(200);

      const cancelled = await repository.findInvoice(
        basePayload.tenantId,
        created.body.invoiceId,
      );
      expect(cancelled?.status).toBe('CANCELLED');
      expect(
        await repository.hasRawProviderEvent(
          `PAYMENT_DELETED:${created.body.providerPaymentId}`,
        ),
      ).toBe(true);
      expect(emitSpy).not.toHaveBeenCalledWith(
        'payment.cancelled',
        expect.anything(),
      );
      expect(
        observableEvent(
          'pagamento.cancelamento.webhook.cancelamento.confirmado',
        ),
      ).toMatchObject({
        event_key: 'pagamento.cancelamento.webhook.cancelamento.confirmado',
        stage: 'webhook_cancelamento',
        providerPaymentId: created.body.providerPaymentId,
      });
    });
  });

  describe('Confirmar Pagamento', () => {
    it('confirma pagamento com webhook PAYMENT_CONFIRMED autenticado', async () => {
      const created = await request(app.getHttpServer())
        .post('/invoices')
        .set('Idempotency-Key', 'MS-100045:create')
        .send(basePayload)
        .expect(201);

      await request(app.getHttpServer())
        .post('/webhook/payments')
        .set('asaas-access-token', 'webhook-secret')
        .send({
          event: 'PAYMENT_CONFIRMED',
          payment: {
            id: created.body.providerPaymentId,
            status: 'CONFIRMED',
            value: 159.9,
            customer: 'cus_stub_customer-123',
            confirmedDate: '2026-06-21',
          },
        })
        .expect(200);

      const invoice = await repository.findInvoice(
        basePayload.tenantId,
        created.body.invoiceId,
      );
      expect(invoice?.status).toBe('CONFIRMED');
      expect(
        await repository.hasRawProviderEvent(
          `PAYMENT_CONFIRMED:${created.body.providerPaymentId}`,
        ),
      ).toBe(true);
      expect(emitSpy).toHaveBeenCalledWith(
        'payment.confirmed',
        expect.objectContaining({
          invoiceId: created.body.invoiceId,
          orderId: 'MS-100045',
          provider: 'ASAAS',
          providerPaymentId: created.body.providerPaymentId,
          confirmedAt: expect.any(String),
        }),
      );
    });

    it('concilia PAYMENT_RECEIVED sem liberar pedido novamente', async () => {
      const created = await request(app.getHttpServer())
        .post('/invoices')
        .set('Idempotency-Key', 'MS-100045:create')
        .send(basePayload)
        .expect(201);
      const existing = await repository.findInvoice(
        basePayload.tenantId,
        created.body.invoiceId,
      );
      await repository.updateInvoice(existing!, 'CONFIRMED');

      await request(app.getHttpServer())
        .post('/webhook/payments')
        .set('asaas-access-token', 'webhook-secret')
        .send({
          event: 'PAYMENT_RECEIVED',
          payment: {
            id: created.body.providerPaymentId,
            status: 'RECEIVED',
            value: 159.9,
            customer: 'cus_stub_customer-123',
            paymentDate: '2026-06-22',
          },
        })
        .expect(200);

      const invoice = await repository.findInvoice(
        basePayload.tenantId,
        created.body.invoiceId,
      );
      expect(invoice?.status).toBe('RECEIVED');
      expect(emitSpy).not.toHaveBeenCalledWith(
        'payment.confirmed',
        expect.anything(),
      );
    });

    it('rejeita webhook com token invalido sem alterar estado', async () => {
      const created = await request(app.getHttpServer())
        .post('/invoices')
        .set('Idempotency-Key', 'MS-100045:create')
        .send(basePayload)
        .expect(201);

      await request(app.getHttpServer())
        .post('/webhook/payments')
        .set('asaas-access-token', 'wrong-token')
        .send({
          event: 'PAYMENT_CONFIRMED',
          payment: {
            id: created.body.providerPaymentId,
            status: 'CONFIRMED',
            value: 159.9,
            customer: 'cus_stub_customer-123',
          },
        })
        .expect(401);

      const invoice = await repository.findInvoice(
        basePayload.tenantId,
        created.body.invoiceId,
      );
      expect(invoice?.status).toBe('OPEN');
      expect(emitSpy).not.toHaveBeenCalledWith(
        'payment.confirmed',
        expect.anything(),
      );
      expect(
        await repository.hasRawProviderEvent(
          `PAYMENT_CONFIRMED:${created.body.providerPaymentId}`,
        ),
      ).toBe(false);
    });

    it('trata PAYMENT_CONFIRMED duplicado como sucesso tecnico sem evento duplicado', async () => {
      const created = await request(app.getHttpServer())
        .post('/invoices')
        .set('Idempotency-Key', 'MS-100045:create')
        .send(basePayload)
        .expect(201);

      const webhook = {
        event: 'PAYMENT_CONFIRMED',
        payment: {
          id: created.body.providerPaymentId,
          status: 'CONFIRMED',
          value: 159.9,
          customer: 'cus_stub_customer-123',
        },
      };

      await request(app.getHttpServer())
        .post('/webhook/payments')
        .set('asaas-access-token', 'webhook-secret')
        .send(webhook)
        .expect(200);
      await request(app.getHttpServer())
        .post('/webhook/payments')
        .set('asaas-access-token', 'webhook-secret')
        .send(webhook)
        .expect(200);

      expect(
        emitSpy.mock.calls.filter(
          ([eventName]) => eventName === 'payment.confirmed',
        ),
      ).toHaveLength(1);
    });

    it('correlaciona confirmacao por externalReference antes de consolidar providerPaymentId', async () => {
      const created = await request(app.getHttpServer())
        .post('/invoices')
        .set('Idempotency-Key', 'MS-100045:create')
        .send(basePayload)
        .expect(201);
      const existing = await repository.findInvoice(
        basePayload.tenantId,
        created.body.invoiceId,
      );
      await repository.updateInvoice(existing!, 'OPEN', {
        providerPaymentId: undefined,
      });

      await request(app.getHttpServer())
        .post('/webhook/payments')
        .set('asaas-access-token', 'webhook-secret')
        .send({
          event: 'PAYMENT_CONFIRMED',
          payment: {
            id: 'pay_asaas_early',
            status: 'CONFIRMED',
            value: 159.9,
            customer: 'cus_stub_customer-123',
            externalReference: 'MS-100045',
          },
        })
        .expect(200);

      const invoice = await repository.findInvoice(
        basePayload.tenantId,
        created.body.invoiceId,
      );
      expect(invoice?.status).toBe('CONFIRMED');
      expect(invoice?.providerPaymentId).toBe('pay_asaas_early');
    });

    it('registra PAYMENT_OVERDUE sem publicar payment.confirmed', async () => {
      const created = await request(app.getHttpServer())
        .post('/invoices')
        .set('Idempotency-Key', 'MS-100045:create')
        .send(basePayload)
        .expect(201);

      await request(app.getHttpServer())
        .post('/webhook/payments')
        .set('asaas-access-token', 'webhook-secret')
        .send({
          event: 'PAYMENT_OVERDUE',
          payment: {
            id: created.body.providerPaymentId,
            status: 'OVERDUE',
            value: 159.9,
            customer: 'cus_stub_customer-123',
          },
        })
        .expect(200);

      const invoice = await repository.findInvoice(
        basePayload.tenantId,
        created.body.invoiceId,
      );
      expect(invoice?.status).toBe('OPEN');
      expect(
        await repository.hasRawProviderEvent(
          `PAYMENT_OVERDUE:${created.body.providerPaymentId}`,
        ),
      ).toBe(true);
      expect(emitSpy).not.toHaveBeenCalledWith(
        'payment.confirmed',
        expect.anything(),
      );
    });

    it('registra PAYMENT_AUTHORIZED de cartao sem liberar pedido', async () => {
      const created = await request(app.getHttpServer())
        .post('/invoices')
        .set('Idempotency-Key', 'MS-100045:credit-card-hosted')
        .send({
          ...basePayload,
          billingType: 'CREDIT_CARD',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/webhook/payments')
        .set('asaas-access-token', 'webhook-secret')
        .send({
          event: 'PAYMENT_AUTHORIZED',
          payment: {
            id: created.body.providerPaymentId,
            status: 'AUTHORIZED',
            value: 159.9,
            customer: 'cus_stub_customer-123',
          },
        })
        .expect(200);

      const invoice = await repository.findInvoice(
        basePayload.tenantId,
        created.body.invoiceId,
      );
      expect(invoice?.status).toBe('OPEN');
      expect(emitSpy).not.toHaveBeenCalledWith(
        'payment.confirmed',
        expect.anything(),
      );
      expect(
        observableEvent('pagamento.cartao.webhook.pagamento.autorizado'),
      ).toMatchObject({
        providerStatus: 'AUTHORIZED',
        cardEvent: true,
      });
    });

    it('marca captura recusada de cartao como falha sem liberar pedido', async () => {
      const created = await request(app.getHttpServer())
        .post('/invoices')
        .set('Idempotency-Key', 'MS-100045:credit-card-refused')
        .send({
          ...basePayload,
          billingType: 'CREDIT_CARD',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/webhook/payments')
        .set('asaas-access-token', 'webhook-secret')
        .send({
          event: 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED',
          payment: {
            id: created.body.providerPaymentId,
            status: 'REFUSED',
            value: 159.9,
            customer: 'cus_stub_customer-123',
          },
        })
        .expect(200);

      const invoice = await repository.findInvoice(
        basePayload.tenantId,
        created.body.invoiceId,
      );
      expect(invoice?.status).toBe('FAILED');
      expect(invoice?.failureReason).toBe(
        'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED',
      );
      expect(emitSpy).not.toHaveBeenCalledWith(
        'payment.confirmed',
        expect.anything(),
      );
      expect(
        observableEvent('pagamento.cartao.webhook.captura_recusada'),
      ).toMatchObject({
        providerStatus: 'REFUSED',
        cardEvent: true,
        terminalFailure: true,
      });
    });

    it('emite evento observavel quando webhook nao encontra invoice correlacionada', async () => {
      await request(app.getHttpServer())
        .post('/webhook/payments')
        .set('asaas-access-token', 'webhook-secret')
        .send({
          event: 'PAYMENT_CONFIRMED',
          payment: {
            id: 'pay_unknown',
            status: 'CONFIRMED',
            value: 159.9,
            customer: 'cus_unknown',
          },
        })
        .expect(200);

      expect(
        observableEvent('pagamento.confirmacao.webhook.nao_correlacionado'),
      ).toMatchObject({
        event_key: 'pagamento.confirmacao.webhook.nao_correlacionado',
        stage: 'webhook_nao_correlacionado',
        flow: 'confirmacao',
        provider: 'ASAAS',
        providerPaymentId: 'pay_unknown',
        providerStatus: 'CONFIRMED',
      });
      expect(emitSpy).not.toHaveBeenCalledWith(
        'payment.confirmed',
        expect.anything(),
      );
    });
  });

  function observableEvents() {
    return emitSpy.mock.calls
      .filter(([eventName]) => eventName === 'payments.observability')
      .map(([, payload]) => payload);
  }

  function observableEventKeys() {
    return observableEvents().map((event) => event.event_key);
  }

  function observableEvent(eventKey: string) {
    return observableEvents().find((event) => event.event_key === eventKey);
  }
});

describe('Confirmar Pagamento com Dynamo (acceptance)', () => {
  let app: INestApplication<App>;
  let repository: InvoiceRepository;

  beforeAll(async () => {
    process.env.AWS_DYNAMODB_ENDPOINT ??=
      'http://localhost.localstack.cloud:4566';
    await setupTestTables();
  });

  const basePayload = {
    tenantId: 'magazine-siara',
    orderId: 'MS-200045',
    customer: {
      id: 'customer-200',
      name: 'Joao Silva',
      document: '12345678909',
      email: 'joao@example.com',
      mobilePhone: '11987654321',
    },
    amount: 219.9,
    currency: 'BRL',
    dueDate: '2026-06-20',
    billingType: 'PIX',
    provider: 'ASAAS',
    description: 'Pedido MS-200045',
  };

  beforeEach(async () => {
    await truncateAllTables();
    process.env.ENABLED_PAYMENT_PROVIDERS = 'ASAAS';
    process.env.DEFAULT_PAYMENT_PROVIDER = 'ASAAS';
    process.env.ASAAS_MOCK = 'true';
    process.env.ASAAS_WEBHOOK_TOKEN = 'webhook-secret';
    process.env.WEBHOOK_PROCESSING_MODE = 'sync';
    delete process.env.WEBHOOK_QUEUE_URL;
    delete process.env.WEBHOOK_DLQ_URL;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AsaasService)
      .useValue(new AsaasServiceStub())
      .compile();

    app = moduleFixture.createNestApplication();
    repository = moduleFixture.get(InvoiceRepository);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    delete process.env.ENABLED_PAYMENT_PROVIDERS;
    delete process.env.DEFAULT_PAYMENT_PROVIDER;
    delete process.env.ASAAS_MOCK;
    delete process.env.ASAAS_WEBHOOK_TOKEN;
    delete process.env.WEBHOOK_PROCESSING_MODE;
    delete process.env.WEBHOOK_QUEUE_URL;
    delete process.env.WEBHOOK_DLQ_URL;
  });

  it('confirma pagamento localizando invoice por providerPaymentId no Dynamo', async () => {
    const created = await request(app.getHttpServer())
      .post('/invoices')
      .set('Idempotency-Key', 'MS-200045:create')
      .send(basePayload)
      .expect(201);

    await request(app.getHttpServer())
      .post('/webhook/payments')
      .set('asaas-access-token', 'webhook-secret')
      .send({
        event: 'PAYMENT_CONFIRMED',
        payment: {
          id: created.body.providerPaymentId,
          status: 'CONFIRMED',
          value: 219.9,
          customer: 'cus_stub_customer-200',
          confirmedDate: '2026-06-21',
        },
      })
      .expect(200);

    const invoice = await repository.findInvoice(
      basePayload.tenantId,
      created.body.invoiceId,
    );
    expect(invoice?.status).toBe('CONFIRMED');
  });

  it('correlaciona webhook por externalReference no Dynamo quando providerPaymentId ainda nao foi consolidado', async () => {
    const created = await request(app.getHttpServer())
      .post('/invoices')
      .set('Idempotency-Key', 'MS-200045:create')
      .send(basePayload)
      .expect(201);
    const existing = await repository.findInvoice(
      basePayload.tenantId,
      created.body.invoiceId,
    );
    await repository.updateInvoice(existing!, 'OPEN', {
      providerPaymentId: undefined,
    });

    await request(app.getHttpServer())
      .post('/webhook/payments')
      .set('asaas-access-token', 'webhook-secret')
      .send({
        event: 'PAYMENT_CONFIRMED',
        payment: {
          id: 'pay_asaas_early_dynamo',
          status: 'CONFIRMED',
          value: 219.9,
          customer: 'cus_stub_customer-200',
          externalReference: 'MS-200045',
          confirmedDate: '2026-06-21',
        },
      })
      .expect(200);

    const invoice = await repository.findInvoice(
      basePayload.tenantId,
      created.body.invoiceId,
    );
    expect(invoice?.status).toBe('CONFIRMED');
    expect(invoice?.providerPaymentId).toBe('pay_asaas_early_dynamo');
  });
});
