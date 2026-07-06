import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
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

  constructor() {
    const isLocal = process.env.AWS_DYNAMODB_ENDPOINT !== undefined;

    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.AWS_DYNAMODB_ENDPOINT,
      credentials: isLocal
        ? { accessKeyId: 'test', secretAccessKey: 'test' }
        : undefined,
    });

    this.client = DynamoDBDocumentClient.from(dynamoClient, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }

  async getItem(
    table: string,
    pk: string,
    sk: string,
  ): Promise<Record<string, unknown> | undefined> {
    const result = await this.client.send(
      new GetCommand({ TableName: table, Key: { PK: pk, SK: sk } }),
    );
    return result.Item;
  }

  async putItem(table: string, item: DynamoItem) {
    return this.client.send(new PutCommand({ TableName: table, Item: item }));
  }

  async queryByIndex(
    table: string,
    indexName: string,
    partitionKeyName: string,
    partitionKeyValue: string,
    sortKeyName?: string,
    sortKeyValue?: string,
  ): Promise<Record<string, unknown>[]> {
    const hasSortKey = Boolean(sortKeyName && sortKeyValue);
    const result = await this.client.send(
      new QueryCommand({
        TableName: table,
        IndexName: indexName,
        KeyConditionExpression: hasSortKey
          ? '#pk = :pk and #sk = :sk'
          : '#pk = :pk',
        ExpressionAttributeNames: hasSortKey
          ? { '#pk': partitionKeyName, '#sk': sortKeyName! }
          : { '#pk': partitionKeyName },
        ExpressionAttributeValues: hasSortKey
          ? { ':pk': partitionKeyValue, ':sk': sortKeyValue }
          : { ':pk': partitionKeyValue },
      }),
    );
    return result.Items ?? [];
  }

  async queryItems(
    table: string,
    pk: string,
    skPrefix?: string,
  ): Promise<Record<string, unknown>[]> {
    const hasSk = Boolean(skPrefix);
    const result = await this.client.send(
      new QueryCommand({
        TableName: table,
        KeyConditionExpression: hasSk
          ? '#pk = :pk AND begins_with(#sk, :sk)'
          : '#pk = :pk',
        ExpressionAttributeNames: hasSk
          ? { '#pk': 'PK', '#sk': 'SK' }
          : { '#pk': 'PK' },
        ExpressionAttributeValues: hasSk
          ? { ':pk': pk, ':sk': skPrefix }
          : { ':pk': pk },
      }),
    );
    return result.Items ?? [];
  }

  async deleteItem(table: string, pk: string, sk: string) {
    return this.client.send(
      new DeleteCommand({ TableName: table, Key: { PK: pk, SK: sk } }),
    );
  }

  async updateItem(
    table: string,
    pk: string,
    sk: string,
    attrs: Record<string, unknown>,
  ) {
    const updates = Object.keys(attrs)
      .map((k) => `#${k} = :${k}`)
      .join(', ');

    return this.client.send(
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
}
