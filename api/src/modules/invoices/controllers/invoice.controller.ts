import {
  Body,
  Controller,
  Delete,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTokenGuard } from '../../auth/api-token.guard';
import { InvoiceService } from '../services/invoice.service';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';

@UseGuards(ApiTokenGuard)
@Controller('invoices')
export class InvoiceController {
  constructor(private invoiceService: InvoiceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createInvoice(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    return await this.invoiceService.createInvoice(
      createInvoiceDto,
      idempotencyKey,
      correlationId,
    );
  }

  @Delete(':invoiceId')
  @HttpCode(HttpStatus.OK)
  async cancelInvoice(
    @Param('invoiceId') invoiceId: string,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('idempotency-key') idempotencyKey: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    return await this.invoiceService.cancelInvoice(
      tenantId,
      invoiceId,
      idempotencyKey,
      correlationId,
    );
  }
}
