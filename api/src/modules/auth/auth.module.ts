import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DynamoService } from '../../infra/dynamo.service';
import { AdminTokenController } from './admin-token.controller';
import { ApiTokenGuard } from './api-token.guard';
import { ApiTokenService } from './api-token.service';
import { TokenRepository } from './token.repository';

@Module({
  imports: [EventEmitterModule],
  controllers: [AdminTokenController],
  providers: [DynamoService, TokenRepository, ApiTokenService, ApiTokenGuard],
  exports: [ApiTokenService, ApiTokenGuard],
})
export class AuthModule {}
