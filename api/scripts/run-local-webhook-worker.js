#!/usr/bin/env node
process.env.TS_NODE_TRANSPILE_ONLY = process.env.TS_NODE_TRANSPILE_ONLY || 'true';

require('ts-node/register');
require('tsconfig-paths/register');

const {
  DeleteMessageBatchCommand,
  ReceiveMessageCommand,
  SQSClient,
} = require('@aws-sdk/client-sqs');
const { handler } = require('../src/webhook-worker');

const queueUrl = process.env.WEBHOOK_QUEUE_URL;
const endpoint = process.env.AWS_SQS_ENDPOINT;
const region = process.env.AWS_REGION || 'us-east-1';

if (!queueUrl) {
  console.error('WEBHOOK_QUEUE_URL is required to run the local webhook worker.');
  process.exit(1);
}

const client = new SQSClient({
  region,
  endpoint,
  credentials: endpoint
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
      }
    : undefined,
});

let running = true;

process.on('SIGINT', () => {
  running = false;
});
process.on('SIGTERM', () => {
  running = false;
});

function toSqsRecord(message) {
  return {
    messageId: message.MessageId,
    receiptHandle: message.ReceiptHandle,
    body: message.Body || '',
    attributes: message.Attributes || {},
    messageAttributes: message.MessageAttributes || {},
    md5OfBody: message.MD5OfBody,
    eventSource: 'aws:sqs',
    eventSourceARN: '',
    awsRegion: region,
  };
}

async function poll() {
  console.log(
    JSON.stringify({
      level: 'info',
      message: 'Local webhook worker started',
      queueUrl,
      endpoint: endpoint || 'aws',
    }),
  );

  while (running) {
    const response = await client.send(
      new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: Number(process.env.LOCAL_WEBHOOK_WORKER_BATCH_SIZE || 5),
        WaitTimeSeconds: Number(process.env.LOCAL_WEBHOOK_WORKER_WAIT_SECONDS || 5),
        VisibilityTimeout: Number(process.env.LOCAL_WEBHOOK_WORKER_VISIBILITY_TIMEOUT || 60),
        AttributeNames: ['All'],
        MessageAttributeNames: ['All'],
      }),
    );

    const messages = response.Messages || [];
    if (messages.length === 0) {
      continue;
    }

    const result = await handler({
      Records: messages.map(toSqsRecord),
    });

    const failedIds = new Set(
      (result.batchItemFailures || []).map((item) => item.itemIdentifier),
    );
    const successfulMessages = messages.filter(
      (message) => !failedIds.has(message.MessageId),
    );

    if (successfulMessages.length > 0) {
      await client.send(
        new DeleteMessageBatchCommand({
          QueueUrl: queueUrl,
          Entries: successfulMessages.map((message, index) => ({
            Id: `msg${index}`,
            ReceiptHandle: message.ReceiptHandle,
          })),
        }),
      );
    }

    console.log(
      JSON.stringify({
        level: failedIds.size > 0 ? 'warn' : 'info',
        message: 'Local webhook worker batch processed',
        received: messages.length,
        deleted: successfulMessages.length,
        failed: failedIds.size,
      }),
    );
  }
}

poll().catch((error) => {
  console.error(
    JSON.stringify({
      level: 'error',
      message: 'Local webhook worker failed',
      error: error instanceof Error ? error.message : String(error),
    }),
  );
  process.exit(1);
});
