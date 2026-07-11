import type { WebhookEventType } from './create-webhook.dto';

export class WebhookResponseDto {
  webhookId: string;
  tokenId: string;
  tenantId: string;
  url: string;
  events: WebhookEventType[];
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  /** Returned only on creation. Never exposed again. */
  secret?: string;
}
