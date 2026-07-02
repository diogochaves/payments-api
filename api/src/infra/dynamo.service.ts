import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

type DynamoItem = Record<string, unknown> & {
  PK: string;
  SK: string;
};

export class DynamoService {
  private client: DynamoDBDocumentClient;
  private memoryStore = new Map<string, DynamoItem>();

  constructor() {
    const isLocal = process.env.AWS_DYNAMODB_ENDPOINT !== undefined;

    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.AWS_DYNAMODB_ENDPOINT,
      credentials: isLocal
        ? {
            accessKeyId: 'test',
            secretAccessKey: 'test',
          }
        : undefined,
    });

    this.client = DynamoDBDocumentClient.from(dynamoClient, {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    });
  }

  // private client = DynamoDBDocumentClient.from(
  //   new DynamoDBClient({
  //     region: process.env.AWS_REGION,
  //     endpoint: process.env.AWS_DYNAMODB_ENDPOINT,
  //     credentials: {
  //       accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
  //       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  //     },
  //   }),
  // );

  async getItem(
    table: string,
    pk: string,
    sk: string,
  ): Promise<Record<string, unknown> | undefined> {
    if (this.mockEnabled()) {
      return this.memoryStore.get(this.key(table, pk, sk));
    }

    try {
      const result = await this.client.send(
        new GetCommand({
          TableName: table,
          Key: { PK: pk, SK: sk },
        }),
      );

      return result.Item;
    } catch (error) {
      console.error('DynamoDB getItem error:', error);
      throw error;
    }
  }

  async putItem(table: string, item: DynamoItem) {
    if (this.mockEnabled()) {
      this.memoryStore.set(this.key(table, item.PK, item.SK), item);
      return { mocked: true };
    }

    return await this.client.send(
      new PutCommand({
        TableName: table,
        Item: item,
      }),
    );
  }

  async queryByIndex(
    table: string,
    indexName: string,
    partitionKeyName: string,
    partitionKeyValue: string,
    sortKeyName?: string,
    sortKeyValue?: string,
  ): Promise<Record<string, unknown>[]> {
    if (this.mockEnabled()) {
      return Array.from(this.memoryStore.entries())
        .filter(([key]) => key.startsWith(`${table}::`))
        .map(([, item]) => item)
        .filter((item) => item[partitionKeyName] === partitionKeyValue)
        .filter((item) =>
          sortKeyName && sortKeyValue
            ? item[sortKeyName] === sortKeyValue
            : true,
        );
    }

    const hasSortKey = Boolean(sortKeyName && sortKeyValue);
    const result = await this.client.send(
      new QueryCommand({
        TableName: table,
        IndexName: indexName,
        KeyConditionExpression: hasSortKey
          ? '#pk = :pk and #sk = :sk'
          : '#pk = :pk',
        ExpressionAttributeNames: hasSortKey
          ? {
              '#pk': partitionKeyName,
              '#sk': sortKeyName!,
            }
          : {
              '#pk': partitionKeyName,
            },
        ExpressionAttributeValues: hasSortKey
          ? {
              ':pk': partitionKeyValue,
              ':sk': sortKeyValue,
            }
          : {
              ':pk': partitionKeyValue,
            },
      }),
    );

    return result.Items ?? [];
  }

  async updateItem(
    table: string,
    pk: string,
    sk: string,
    attrs: Record<string, unknown>,
  ) {
    if (this.mockEnabled()) {
      const key = this.key(table, pk, sk);
      const current = this.memoryStore.get(key) ?? { PK: pk, SK: sk };
      const updated = { ...current, ...attrs };
      this.memoryStore.set(key, updated);
      return { mocked: true };
    }

    const updates = Object.keys(attrs)
      .map((k) => `#${k} = :${k}`)
      .join(', ');

    return await this.client.send(
      new UpdateCommand({
        TableName: table,
        Key: { PK: pk, SK: sk },
        UpdateExpression: `SET ${updates}`,
        ExpressionAttributeNames: Object.fromEntries(
          Object.keys(attrs).map((k) => [`#${k}`, k]),
        ),
        ExpressionAttributeValues: Object.fromEntries(
          Object.keys(attrs).map((k) => [`:${k}`, attrs[k]]),
        ),
      }),
    );
  }

  private mockEnabled(): boolean {
    return process.env.DYNAMO_MOCK === 'true';
  }

  private key(table: string, pk: string, sk: string): string {
    return `${table}::${pk}::${sk}`;
  }
}
