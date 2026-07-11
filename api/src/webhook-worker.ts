import 'dotenv/config';
import './observability/datadog.tracer';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import type { SQSBatchResponse, SQSHandler, SQSRecord } from 'aws-lambda';
import { AppModule } from './app.module';
import { InvoiceService } from './modules/invoices/services/invoice.service';
import type { QueuedAsaasWebhookMessage } from './modules/invoices/services/asaas-webhook-queue.service';

let cachedApp: Awaited<ReturnType<typeof bootstrap>> | undefined;

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  return app;
}

async function processRecord(record: SQSRecord): Promise<void> {
  const app = (cachedApp ??= await bootstrap());
  const invoiceService = app.get(InvoiceService);
  const message = JSON.parse(record.body) as QueuedAsaasWebhookMessage;

  await invoiceService.processProviderWebhook(message.payload, undefined, {
    skipTokenValidation: true,
  });
}

export const handler: SQSHandler = async (event): Promise<SQSBatchResponse> => {
  const batchItemFailures: SQSBatchResponse['batchItemFailures'] = [];

  for (const record of event.Records) {
    try {
      await processRecord(record);
    } catch (error) {
      console.error(
        JSON.stringify({
          level: 'error',
          message: 'Failed to process Asaas webhook queue record',
          messageId: record.messageId,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};
