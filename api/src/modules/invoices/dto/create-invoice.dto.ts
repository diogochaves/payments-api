export class CreateInvoiceDto {
  tenantId: string;
  orderId: string;
  customer: {
    id: string;
    name: string;
    document: string;
    email?: string;
    mobilePhone?: string;
  };
  amount: number;
  currency: string;
  dueDate: string;
  billingType: 'BOLETO' | 'PIX' | 'CREDIT_CARD' | 'UNDEFINED';
  provider?: 'ITAU' | 'ASAAS';
  description?: string;
  creditCard?: unknown;
  creditCardHolderInfo?: unknown;
  creditCardToken?: string;
  authorizeOnly?: boolean;
  installments?: number;
  remoteIp?: string;
}
