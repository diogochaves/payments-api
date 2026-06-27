import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Idempotency-Key',
      'X-Correlation-Id',
      'X-Tenant-Id',
    ],
  });
  await app.listen(process.env.PORT ?? 3000);
  console.log(`API is running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
