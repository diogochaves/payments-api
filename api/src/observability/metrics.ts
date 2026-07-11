import { tracer, tracingEnabled } from './datadog.tracer';

// Base tags applied to every metric — anchors each metric to the ProdOps context.
const BASE_TAGS = [
  `service:${process.env.DD_SERVICE ?? 'payments-api'}`,
  `env:${process.env.DD_ENV ?? 'local'}`,
  'capability:payments',
  'method:prodops',
];

function buildTags(extra: Record<string, string>): string[] {
  return [...BASE_TAGS, ...Object.entries(extra).map(([k, v]) => `${k}:${v}`)];
}

function increment(metric: string, extra: Record<string, string> = {}): void {
  if (!tracingEnabled) return;
  try {
    tracer.dogstatsd.increment(metric, 1, buildTags(extra));
  } catch {
    // no-op: DD Agent unavailable or metrics endpoint not reachable
  }
}

// ---------------------------------------------------------------------------
// Payment lifecycle metrics — aligned with OBCs and reliability scenarios
// ---------------------------------------------------------------------------

export const PaymentMetrics = {
  /** Invoice created and saved locally — step 1 of the happy path. */
  created(provider: string, obc = 'intencao_de_pagamento_salva') {
    increment('payment.created', {
      payment_provider: provider,
      journey: 'delivery',
      obc,
    });
  },

  /** Payment confirmed by provider webhook — the core OBC. */
  authorized(provider: string, obc = 'pagamento_confirmado_pelo_gateway') {
    increment('payment.authorized', {
      payment_provider: provider,
      journey: 'operation',
      obc,
    });
  },

  /** Terminal failure during payment creation or provider integration. */
  failed(provider: string, failureType: string, obc = 'payment_failed') {
    increment('payment.failed', {
      payment_provider: provider,
      journey: 'operation',
      failure_type: failureType,
      obc,
    });
  },

  /** Payment rejected by risk analysis or card capture refusal. */
  rejected(provider: string, failureType: string) {
    increment('payment.rejected', {
      payment_provider: provider,
      journey: 'operation',
      failure_type: failureType,
      reliability_scenario: 'pagamento_recusado',
    });
  },

  /** Provider call timed out. */
  timeout(provider: string) {
    increment('payment.timeout', {
      payment_provider: provider,
      journey: 'operation',
      failure_type: 'timeout',
      reliability_scenario: 'timeout_provider',
    });
  },
};

// ---------------------------------------------------------------------------
// Card-specific metrics
// ---------------------------------------------------------------------------

export const CardMetrics = {
  tokenized(provider: string) {
    increment('card.tokenized', {
      payment_provider: provider,
      journey: 'delivery',
    });
  },
};

// ---------------------------------------------------------------------------
// Webhook metrics — reliability scenario: webhook não correlacionado
// ---------------------------------------------------------------------------

export const WebhookMetrics = {
  received(provider: string, eventType: string) {
    increment('webhook.received', {
      payment_provider: provider,
      event_type: eventType,
      journey: 'operation',
    });
  },

  failed(provider: string, failureType: string) {
    increment('webhook.failed', {
      payment_provider: provider,
      failure_type: failureType,
      journey: 'operation',
    });
  },

  /** Webhook received but could not be correlated to any invoice — P0 risk. */
  uncorrelated(provider: string) {
    increment('webhook.failed', {
      payment_provider: provider,
      failure_type: 'uncorrelated',
      journey: 'operation',
      reliability_scenario: 'webhook_sem_correlacao',
      obc: 'confirmacao_de_pagamento_confiavel',
    });
  },
};
