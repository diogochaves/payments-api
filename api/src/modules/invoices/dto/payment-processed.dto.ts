export class PaymentProcessedDto {
  paymentId: string;
  status: string;
  tenantId: string;

  constructor(paymentId: string, status: string, tenantId: string) {
    this.paymentId = paymentId;
    this.status = status;
    this.tenantId = tenantId;
  }
}
