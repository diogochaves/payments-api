import {
  AttributeValue,
  CreateTableCommand,
  DeleteItemCommand,
  DynamoDBClient,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';

function makeClient() {
  return new DynamoDBClient({
    region: 'us-east-1',
    endpoint:
      process.env.AWS_DYNAMODB_ENDPOINT ??
      'http://localhost.localstack.cloud:4566',
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  });
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
  const client = makeClient();
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

export async function truncateAllTables(): Promise<void> {
  const client = makeClient();
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
