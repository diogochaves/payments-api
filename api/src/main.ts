// dotenv/config must run before the tracer so DD_* vars from .env are available
// when tracer.init() executes. ConfigModule only loads .env during NestJS bootstrap,
// which is too late.
import 'dotenv/config';
// datadog.tracer must be imported before NestJS and all instrumented libs.
import './observability/datadog.tracer';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  // bufferLogs: true holds NestJS bootstrap log lines until app.useLogger()
  // wires pino — ensures ALL logs (including startup) go through pino/DD.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Idempotency-Key',
      'X-Correlation-Id',
      'X-Tenant-Id',
      'X-Api-Token',
      'asaas-access-token',
    ],
    exposedHeaders: ['X-Correlation-Id'],
  });
  await app.listen(process.env.PORT ?? 3000);
  console.log(`API is running on port ${process.env.PORT ?? 3000}`);
}
void bootstrap();
