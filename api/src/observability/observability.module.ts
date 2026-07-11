import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { CorrelationMiddleware } from './correlation.middleware';
import { HealthController } from './health.controller';
import { ObservabilityListener } from './observability.listener';

@Module({
  controllers: [HealthController],
  providers: [ObservabilityListener],
})
export class ObservabilityModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(CorrelationMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
