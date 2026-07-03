// dotenv/config must run before the tracer so DD_* vars from .env are available
// when tracer.init() executes. ConfigModule only loads .env during NestJS bootstrap,
// which is too late.
import 'dotenv/config';
// datadog.tracer must be imported before NestJS and all instrumented libs.
import './observability/datadog.tracer';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import serverlessExpress from '@codegenie/serverless-express';
import type { Express } from 'express';
import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

let cachedServer: Awaited<ReturnType<typeof bootstrap>> | undefined;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  await app.init();
  console.log('NestJS AppContext ready');
  const expressApp: Express = app.getHttpAdapter().getInstance() as Express;
  return serverlessExpress({ app: expressApp });
}

export const handler: APIGatewayProxyHandler = async (event, context) => {
  cachedServer = cachedServer ?? (await bootstrap());
  const result: APIGatewayProxyResult = (await cachedServer(
    event,
    context,
    () => {},
  )) as APIGatewayProxyResult;
  return result;
};
