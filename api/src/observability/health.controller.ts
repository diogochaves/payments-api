import { Controller, Get } from '@nestjs/common';
import { tracingEnabled } from './datadog.tracer';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: process.env.DD_SERVICE ?? 'payments-api',
      version:
        process.env.DD_VERSION ?? process.env.npm_package_version ?? '0.0.1',
      env: process.env.DD_ENV ?? process.env.NODE_ENV ?? 'local',
      observability: {
        tracing: tracingEnabled,
        agentConfigured: Boolean(process.env.DD_AGENT_HOST),
      },
      storage: {
        dynamo: 'dynamodb',
        endpoint: process.env.AWS_DYNAMODB_ENDPOINT ?? 'aws',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
