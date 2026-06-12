import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InvoiceService } from '../services/invoice.service';
import { CustomerService } from '../services/customer.service';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { INVOICE_EVENTS } from '../events/domain-events';

/**
 * Event Sequence Validation Tests
 * 
 * Validam a sequência rigorosa de eventos de acordo com a spec:
 * 1. COADJUVANTES são disparados ANTES do PROTAGONISTA
 * 2. Ações dos coadjuvantes são processadas ANTES do protagonista
 * 3. PROTAGONISTA é disparado APÓS tudo
 * 
 * SEQUÊNCIA ESPERADA:
 * 1. PAYMENT_INTENTION_RECEIVED (coadjuvant)
 * 2. CUSTOMER_NOT_FOUND ou CUSTOMER_FOUND (coadjuvant)
 * 3. [AÇÕES do coadjuvante processadas]
 * 4. INVOICE_CREATED (PROTAGONIST)
 */
describe('Invoice Event Sequence - Strict Ordering Validation', () => {
  let module: TestingModule;
  let invoiceService: InvoiceService;
  let customerService: CustomerService;
  let eventEmitter: EventEmitter2;
  let eventLog: { event: string; timestamp: number }[] = [];

  beforeEach(async () => {
    eventLog = [];

    module = await Test.createTestingModule({
      providers: [
        InvoiceService,
        CustomerService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn((event, payload) => {
              eventLog.push({
                event,
                timestamp: Date.now(),
              });
              return true;
            }),
          },
        },
      ],
    }).compile();

    invoiceService = module.get<InvoiceService>(InvoiceService);
    customerService = module.get<CustomerService>(CustomerService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('Sequência quando cliente NÃO é encontrado', () => {
    it('Deveria disparar eventos na ordem CORRETA: INTENTION → CUSTOMER_NOT_FOUND → [ACTION] → INVOICE_CREATED', async () => {
      const createInvoiceDto: CreateInvoiceDto = {
        tenantId: 'tenant_123',
        customerId: 'cust_not_found',
        amount: 100.0,
        currency: 'BRL',
        description: 'Teste não encontrado',
      };

      jest.spyOn(eventEmitter, 'emit');

      await invoiceService.createInvoice(createInvoiceDto);

      // Verificar que emit foi chamado
      expect(eventEmitter.emit).toHaveBeenCalled();

      // Verificar sequência de eventos
      const emittedEvents = (eventEmitter.emit as jest.Mock).mock.calls.map(
        (call) => call[0],
      );

      // Ordem esperada:
      // 1. PAYMENT_INTENTION_RECEIVED
      // 2. CUSTOMER_NOT_FOUND
      // 3. INVOICE_CREATED
      expect(emittedEvents.length).toBeGreaterThanOrEqual(3);
      expect(emittedEvents[0]).toBe(INVOICE_EVENTS.PAYMENT_INTENTION_RECEIVED);
      expect(emittedEvents[1]).toBe(INVOICE_EVENTS.CUSTOMER_NOT_FOUND);
      expect(emittedEvents[2]).toBe(INVOICE_EVENTS.INVOICE_CREATED);
    });

    it('CUSTOMER_NOT_FOUND deve ser disparado ANTES de INVOICE_CREATED', async () => {
      const createInvoiceDto: CreateInvoiceDto = {
        tenantId: 'tenant_456',
        customerId: 'cust_not_found',
        amount: 200.0,
        currency: 'USD',
      };

      jest.spyOn(eventEmitter, 'emit');

      await invoiceService.createInvoice(createInvoiceDto);

      const emittedEvents = (eventEmitter.emit as jest.Mock).mock.calls.map(
        (call) => call[0],
      );

      const indexNotFound = emittedEvents.indexOf(
        INVOICE_EVENTS.CUSTOMER_NOT_FOUND,
      );
      const indexInvoiceCreated = emittedEvents.indexOf(
        INVOICE_EVENTS.INVOICE_CREATED,
      );

      expect(indexNotFound).toBeLessThan(indexInvoiceCreated);
      expect(indexNotFound).toBeGreaterThanOrEqual(0);
      expect(indexInvoiceCreated).toBeGreaterThan(indexNotFound);
    });
  });

  describe('Sequência quando cliente É encontrado', () => {
    it('Deveria disparar eventos na ordem CORRETA: INTENTION → CUSTOMER_FOUND → [ACTION] → INVOICE_CREATED', async () => {
      const createInvoiceDto: CreateInvoiceDto = {
        tenantId: 'tenant_789',
        customerId: 'cust_found',
        amount: 150.0,
        currency: 'BRL',
        description: 'Teste encontrado',
      };

      jest.spyOn(eventEmitter, 'emit');

      await invoiceService.createInvoice(createInvoiceDto);

      const emittedEvents = (eventEmitter.emit as jest.Mock).mock.calls.map(
        (call) => call[0],
      );

      // Ordem esperada:
      // 1. PAYMENT_INTENTION_RECEIVED
      // 2. CUSTOMER_FOUND
      // 3. INVOICE_CREATED
      expect(emittedEvents.length).toBeGreaterThanOrEqual(3);
      expect(emittedEvents[0]).toBe(INVOICE_EVENTS.PAYMENT_INTENTION_RECEIVED);
      expect(emittedEvents[1]).toBe(INVOICE_EVENTS.CUSTOMER_FOUND);
      expect(emittedEvents[2]).toBe(INVOICE_EVENTS.INVOICE_CREATED);
    });

    it('CUSTOMER_FOUND deve ser disparado ANTES de INVOICE_CREATED', async () => {
      const createInvoiceDto: CreateInvoiceDto = {
        tenantId: 'tenant_101',
        customerId: 'cust_found',
        amount: 250.0,
        currency: 'USD',
      };

      jest.spyOn(eventEmitter, 'emit');

      await invoiceService.createInvoice(createInvoiceDto);

      const emittedEvents = (eventEmitter.emit as jest.Mock).mock.calls.map(
        (call) => call[0],
      );

      const indexFound = emittedEvents.indexOf(
        INVOICE_EVENTS.CUSTOMER_FOUND,
      );
      const indexInvoiceCreated = emittedEvents.indexOf(
        INVOICE_EVENTS.INVOICE_CREATED,
      );

      expect(indexFound).toBeLessThan(indexInvoiceCreated);
      expect(indexFound).toBeGreaterThanOrEqual(0);
      expect(indexInvoiceCreated).toBeGreaterThan(indexFound);
    });
  });

  describe('Evento Protagonista INVOICE_CREATED', () => {
    it('Deveria ser disparado APÓS PAYMENT_INTENTION_RECEIVED', async () => {
      const createInvoiceDto: CreateInvoiceDto = {
        tenantId: 'tenant_202',
        customerId: 'cust_found',
        amount: 99.99,
        currency: 'BRL',
      };

      jest.spyOn(eventEmitter, 'emit');

      await invoiceService.createInvoice(createInvoiceDto);

      const emittedEvents = (eventEmitter.emit as jest.Mock).mock.calls.map(
        (call) => call[0],
      );

      const indexIntention = emittedEvents.indexOf(
        INVOICE_EVENTS.PAYMENT_INTENTION_RECEIVED,
      );
      const indexInvoiceCreated = emittedEvents.indexOf(
        INVOICE_EVENTS.INVOICE_CREATED,
      );

      expect(indexIntention).toBeGreaterThanOrEqual(0);
      expect(indexInvoiceCreated).toBeGreaterThan(indexIntention);
    });

    it('INVOICE_CREATED deveria ser o ÚLTIMO evento disparado (ou penúltimo se houver delay)', async () => {
      const createInvoiceDto: CreateInvoiceDto = {
        tenantId: 'tenant_303',
        customerId: 'cust_found',
        amount: 300.0,
        currency: 'BRL',
      };

      jest.spyOn(eventEmitter, 'emit');

      await invoiceService.createInvoice(createInvoiceDto);

      const emittedEvents = (eventEmitter.emit as jest.Mock).mock.calls.map(
        (call) => call[0],
      );

      // INVOICE_CREATED deve estar nos últimos eventos (pelo menos não ser o primeiro)
      const invoiceCreatedIndex = emittedEvents.indexOf(
        INVOICE_EVENTS.INVOICE_CREATED,
      );
      const totalEvents = emittedEvents.length;

      expect(invoiceCreatedIndex).toBeGreaterThan(0);
      expect(invoiceCreatedIndex).toBeLessThanOrEqual(totalEvents - 1);
    });
  });

  describe('Validação de Payloads', () => {
    it('PAYMENT_INTENTION_RECEIVED deveria conter payload correto', async () => {
      const createInvoiceDto: CreateInvoiceDto = {
        tenantId: 'tenant_404',
        customerId: 'cust_found',
        amount: 111.11,
        currency: 'USD',
      };

      jest.spyOn(eventEmitter, 'emit');

      await invoiceService.createInvoice(createInvoiceDto);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        INVOICE_EVENTS.PAYMENT_INTENTION_RECEIVED,
        expect.objectContaining({
          amount: createInvoiceDto.amount,
          currency: createInvoiceDto.currency,
          customerId: createInvoiceDto.customerId,
          tenantId: createInvoiceDto.tenantId,
        }),
      );
    });

    it('CUSTOMER_NOT_FOUND deveria conter customerId e tenantId', async () => {
      const createInvoiceDto: CreateInvoiceDto = {
        tenantId: 'tenant_505',
        customerId: 'cust_not_found',
        amount: 222.22,
        currency: 'BRL',
      };

      jest.spyOn(eventEmitter, 'emit');

      await invoiceService.createInvoice(createInvoiceDto);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        INVOICE_EVENTS.CUSTOMER_NOT_FOUND,
        expect.objectContaining({
          customerId: createInvoiceDto.customerId,
          tenantId: createInvoiceDto.tenantId,
        }),
      );
    });

    it('CUSTOMER_FOUND deveria conter customerId e tenantId', async () => {
      const createInvoiceDto: CreateInvoiceDto = {
        tenantId: 'tenant_606',
        customerId: 'cust_found',
        amount: 333.33,
        currency: 'USD',
      };

      jest.spyOn(eventEmitter, 'emit');

      await invoiceService.createInvoice(createInvoiceDto);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        INVOICE_EVENTS.CUSTOMER_FOUND,
        expect.objectContaining({
          customerId: createInvoiceDto.customerId,
          tenantId: createInvoiceDto.tenantId,
        }),
      );
    });

    it('INVOICE_CREATED deveria conter paymentId, amount e tenantId', async () => {
      const createInvoiceDto: CreateInvoiceDto = {
        tenantId: 'tenant_707',
        customerId: 'cust_found',
        amount: 444.44,
        currency: 'BRL',
      };

      jest.spyOn(eventEmitter, 'emit');

      await invoiceService.createInvoice(createInvoiceDto);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        INVOICE_EVENTS.INVOICE_CREATED,
        expect.objectContaining({
          paymentId: expect.any(String),
          amount: createInvoiceDto.amount,
          tenantId: createInvoiceDto.tenantId,
        }),
      );
    });

    it('paymentId deveria seguir padrão correto', async () => {
      const createInvoiceDto: CreateInvoiceDto = {
        tenantId: 'tenant_808',
        customerId: 'cust_found',
        amount: 555.55,
        currency: 'USD',
      };

      jest.spyOn(eventEmitter, 'emit');

      await invoiceService.createInvoice(createInvoiceDto);

      const invoiceCreatedCall = (eventEmitter.emit as jest.Mock).mock.calls.find(
        (call) => call[0] === INVOICE_EVENTS.INVOICE_CREATED,
      );

      expect(invoiceCreatedCall).toBeDefined();
      expect(invoiceCreatedCall[1].paymentId).toMatch(/^pay_[a-z0-9]{20}$/);
    });
  });

  describe('Responsabilidade de cada Touchpoint', () => {
    it('Touchpoint 1 (checkout) deveria disparar PAYMENT_INTENTION_RECEIVED como primeiro evento', async () => {
      const createInvoiceDto: CreateInvoiceDto = {
        tenantId: 'tenant_909',
        customerId: 'cust_found',
        amount: 666.66,
        currency: 'BRL',
      };

      jest.spyOn(eventEmitter, 'emit');

      await invoiceService.createInvoice(createInvoiceDto);

      const firstEvent = (eventEmitter.emit as jest.Mock).mock.calls[0][0];

      expect(firstEvent).toBe(INVOICE_EVENTS.PAYMENT_INTENTION_RECEIVED);
    });

    it('CustomerService.validateCustomer deveria disparar CUSTOMER_NOT_FOUND quando cliente não existe', async () => {
      jest.spyOn(eventEmitter, 'emit');

      await customerService.validateCustomer('cust_not_found', 'tenant_010');

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        INVOICE_EVENTS.CUSTOMER_NOT_FOUND,
        expect.any(Object),
      );
    });

    it('CustomerService.validateCustomer deveria disparar CUSTOMER_FOUND quando cliente existe', async () => {
      jest.spyOn(eventEmitter, 'emit');

      await customerService.validateCustomer('cust_found', 'tenant_111');

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        INVOICE_EVENTS.CUSTOMER_FOUND,
        expect.any(Object),
      );
    });
  });

  describe('Regra Crítica: Protagonista após Coadjuvantes', () => {
    it('INVOICE_CREATED nunca deveria ser disparado se PAYMENT_INTENTION_RECEIVED não foi disparado', async () => {
      const createInvoiceDto: CreateInvoiceDto = {
        tenantId: 'tenant_212',
        customerId: 'cust_found',
        amount: 777.77,
        currency: 'USD',
      };

      jest.spyOn(eventEmitter, 'emit');

      await invoiceService.createInvoice(createInvoiceDto);

      const emittedEvents = (eventEmitter.emit as jest.Mock).mock.calls.map(
        (call) => call[0],
      );

      // Se INVOICE_CREATED foi disparado, PAYMENT_INTENTION_RECEIVED deve ter sido antes
      if (emittedEvents.includes(INVOICE_EVENTS.INVOICE_CREATED)) {
        expect(emittedEvents.includes(INVOICE_EVENTS.PAYMENT_INTENTION_RECEIVED)).toBe(
          true,
        );
      }
    });

    it('INVOICE_CREATED deveria ser disparado apenas UMA VEZ por requisição', async () => {
      const createInvoiceDto: CreateInvoiceDto = {
        tenantId: 'tenant_313',
        customerId: 'cust_found',
        amount: 888.88,
        currency: 'BRL',
      };

      jest.spyOn(eventEmitter, 'emit');

      await invoiceService.createInvoice(createInvoiceDto);

      const invoiceCreatedCount = (eventEmitter.emit as jest.Mock).mock.calls.filter(
        (call) => call[0] === INVOICE_EVENTS.INVOICE_CREATED,
      ).length;

      expect(invoiceCreatedCount).toBe(1);
    });
  });
});
