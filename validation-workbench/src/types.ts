export type BillingType = 'BOLETO' | 'PIX' | 'CREDIT_CARD' | 'UNDEFINED';
export type Provider = 'ASAAS' | 'ITAU';
export type CreditCardFlow = 'HOSTED_INVOICE' | 'SAVED_CARD' | 'NEW_CARD';
export type RuntimeMode = 'LOCAL_MOCK' | 'ASAAS_SANDBOX_REAL' | 'LOCALSTACK';
export type DeployEnv = 'local' | 'staging';

export type WebhookEvent =
  | 'PAYMENT_AWAITING_RISK_ANALYSIS'
  | 'PAYMENT_APPROVED_BY_RISK_ANALYSIS'
  | 'PAYMENT_REPROVED_BY_RISK_ANALYSIS'
  | 'PAYMENT_AUTHORIZED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_DELETED'
  | 'PAYMENT_REFUNDED';

export type CartItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type CustomerForm = {
  id: string;
  name: string;
  email: string;
  document: string;
  mobilePhone: string;
};

export type SavedCard = {
  id: string;
  holderName: string;
  brand: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  token: string;
};

export type NewCardForm = {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
};

export type SendResult = {
  ok: boolean;
  status: number;
  body: unknown;
};

export type InvoiceResponse = {
  invoiceId: string;
  orderId: string;
  provider: Provider;
  providerPaymentId: string;
  status: string;
  amount: number;
  currency: string;
  paymentUrl?: string;
  externalReference: string;
};

export type QueueCounters = {
  approximateNumberOfMessages: number;
  approximateNumberOfMessagesNotVisible: number;
  approximateNumberOfMessagesDelayed: number;
};

export type QueueSnapshot = {
  configured: boolean;
  processingMode: string;
  queueUrl?: string;
  deadLetterQueueUrl?: string;
  queue?: QueueCounters;
  deadLetterQueue?: QueueCounters;
};
