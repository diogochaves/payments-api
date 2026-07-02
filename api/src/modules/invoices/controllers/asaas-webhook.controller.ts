import { Body, Controller, Headers, Post } from '@nestjs/common';
import { AsaasWebhookDto } from '../../../dto/asaas-webhook.dto';
import { InvoiceService } from '../services/invoice.service';

@Controller('webhook/payments')
export class AsaasWebhookController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  async receiveWebhook(
    @Body() payload: AsaasWebhookDto,
    @Headers('asaas-access-token') accessToken?: string,
  ) {
    await this.invoiceService.processProviderWebhook(payload, accessToken);
    return { received: true };
  }
}
