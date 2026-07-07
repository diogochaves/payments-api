import type { WebhookEvent, InvoiceResponse, QueueSnapshot } from './types';

export function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function webhookStatus(event: WebhookEvent) {
  if (event === 'PAYMENT_AUTHORIZED') {
    return 'AUTHORIZED';
  }

  if (event === 'PAYMENT_RECEIVED') {
    return 'RECEIVED';
  }

  if (event === 'PAYMENT_DELETED') {
    return 'DELETED';
  }

  if (event === 'PAYMENT_REFUNDED') {
    return 'REFUNDED';
  }

  if (event === 'PAYMENT_OVERDUE') {
    return 'OVERDUE';
  }

  if (
    event === 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED' ||
    event === 'PAYMENT_REPROVED_BY_RISK_ANALYSIS'
  ) {
    return 'REFUSED';
  }

  return 'CONFIRMED';
}

export function localStatusAfterWebhook(event: WebhookEvent, currentStatus: string) {
  if (event === 'PAYMENT_CONFIRMED') {
    return 'CONFIRMED';
  }

  if (event === 'PAYMENT_RECEIVED') {
    return 'RECEIVED';
  }

  return currentStatus;
}

export function inferCardBrand(digits: string) {
  if (digits.startsWith('4')) {
    return 'VISA';
  }

  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) {
    return 'MASTERCARD';
  }

  if (/^3[47]/.test(digits)) {
    return 'AMEX';
  }

  return 'UNKNOWN';
}

export function isInvoiceResponse(body: unknown): body is InvoiceResponse {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const invoice = body as Partial<InvoiceResponse>;

  return (
    typeof invoice.invoiceId === 'string' &&
    typeof invoice.orderId === 'string' &&
    typeof invoice.providerPaymentId === 'string' &&
    typeof invoice.externalReference === 'string'
  );
}

export function isQueueSnapshot(body: unknown): body is QueueSnapshot {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const snapshot = body as Partial<QueueSnapshot>;

  return (
    typeof snapshot.configured === 'boolean' &&
    typeof snapshot.processingMode === 'string'
  );
}

export function isSandboxPaymentReceived(body: unknown): body is { status: string } {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const payment = body as { status?: unknown };

  return typeof payment.status === 'string';
}

export function makeOrderId() {
  return `MS-TEST-${Date.now()}`;
}

export function futureDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
