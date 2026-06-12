export class InvoiceCreatedDto {
  paymentId: string;
  amount: number;
  tenantId: string;

  constructor(paymentId: string, amount: number, tenantId: string) {
    this.paymentId = paymentId;
    this.amount = amount;
    this.tenantId = tenantId;
  }
}
