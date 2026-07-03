import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  GetQueueAttributesCommand,
  SendMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { AsaasWebhookDto } from '../../../dto/asaas-webhook.dto';

export interface QueuedAsaasWebhookMessage {
  provider: 'ASAAS';
  payload: AsaasWebhookDto;
  receivedAt: string;
  correlationId: string;
}

export interface QueueSnapshot {
  configured: boolean;
  processingMode: string;
  queueUrl?: string;
  deadLetterQueueUrl?: string;
  queue?: QueueCounters;
  deadLetterQueue?: QueueCounters;
}

interface QueueCounters {
  approximateNumberOfMessages: number;
  approximateNumberOfMessagesNotVisible: number;
  approximateNumberOfMessagesDelayed: number;
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

  async getSnapshot(): Promise<QueueSnapshot> {
    const queueUrl = process.env.WEBHOOK_QUEUE_URL;
    const deadLetterQueueUrl = process.env.WEBHOOK_DLQ_URL;

    const snapshot: QueueSnapshot = {
      configured: Boolean(queueUrl),
      processingMode: process.env.WEBHOOK_PROCESSING_MODE ?? 'sync',
      queueUrl,
      deadLetterQueueUrl,
    };

    if (!queueUrl) {
      return snapshot;
    }

    snapshot.queue = await this.getQueueCounters(queueUrl);

    if (deadLetterQueueUrl) {
      snapshot.deadLetterQueue =
        await this.getQueueCounters(deadLetterQueueUrl);
    }

    return snapshot;
  }

  private async getQueueCounters(queueUrl: string): Promise<QueueCounters> {
    const { Attributes } = await this.client.send(
      new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: [
          'ApproximateNumberOfMessages',
          'ApproximateNumberOfMessagesNotVisible',
          'ApproximateNumberOfMessagesDelayed',
        ],
      }),
    );

    return {
      approximateNumberOfMessages: Number(
        Attributes?.ApproximateNumberOfMessages ?? 0,
      ),
      approximateNumberOfMessagesNotVisible: Number(
        Attributes?.ApproximateNumberOfMessagesNotVisible ?? 0,
      ),
      approximateNumberOfMessagesDelayed: Number(
        Attributes?.ApproximateNumberOfMessagesDelayed ?? 0,
      ),
    };
  }
}
