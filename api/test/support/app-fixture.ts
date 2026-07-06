import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { AsaasService } from '../../src/infra/asaas.service';
import { InvoiceRepository } from '../../src/modules/invoices/services/invoice-repository.service';
import {
  resetTestClient,
  setupTestTables,
  truncateAllTables,
} from '../dynamo-test-utils';

export const TEST_API_TOKEN = 'test-api-token-integration-do-not-use-in-prod';
export const WEBHOOK_SECRET = 'webhook-test-secret';
export const TENANT_ID = 'magazine-siara';

export interface TestFixture {
  app: INestApplication;
  repository: InvoiceRepository;
  asaas: AsaasService;
}

export async function buildTestFixture(): Promise<TestFixture> {
  process.env.AWS_DYNAMODB_ENDPOINT ??=
    'http://localhost.localstack.cloud:4566';
  process.env.API_TOKEN_LOCAL = TEST_API_TOKEN;
  process.env.ENABLED_PAYMENT_PROVIDERS = 'ASAAS';
  process.env.DEFAULT_PAYMENT_PROVIDER = 'ASAAS';
  process.env.ASAAS_MOCK = 'true';
  process.env.ASAAS_WEBHOOK_TOKEN = WEBHOOK_SECRET;
  process.env.WEBHOOK_PROCESSING_MODE = 'sync';
  process.env.ADMIN_SECRET = 'test-admin-secret';
  delete process.env.WEBHOOK_QUEUE_URL;
  delete process.env.WEBHOOK_DLQ_URL;

  // Retry table setup — LocalStack may reset connections between test suites
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await setupTestTables();
      break;
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, attempt * 600));
    }
  }

  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  return {
    app,
    repository: moduleFixture.get(InvoiceRepository),
    asaas: moduleFixture.get(AsaasService),
  };
}

export async function teardownFixture(fixture: TestFixture): Promise<void> {
  if (!fixture?.app) return;
  await fixture.app.close();
  resetTestClient();
  delete process.env.API_TOKEN_LOCAL;
  delete process.env.ENABLED_PAYMENT_PROVIDERS;
  delete process.env.DEFAULT_PAYMENT_PROVIDER;
  delete process.env.ASAAS_MOCK;
  delete process.env.ASAAS_URL;
  delete process.env.ASAAS_WEBHOOK_TOKEN;
  delete process.env.WEBHOOK_PROCESSING_MODE;
  delete process.env.ADMIN_SECRET;
}

export { truncateAllTables };
