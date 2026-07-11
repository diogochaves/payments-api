import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CardMetrics, PaymentMetrics, WebhookMetrics } from './metrics';

interface ObservabilityEvent {
  event_key: string;
  provider?: string;
  errorType?: string;
  eventType?: string;
  terminalFailure?: boolean;
  [key: string]: unknown;
}

/**
 * Bridges the existing payments.observability event stream to Datadog metrics.
 *
 * This listener is non-invasive: it does not change InvoiceService.
 * It listens to the existing event bus and translates domain events to
 * ProdOps/PRE metrics without duplicating business logic.
 */
@Injectable()
export class ObservabilityListener {
  @OnEvent('payments.observability', { async: false })
  handleObservabilityEvent(event: ObservabilityEvent): void {
    const key = event.event_key ?? '';
    const provider = String(event.provider ?? 'UNKNOWN');
    const isException = key.endsWith('_exception');

    if (isException) {
      const failureType = String(event.errorType ?? 'provider_error');
      const isTimeout = /timeout|ETIMEDOUT|ECONNRESET/i.test(failureType);
      if (isTimeout) {
        PaymentMetrics.timeout(provider);
      } else {
        PaymentMetrics.failed(provider, failureType);
      }
      return;
    }

    if (key.includes('intencao.de.pagamento.salva')) {
      PaymentMetrics.created(provider);
      return;
    }

    if (key.includes('pagamento.confirmado')) {
      PaymentMetrics.authorized(provider);
      return;
    }

    if (key.includes('analise_risco.reprovada')) {
      PaymentMetrics.rejected(provider, 'risk_analysis_reproved');
      return;
    }

    if (key.includes('captura_recusada')) {
      PaymentMetrics.rejected(provider, 'card_capture_refused');
      return;
    }

    if (key.includes('nao_correlacionado')) {
      WebhookMetrics.uncorrelated(provider);
      return;
    }

    if (key.includes('webhook')) {
      const eventType = String(event.eventType ?? key);
      WebhookMetrics.received(provider, eventType);
      return;
    }

    if (key.includes('tokenizado') || key.includes('card.tokenized')) {
      CardMetrics.tokenized(provider);
    }
  }
}
