import {
  Injectable,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomBytes, randomUUID } from 'crypto';
import type { CreateWebhookDto } from '../dto/create-webhook.dto';
import type { WebhookResponseDto } from '../dto/webhook-response.dto';
import { WebhookRepository } from './webhook-repository.service';

const MAX_WEBHOOKS_PER_TOKEN = 10;
const ALLOWED_HTTP_HOSTS = ['localhost', '127.0.0.1'];

@Injectable()
export class WebhookService {
  constructor(
    private readonly repository: WebhookRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async register(
    tokenId: string,
    tenantId: string,
    dto: CreateWebhookDto,
    correlationId: string,
  ): Promise<WebhookResponseDto> {
    this.validateUrl(dto.url);

    if (!dto.events || dto.events.length === 0) {
      throw new UnprocessableEntityException(
        'events must contain at least one value',
      );
    }

    const count = await this.repository.countByTokenId(tokenId);
    if (count >= MAX_WEBHOOKS_PER_TOKEN) {
      throw new UnprocessableEntityException(
        `Token already has ${MAX_WEBHOOKS_PER_TOKEN} active webhooks registered`,
      );
    }

    const webhookId = `wh_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const secret = randomBytes(32).toString('hex');
    const now = new Date().toISOString();

    const record = {
      PK: `TOKEN#${tokenId}`,
      SK: `WEBHOOK#${webhookId}`,
      GSI1PK: `TENANT#${tenantId}`,
      GSI1SK: `WEBHOOK#${webhookId}`,
      webhookId,
      tokenId,
      tenantId,
      url: dto.url,
      events: dto.events,
      secret,
      description: dto.description,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.repository.save(record);

    this.eventEmitter.emit('payments.observability', {
      event_key: 'webhook.registered',
      tenantId,
      tokenId,
      webhookId,
      url: this.maskUrl(dto.url),
      events: dto.events,
      correlationId,
    });

    return { ...record, secret };
  }

  async list(tokenId: string): Promise<WebhookResponseDto[]> {
    const records = await this.repository.findByTokenId(tokenId);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return records.map(({ secret: _secret, ...rest }) => ({ ...rest }));
  }

  async remove(
    tokenId: string,
    tenantId: string,
    webhookId: string,
    correlationId: string,
  ): Promise<void> {
    const record = await this.repository.findOne(tokenId, webhookId);

    if (!record || record.tenantId !== tenantId) {
      throw new NotFoundException(`Webhook ${webhookId} not found`);
    }

    await this.repository.deactivate(tokenId, webhookId);

    this.eventEmitter.emit('payments.observability', {
      event_key: 'webhook.deleted',
      tenantId,
      tokenId,
      webhookId,
      correlationId,
    });
  }

  private validateUrl(url: string): void {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new UnprocessableEntityException('Invalid webhook URL');
    }

    const isLocalhost = ALLOWED_HTTP_HOSTS.includes(parsed.hostname);

    if (!isLocalhost && parsed.protocol !== 'https:') {
      throw new UnprocessableEntityException('Webhook URL must use HTTPS');
    }
  }

  private maskUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.hostname}`;
    } catch {
      return '[invalid-url]';
    }
  }
}
