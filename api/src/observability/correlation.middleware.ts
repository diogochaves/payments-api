import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { ulid } from 'ulid';
import { tracer, tracingEnabled } from './datadog.tracer';

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.headers['x-correlation-id'] as string | undefined;
    const correlationId = incoming?.trim() || `corr_${ulid()}`;

    req.headers['x-correlation-id'] = correlationId;
    res.setHeader('x-correlation-id', correlationId);

    if (tracingEnabled) {
      const span = tracer.scope().active();
      if (span) {
        span.setTag('correlation_id', correlationId);
      }
    }

    next();
  }
}
