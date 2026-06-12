import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { InvoiceService } from '../services/invoice.service';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';

/**
 * Invoice Controller
 * 
 * Endpoint REST para criar faturas
 * POST /invoices
 */
@Controller('invoices')
export class InvoiceController {
  constructor(private invoiceService: InvoiceService) {}

  /**
   * POST /invoices
   * Cria uma nova fatura seguindo a sequência de eventos da spec
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createInvoice(@Body() createInvoiceDto: CreateInvoiceDto) {
    return await this.invoiceService.createInvoice(createInvoiceDto);
  }
}
