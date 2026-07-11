import {
  AttributeValue,
  CreateTableCommand,
  DeleteItemCommand,
  DynamoDBClient,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { NodeHttpHandler } from '@smithy/node-http-handler';

let _client: DynamoDBClient | undefined;

function getClient() {
  if (!_client) {
    _client = new DynamoDBClient({
      region: 'us-east-1',
      endpoint:
        process.env.AWS_DYNAMODB_ENDPOINT ??
        'http://localhost.localstack.cloud:4566',
      credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
      requestHandler: new NodeHttpHandler({
        requestTimeout: 8000,
        throwOnRequestTimeout: true,
      }),
    });
  }
  return _client;
}

export function resetTestClient(): void {
  _client?.destroy();
  _client = undefined;
}

const TABLES: CreateTableCommand[] = [
  new CreateTableCommand({
    TableName: process.env.PAYMENTS_TABLE ?? 'PaymentsTable',
    BillingMode: 'PAY_PER_REQUEST',
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' },
      { AttributeName: 'GSI1PK', AttributeType: 'S' },
      { AttributeName: 'GSI1SK', AttributeType: 'S' },
      { AttributeName: 'GSI2PK', AttributeType: 'S' },
      { AttributeName: 'GSI2SK', AttributeType: 'S' },
    ],
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },
      { AttributeName: 'SK', KeyType: 'RANGE' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'ProviderPaymentIndex',
        KeySchema: [
          { AttributeName: 'GSI1PK', KeyType: 'HASH' },
          { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'PaymentStatusIndex',
        KeySchema: [
          { AttributeName: 'GSI2PK', KeyType: 'HASH' },
          { AttributeName: 'GSI2SK', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
  }),
  new CreateTableCommand({
    TableName: process.env.TRANSACTIONS_TABLE ?? 'TransactionsTable',
    BillingMode: 'PAY_PER_REQUEST',
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' },
      { AttributeName: 'GSI1PK', AttributeType: 'S' },
      { AttributeName: 'GSI1SK', AttributeType: 'S' },
    ],
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },
      { AttributeName: 'SK', KeyType: 'RANGE' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'GSI1',
        KeySchema: [
          { AttributeName: 'GSI1PK', KeyType: 'HASH' },
          { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
  }),
  new CreateTableCommand({
    TableName: process.env.CUSTOMERS_TABLE ?? 'CustomersTable',
    BillingMode: 'PAY_PER_REQUEST',
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' },
    ],
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },
      { AttributeName: 'SK', KeyType: 'RANGE' },
    ],
  }),
  new CreateTableCommand({
    TableName: process.env.TENANTS_TABLE ?? 'TenantsTable',
    BillingMode: 'PAY_PER_REQUEST',
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' },
    ],
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },
      { AttributeName: 'SK', KeyType: 'RANGE' },
    ],
  }),
  new CreateTableCommand({
    TableName: process.env.PROVIDERS_TABLE ?? 'ProvidersTable',
    BillingMode: 'PAY_PER_REQUEST',
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' },
    ],
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },
      { AttributeName: 'SK', KeyType: 'RANGE' },
    ],
  }),
  new CreateTableCommand({
    TableName: process.env.WEBHOOKS_TABLE ?? 'WebhooksTable',
    BillingMode: 'PAY_PER_REQUEST',
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' },
      { AttributeName: 'GSI1PK', AttributeType: 'S' },
      { AttributeName: 'GSI1SK', AttributeType: 'S' },
    ],
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },
      { AttributeName: 'SK', KeyType: 'RANGE' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'TenantWebhooksIndex',
        KeySchema: [
          { AttributeName: 'GSI1PK', KeyType: 'HASH' },
          { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
  }),
];

export async function setupTestTables(): Promise<void> {
  const client = getClient();
  await Promise.all(
    TABLES.map(async (cmd) => {
      try {
        await client.send(cmd);
      } catch (err: unknown) {
        const name = (err as { name?: string }).name;
        if (name !== 'ResourceInUseException') throw err;
      }
    }),
  );
}

async function doTruncate(): Promise<void> {
  const client = getClient();
  const tableNames = TABLES.map((t) => t.input.TableName!);

  await Promise.all(
    tableNames.map(async (tableName) => {
      let lastKey: Record<string, AttributeValue> | undefined;
      do {
        const scan = await client.send(
          new ScanCommand({
            TableName: tableName,
            ProjectionExpression: 'PK, SK',
            ExclusiveStartKey: lastKey,
          }),
        );
        lastKey = scan.LastEvaluatedKey;
        if (!scan.Items?.length) continue;
        await Promise.all(
          scan.Items.map((item) =>
            client.send(
              new DeleteItemCommand({ TableName: tableName, Key: item }),
            ),
          ),
        );
      } while (lastKey);
    }),
  );
}

export async function truncateAllTables(): Promise<void> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await doTruncate();
      return;
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, attempt * 600));
    }
  }
}
