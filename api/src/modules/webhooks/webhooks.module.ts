import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { WebhookConfigController } from './controllers/webhook-config.controller';
import { WebhookService } from './services/webhook.service';
import { WebhookRepository } from './services/webhook-repository.service';
import { WebhookDeliveryService } from './services/webhook-delivery.service';
import { DynamoService } from '../../infra/dynamo.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [EventEmitterModule, AuthModule],
  controllers: [WebhookConfigController],
  providers: [
    WebhookService,
    WebhookRepository,
    WebhookDeliveryService,
    DynamoService,
  ],
})
export class WebhooksModule {}
