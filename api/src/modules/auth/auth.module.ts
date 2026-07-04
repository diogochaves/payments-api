import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ApiTokenService } from './api-token.service';
import { ApiTokenGuard } from './api-token.guard';

@Module({
  imports: [EventEmitterModule],
  providers: [ApiTokenService, ApiTokenGuard],
  exports: [ApiTokenService, ApiTokenGuard],
})
export class AuthModule {}
