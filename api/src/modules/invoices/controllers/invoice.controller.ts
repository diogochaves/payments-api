import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { InvoiceService } from '../services/invoice.service';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';

@Controller('invoices')
export class InvoiceController {
  constructor(private invoiceService: InvoiceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createInvoice(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @Headers('idempotency-key') idempotencyKey: string,
  ) {
    return await this.invoiceService.createInvoice(
      createInvoiceDto,
      idempotencyKey,
    );
  }
}
