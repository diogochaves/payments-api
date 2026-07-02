export class InvoiceResponseDto {
  invoiceId: string;
  orderId: string;
  provider: string;
  providerPaymentId: string;
  status: string;
  amount: number;
  currency: string;
  paymentUrl?: string;
  externalReference: string;
}
