// Must be imported before NestJS and all instrumented libraries (express, http, https).
// Import this file as the very first statement in main.ts and lambda.ts.
import type { Tracer } from 'dd-trace';

// dd-trace's CJS default export is not correctly typed under nodenext module
// resolution. The type-only import + explicit cast is the established workaround.
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
const tracer: Tracer = require('dd-trace');

export const tracingEnabled = process.env.DD_TRACE_ENABLED !== 'false';

const service = process.env.DD_SERVICE ?? 'payments-api';
const env = process.env.DD_ENV ?? 'local';
const version =
  process.env.DD_VERSION ?? process.env.npm_package_version ?? '0.0.1';

if (tracingEnabled) {
  try {
    tracer.init({
      service,
      env,
      version,
      logInjection: true,
      runtimeMetrics: process.env.DD_RUNTIME_METRICS_ENABLED !== 'false',
      startupLogs: false,
    });

    console.log(
      JSON.stringify({
        level: 'info',
        message: '[datadog] tracer initialized',
        dd_service: service,
        dd_env: env,
        dd_version: version,
        dd_agent_host: process.env.DD_AGENT_HOST ?? 'localhost',
        dd_trace_agent_port: process.env.DD_TRACE_AGENT_PORT ?? '8126',
        log_injection: true,
        runtime_metrics: process.env.DD_RUNTIME_METRICS_ENABLED !== 'false',
      }),
    );
  } catch (err) {
    console.error(
      JSON.stringify({
        level: 'error',
        message: '[datadog] tracer initialization failed',
        error: err instanceof Error ? err.message : String(err),
      }),
    );
  }
} else {
  console.log(
    JSON.stringify({
      level: 'info',
      message: '[datadog] tracer disabled (DD_TRACE_ENABLED=false)',
    }),
  );
}

export { tracer };

// Explicitly inject DD trace context into a pino log record.
// 'log record' format is NOT registered in dd-trace v5's opentracing propagators.
// Use 'text_map' to extract the 64-bit header IDs, then reshape into the
// nested { dd: { trace_id, span_id, ... } } structure Datadog expects in logs.
// This acts as a reliable fallback alongside dd-trace's automatic logInjection.
export function ddTraceMixin(): Record<string, unknown> {
  if (!tracingEnabled) return {};
  try {
    const span = tracer.scope().active();
    if (!span) return {};
    const carrier: Record<string, string> = {};
    tracer.inject(span.context(), 'text_map', carrier);
    const traceId = carrier['x-datadog-trace-id'];
    const spanId = carrier['x-datadog-parent-id'];
    if (!traceId) return {};
    return {
      dd: {
        trace_id: traceId,
        span_id: spanId ?? '',
        service: process.env.DD_SERVICE ?? 'payments-api',
        env: process.env.DD_ENV ?? 'development',
        version: process.env.DD_VERSION ?? '0.0.1',
      },
    };
  } catch {
    return {};
  }
}
