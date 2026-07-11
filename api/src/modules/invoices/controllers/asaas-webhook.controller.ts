import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AsaasWebhookDto } from '../../../dto/asaas-webhook.dto';
import { InvoiceService } from '../services/invoice.service';
import { AsaasWebhookQueueService } from '../services/asaas-webhook-queue.service';

@Controller('webhook/payments')
export class AsaasWebhookController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly webhookQueue: AsaasWebhookQueueService,
  ) {}

  @Get('queue')
  async getQueueStatus() {
    return this.webhookQueue.getSnapshot();
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async receiveWebhook(
    @Body() payload: AsaasWebhookDto,
    @Headers('asaas-access-token') accessToken?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    this.invoiceService.validateProviderWebhookToken(accessToken);

    if (process.env.WEBHOOK_PROCESSING_MODE !== 'sync') {
      await this.webhookQueue.enqueue(
        payload,
        correlationId ?? `webhook-${payload.payment?.id ?? 'unknown'}`,
      );
      return { received: true, queued: true };
    }

    await this.invoiceService.processProviderWebhook(payload, accessToken);
    return { received: true };
  }
}
