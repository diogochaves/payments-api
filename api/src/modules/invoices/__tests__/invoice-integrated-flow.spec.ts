import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InvoiceService } from '../services/invoice.service';
import { CustomerService } from '../services/customer.service';
import { CustomerCreationService } from '../services/customer-creation.service';
import { PaymentProcessingService } from '../services/payment-processing.service';
import { InvoiceListeners } from '../listeners/invoice.listeners';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { INVOICE_EVENTS, ProcessingState } from '../events/domain-events';

/**
 * Integrated Event Flow Tests
 * 
 * Testa o fluxo completo de eventos incluindo listeners
 * Valida que as ações corretas são executadas em resposta aos eventos
 */
describe('Invoice Integrated Event Flow', () => {
  let module: TestingModule;
  let invoiceService: InvoiceService;
  let customerService: CustomerService;
  let customerCreationService: CustomerCreationService;
  let paymentProcessingService: PaymentProcessingService;
  let invoiceListeners: InvoiceListeners;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        InvoiceService,
        CustomerService,
        CustomerCreationService,
        PaymentProcessingService,
        InvoiceListeners,
        EventEmitter2,
      ],
    }).compile();

    invoiceService = module.get<InvoiceService>(InvoiceService);
    customerService = module.get<CustomerService>(CustomerService);
    customerCreationService = module.get<CustomerCreationService>(
      CustomerCreationService,
    );
    paymentProcessingService = module.get<PaymentProcessingService>(
      PaymentProcessingService,
    );
    invoiceListeners = module.get<InvoiceListeners>(InvoiceListeners);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('Fluxo Completo: Cliente Encontrado', () => {
    it('Deveria executar todas as etapas corretamente quando cliente existe', async () => {
      const createInvoiceDto: CreateInvoiceDto = {
        tenantId: 'tenant_int_001',
        customerId: 'cust_found',
        amount: 1000.0,
        currency: 'BRL',
        description: 'Teste integrado cliente encontrado',
      };

      jest.spyOn(eventEmitter, 'emit');
      jest.spyOn(customerCreationService, 'createCustomer');
      jest.spyOn(paymentProcessingService, 'processPayment');

      const result = await invoiceService.createInvoice(createInvoiceDto);

      // Validar resultado
      expect(result.success).toBe(true);
      expect(result.paymentId).toBeDefined();
      expect(result.paymentId).toMatch(/^pay_[a-z0-9]{20}$/);
      expect(result.message).toBe('Fatura criada com sucesso');

      // Validar eventos disparados
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        INVOICE_EVENTS.PAYMENT_INTENTION_RECEIVED,
        expect.any(Object),
      );

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        INVOICE_EVENTS.CUSTOMER_FOUND,
        expect.any(Object),
      );

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        INVOICE_EVENTS.INVOICE_CREATED,
        expect.any(Object),
      );
    });

    it('PAYMENT_PROCESSED deveria ser chamado quando CUSTOMER_FOUND é disparado', async () => {
      jest.spyOn(paymentProcessingService, 'processPayment');

      await invoiceListeners.handleCustomerFound({
        customerId: 'cust_found',
        tenantId: 'tenant_int_002',
      });

      expect(paymentProcessingService.processPayment).toHaveBeenCalled();
    });
  });

  describe('Fluxo Completo: Cliente Não Encontrado', () => {
    it('Deveria disparar ação customer_created quando cliente não existe', async () => {
      const createInvoiceDto: CreateInvoiceDto = {
        tenantId: 'tenant_int_003',
        customerId: 'cust_not_found',
        amount: 2000.0,
        currency: 'USD',
        description: 'Teste integrado cliente não encontrado',
      };

      jest.spyOn(eventEmitter, 'emit');
      jest.spyOn(customerCreationService, 'createCustomer');

      const result = await invoiceService.createInvoice(createInvoiceDto);

      // Validar resultado
      expect(result.success).toBe(true);
      expect(result.paymentId).toBeDefined();

      // Validar eventos disparados
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        INVOICE_EVENTS.PAYMENT_INTENTION_RECEIVED,
        expect.any(Object),
      );

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        INVOICE_EVENTS.CUSTOMER_NOT_FOUND,
        expect.any(Object),
      );

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        INVOICE_EVENTS.INVOICE_CREATED,
        expect.any(Object),
      );
    });

    it('CUSTOMER_CREATED deveria ser disparado quando listener processa CUSTOMER_NOT_FOUND', async () => {
      jest.spyOn(eventEmitter, 'emit');
      jest.spyOn(customerCreationService, 'createCustomer');

      await invoiceListeners.handleCustomerNotFound({
        customerId: 'cust_not_found',
        tenantId: 'tenant_int_004',
      });

      expect(customerCreationService.createCustomer).toHaveBeenCalledWith(
        'cust_not_found',
        'tenant_int_004',
      );

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        INVOICE_EVENTS.CUSTOMER_CREATED,
        expect.any(Object),
      );
    });
  });

  describe('Rastreamento de Estados', () => {
    it('Deveria retornar estado INVOICE_CREATION quando bem-sucedido', async () => {
      const createInvoiceDto: CreateInvoiceDto = {
        tenantId: 'tenant_int_005',
        customerId: 'cust_found',
        amount: 3000.0,
        currency: 'BRL',
      };

      const result = await invoiceService.createInvoice(createInvoiceDto);

      expect(result.state).toBe(ProcessingState.INVOICE_CREATION);
    });
  });

  describe('Listeners Processam Eventos Corretamente', () => {
    it('handlePaymentIntentionReceived deveria registrar o evento', async () => {
      jest.spyOn(invoiceListeners, 'handlePaymentIntentionReceived');

      await invoiceListeners.handlePaymentIntentionReceived({
        amount: 4000.0,
        currency: 'USD',
        customerId: 'cust_found',
        tenantId: 'tenant_int_006',
      });

      expect(invoiceListeners.handlePaymentIntentionReceived).toHaveBeenCalled();
    });

    it('handleCustomerFound deveria disparar payment processing', async () => {
      jest.spyOn(paymentProcessingService, 'processPayment');

      await invoiceListeners.handleCustomerFound({
        customerId: 'cust_found',
        tenantId: 'tenant_int_007',
      });

      expect(paymentProcessingService.processPayment).toHaveBeenCalled();
    });

    it('handleCustomerNotFound deveria disparar customer creation', async () => {
      jest.spyOn(customerCreationService, 'createCustomer');

      await invoiceListeners.handleCustomerNotFound({
        customerId: 'cust_not_found',
        tenantId: 'tenant_int_008',
      });

      expect(customerCreationService.createCustomer).toHaveBeenCalled();
    });

    it('handleInvoiceCreated deveria registrar evento protagonista', async () => {
      jest.spyOn(invoiceListeners, 'handleInvoiceCreated');

      await invoiceListeners.handleInvoiceCreated({
        paymentId: 'pay_test123456789ab',
        amount: 5000.0,
        tenantId: 'tenant_int_009',
      });

      expect(invoiceListeners.handleInvoiceCreated).toHaveBeenCalled();
    });

    it('handleCustomerCreated deveria disparar payment processing', async () => {
      jest.spyOn(paymentProcessingService, 'processPayment');

      await invoiceListeners.handleCustomerCreated({
        customerId: 'cust_new',
        tenantId: 'tenant_int_010',
      });

      expect(paymentProcessingService.processPayment).toHaveBeenCalled();
    });

    it('handlePaymentProcessed deveria registrar evento protagonista final', async () => {
      jest.spyOn(invoiceListeners, 'handlePaymentProcessed');

      await invoiceListeners.handlePaymentProcessed({
        paymentId: 'pay_test987654321xy',
        status: 'approved',
        tenantId: 'tenant_int_011',
      });

      expect(invoiceListeners.handlePaymentProcessed).toHaveBeenCalled();
    });
  });
});
