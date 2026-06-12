export class PaymentIntentionDto {
  amount: number;
  currency: string;
  customerId: string;
  tenantId: string;

  constructor(
    amount: number,
    currency: string,
    customerId: string,
    tenantId: string,
  ) {
    this.amount = amount;
    this.currency = currency;
    this.customerId = customerId;
    this.tenantId = tenantId;
  }
}
