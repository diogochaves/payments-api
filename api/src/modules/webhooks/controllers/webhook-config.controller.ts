import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTokenGuard } from '../../auth/api-token.guard';
import { WebhookService } from '../services/webhook.service';
import { CreateWebhookDto } from '../dto/create-webhook.dto';

@UseGuards(ApiTokenGuard)
@Controller('webhooks')
export class WebhookConfigController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Req() req: Request,
    @Body() dto: CreateWebhookDto,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    const tokenId = req['tokenId'] as string;
    const tenantId = req['tenantId'] as string;
    return this.webhookService.register(
      tokenId,
      tenantId,
      dto,
      correlationId ?? 'unknown',
    );
  }

  @Get()
  async list(@Req() req: Request) {
    const tokenId = req['tokenId'] as string;
    return this.webhookService.list(tokenId);
  }

  @Delete(':webhookId')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Req() req: Request,
    @Param('webhookId') webhookId: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    const tokenId = req['tokenId'] as string;
    const tenantId = req['tenantId'] as string;
    await this.webhookService.remove(
      tokenId,
      tenantId,
      webhookId,
      correlationId ?? 'unknown',
    );
    return { removed: true, webhookId };
  }
}
