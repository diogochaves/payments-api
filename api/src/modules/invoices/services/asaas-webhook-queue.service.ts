import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { AsaasWebhookDto } from '../../../dto/asaas-webhook.dto';

export interface QueuedAsaasWebhookMessage {
  provider: 'ASAAS';
  payload: AsaasWebhookDto;
  receivedAt: string;
  correlationId: string;
}

@Injectable()
export class AsaasWebhookQueueService {
  private readonly client = new SQSClient({
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: process.env.AWS_SQS_ENDPOINT,
    credentials: process.env.AWS_SQS_ENDPOINT
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'test',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'test',
        }
      : undefined,
  });

  async enqueue(
    payload: AsaasWebhookDto,
    correlationId: string,
  ): Promise<void> {
    const queueUrl = process.env.WEBHOOK_QUEUE_URL;

    if (!queueUrl) {
      throw new ServiceUnavailableException('WEBHOOK_QUEUE_URL is not configured');
    }

    const message: QueuedAsaasWebhookMessage = {
      provider: 'ASAAS',
      payload,
      receivedAt: new Date().toISOString(),
      correlationId,
    };

    await this.client.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(message),
        MessageAttributes: {
          provider: {
            DataType: 'String',
            StringValue: 'ASAAS',
          },
          event: {
            DataType: 'String',
            StringValue: payload.event,
          },
          correlationId: {
            DataType: 'String',
            StringValue: correlationId,
          },
        },
      }),
    );
  }
}
