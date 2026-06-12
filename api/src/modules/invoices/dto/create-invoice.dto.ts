export class CreateInvoiceDto {
  tenantId: string;
  customerId: string;
  amount: number;
  currency: string;
  description?: string;
}
