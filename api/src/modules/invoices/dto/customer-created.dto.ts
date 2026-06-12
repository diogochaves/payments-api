export class CustomerCreatedDto {
  customerId: string;
  tenantId: string;

  constructor(customerId: string, tenantId: string) {
    this.customerId = customerId;
    this.tenantId = tenantId;
  }
}
