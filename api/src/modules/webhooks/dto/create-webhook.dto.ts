export type WebhookEventType = 'invoice.created' | 'invoice.confirmed' | 'invoice.cancelled';

export class CreateWebhookDto {
  url: string;
  events: WebhookEventType[];
  description?: string;
}
