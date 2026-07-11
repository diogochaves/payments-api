import { tracer, tracingEnabled } from './datadog.tracer';

interface BusinessSpanOptions {
  paymentId?: string;
  provider?: string;
  operation: string;
  obcName?: string;
  reliabilityScenario?: string;
}

/**
 * Wraps an async operation in a Datadog business span.
 *
 * Tags are safe: no card data, tokens, CVV, or authorization headers.
 * Use this for critical payment operations to enable distributed tracing
 * across the payment lifecycle in Datadog APM.
 *
 * Available span names:
 *   create_payment, authorize_payment, tokenize_card,
 *   process_webhook, validate_obc, persist_payment_event
 */
export async function withBusinessSpan<T>(
  spanName: string,
  options: BusinessSpanOptions,
  fn: () => Promise<T>,
): Promise<T> {
  if (!tracingEnabled) return fn();

  const parent = tracer.scope().active();
  const span = tracer.startSpan(spanName, {
    childOf: parent ?? undefined,
    tags: {
      'span.kind': 'internal',
      'business.capability': 'payments',
      operation: options.operation,
      provider: options.provider ?? '',
      'payment.id': options.paymentId ?? '',
      'obc.name': options.obcName ?? '',
      'reliability.scenario': options.reliabilityScenario ?? '',
    },
  });

  try {
    const result = await tracer.scope().activate(span, fn);
    span.setTag('business.outcome', 'success');
    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown';
    const errorType = message.startsWith('provider_contract_violation')
      ? 'contract_violation'
      : 'provider_error';
    span.setTag('error', true);
    span.setTag('error.type', errorType);
    span.setTag('business.outcome', 'error');
    throw error;
  } finally {
    span.finish();
  }
}
