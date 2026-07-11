import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Minus,
  Play,
  Plus,
  RefreshCw,
  Send,
  ShoppingCart,
  Square,
  Trash2,
  Webhook,
} from 'lucide-react';
import type { CartItem, CustomerForm, SendResult, WebhookEvent } from '../types';
import {
  safeJsonParse,
  isInvoiceResponse,
  webhookStatus,
  localStatusAfterWebhook,
  makeOrderId,
  futureDate,
} from '../utils';
import {
  currencyFormatter,
  initialItems,
  initialCustomer,
} from '../constants';

interface MultiPaymentScreenProps {
  apiUrl: string;
  apiToken: string;
  webhookToken: string;
  tenantId: string;
  runtimeMode: 'LOCAL_MOCK' | 'ASAAS_SANDBOX_REAL' | 'LOCALSTACK';
}

type MethodBillingType = 'PIX' | 'CREDIT_CARD';

type PaymentMethod = {
  id: string;
  billingType: MethodBillingType;
  amount: number;
};

type FailurePolicy = 'KEEP_CONFIRMED' | 'REVERT_ALL' | 'PARTIAL_WINDOW';

type CompositionResult = { invoiceResult: unknown; error: string | null } | null;

type InvoiceStatus = {
  invoiceId: string;
  billingType: MethodBillingType;
  amount: number;
  status: string;
  updatedAt: string | null;
  lastChecked: Date | null;
  error: string | null;
};

type ConfirmState = {
  isConfirmingWebhook: boolean;
  isConfirmingSandbox: boolean;
  webhookResult: SendResult | null;
  sandboxResult: SendResult | null;
};

const TERMINAL_STATUSES = new Set([
  'CONFIRMED', 'RECEIVED', 'FAILED', 'CANCELLED', 'CANCEL_RECONCILIATION_REQUIRED',
]);

const STATUS_LABEL: Record<string, string> = {
  CREATED: 'CREATED',
  PROVIDER_PENDING: 'PROVIDER_PENDING',
  OPEN: 'OPEN',
  CONFIRMED: 'CONFIRMED',
  RECEIVED: 'RECEIVED',
  CANCEL_REQUESTED: 'CANCEL_REQUESTED',
  CANCELLED: 'CANCELLED',
  CANCEL_RECONCILIATION_REQUIRED: 'RECONCILIATION',
  FAILED: 'FAILED',
};

function statusClass(status: string): string {
  if (status === 'CONFIRMED' || status === 'RECEIVED') return 'status-badge status-badge--confirmed';
  if (status === 'FAILED' || status === 'CANCELLED') return 'status-badge status-badge--failed';
  if (status === 'OPEN' || status === 'PROVIDER_PENDING') return 'status-badge status-badge--open';
  if (status === 'CANCEL_REQUESTED' || status === 'CANCEL_RECONCILIATION_REQUIRED') return 'status-badge status-badge--warning';
  return 'status-badge status-badge--neutral';
}

const WEBHOOK_EVENTS: WebhookEvent[] = [
  'PAYMENT_CONFIRMED',
  'PAYMENT_RECEIVED',
  'PAYMENT_AUTHORIZED',
  'PAYMENT_OVERDUE',
  'PAYMENT_DELETED',
  'PAYMENT_REFUNDED',
  'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED',
  'PAYMENT_REPROVED_BY_RISK_ANALYSIS',
];

export function MultiPaymentScreen({
  apiUrl,
  apiToken,
  webhookToken,
  tenantId,
  runtimeMode,
}: MultiPaymentScreenProps) {
  const isRealSandbox = runtimeMode === 'ASAAS_SANDBOX_REAL';
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [customer, setCustomer] = useState<CustomerForm>(initialCustomer);
  const [orderId] = useState(makeOrderId);
  const [currency] = useState('BRL');
  const [dueDate, setDueDate] = useState(() => futureDate(7));
  const [methods, setMethods] = useState<PaymentMethod[]>([
    { id: crypto.randomUUID(), billingType: 'PIX', amount: 0 },
  ]);
  const [failurePolicy, setFailurePolicy] = useState<FailurePolicy>('KEEP_CONFIRMED');
  const [compositionResults, setCompositionResults] = useState<CompositionResult[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Polling
  const [invoiceStatuses, setInvoiceStatuses] = useState<InvoiceStatus[]>([]);
  const [pollingInterval, setPollingInterval] = useState(3);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Confirmation
  const [webhookEvent, setWebhookEvent] = useState<WebhookEvent>('PAYMENT_CONFIRMED');
  const [confirmStates, setConfirmStates] = useState<ConfirmState[]>([]);

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [items],
  );

  const sumMethods = useMemo(
    () => methods.reduce((sum, m) => sum + m.amount, 0),
    [methods],
  );

  const remaining = Number((totalAmount - sumMethods).toFixed(2));

  const payload = useMemo(() => ({
    orderId,
    tenantId,
    customer: {
      id: customer.id,
      name: customer.name,
      document: customer.document,
      email: customer.email,
      mobilePhone: customer.mobilePhone,
    },
    totalAmount: Number(totalAmount.toFixed(2)),
    currency,
    dueDate,
    failurePolicy,
    methods: methods.map(({ billingType, amount }) => ({ billingType, amount })),
  }), [orderId, tenantId, customer, totalAmount, currency, dueDate, failurePolicy, methods]);

  const updateItem = <K extends keyof CartItem>(id: string, field: K, value: CartItem[K]) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const addItem = () => {
    setItems((current) => [
      ...current,
      { id: crypto.randomUUID(), name: 'Novo item', quantity: 1, unitPrice: 19.9 },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const addMethod = () => {
    if (methods.length >= 2) return;
    setMethods((current) => [
      ...current,
      { id: crypto.randomUUID(), billingType: 'PIX', amount: 0 },
    ]);
  };

  const removeMethod = (id: string) => {
    if (methods.length <= 1) return;
    setMethods((current) => current.filter((m) => m.id !== id));
  };

  const updateMethod = <K extends keyof PaymentMethod>(id: string, field: K, value: PaymentMethod[K]) => {
    setMethods((current) =>
      current.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    );
  };

  // ── Polling ──────────────────────────────────────

  const fetchInvoiceStatus = useCallback(async (invoiceId: string): Promise<{ status: string; updatedAt: string } | null> => {
    try {
      const response = await fetch(
        `${apiUrl.replace(/\/$/, '')}/invoices/${invoiceId}`,
        {
          headers: {
            'X-Api-Token': apiToken,
            'X-Tenant-Id': tenantId,
          },
        },
      );
      if (!response.ok) return null;
      const body = safeJsonParse(await response.text());
      if (body && typeof body === 'object' && 'status' in body) {
        return { status: String(body.status), updatedAt: String((body as Record<string, unknown>).updatedAt ?? '') };
      }
      return null;
    } catch {
      return null;
    }
  }, [apiUrl, apiToken, tenantId]);

  const pollAll = useCallback(async () => {
    setInvoiceStatuses((prev) => {
      const pending = prev.filter((s) => !TERMINAL_STATUSES.has(s.status));
      if (pending.length === 0) return prev;

      Promise.all(
        pending.map(async (entry) => {
          const result = await fetchInvoiceStatus(entry.invoiceId);
          return { invoiceId: entry.invoiceId, result };
        }),
      ).then((updates) => {
        setInvoiceStatuses((current) =>
          current.map((entry) => {
            const update = updates.find((u) => u.invoiceId === entry.invoiceId);
            if (!update || !update.result) {
              return { ...entry, error: 'Falha ao buscar status', lastChecked: new Date() };
            }
            return { ...entry, status: update.result.status, updatedAt: update.result.updatedAt, lastChecked: new Date(), error: null };
          }),
        );
      });

      return prev.map((e) => ({ ...e, lastChecked: new Date() }));
    });
  }, [fetchInvoiceStatus]);

  useEffect(() => {
    if (!isPolling) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }
    pollAll();
    intervalRef.current = setInterval(pollAll, pollingInterval * 1000);
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [isPolling, pollingInterval, pollAll]);

  useEffect(() => {
    if (invoiceStatuses.length > 0 && invoiceStatuses.every((s) => TERMINAL_STATUSES.has(s.status))) {
      setIsPolling(false);
    }
  }, [invoiceStatuses]);

  // ── Confirmation ──────────────────────────────────

  const updateConfirmState = (index: number, patch: Partial<ConfirmState>) => {
    setConfirmStates((current) =>
      current.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );
  };

  const updateInvoiceStatusFromWebhook = (invoiceId: string, event: WebhookEvent) => {
    setInvoiceStatuses((current) =>
      current.map((s) =>
        s.invoiceId === invoiceId
          ? { ...s, status: localStatusAfterWebhook(event, s.status), lastChecked: new Date() }
          : s,
      ),
    );
  };

  const confirmViaWebhook = async (index: number) => {
    const result = compositionResults[index];
    if (!result || !isInvoiceResponse(result.invoiceResult)) return;
    const invoice = result.invoiceResult;

    const webhookPayload = {
      event: webhookEvent,
      payment: {
        id: invoice.providerPaymentId,
        status: webhookStatus(webhookEvent),
        value: invoice.amount,
        customer: customer.id,
        externalReference: invoice.externalReference,
        confirmedDate: new Date().toISOString().slice(0, 10),
        paymentDate: new Date().toISOString().slice(0, 10),
      },
    };

    updateConfirmState(index, { isConfirmingWebhook: true, webhookResult: null });

    try {
      const response = await fetch(`${apiUrl.replace(/\/$/, '')}/webhook/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'asaas-access-token': webhookToken,
        },
        body: JSON.stringify(webhookPayload),
      });
      const body = safeJsonParse(await response.text());
      updateConfirmState(index, { webhookResult: { ok: response.ok, status: response.status, body } });
      if (response.ok) updateInvoiceStatusFromWebhook(invoice.invoiceId, webhookEvent);
    } catch (err) {
      updateConfirmState(index, {
        webhookResult: { ok: false, status: 0, body: err instanceof Error ? err.message : 'Erro' },
      });
    } finally {
      updateConfirmState(index, { isConfirmingWebhook: false });
    }
  };

  const confirmViaSandbox = async (index: number) => {
    const result = compositionResults[index];
    if (!result || !isInvoiceResponse(result.invoiceResult)) return;
    const invoice = result.invoiceResult;

    updateConfirmState(index, { isConfirmingSandbox: true, sandboxResult: null });

    try {
      const response = await fetch(
        `${apiUrl.replace(/\/$/, '')}/sandbox/asaas/payments/${invoice.providerPaymentId}/confirm`,
        {
          method: 'POST',
          headers: { 'X-Correlation-Id': `frontend-sandbox-confirm-${invoice.orderId}` },
        },
      );
      const body = safeJsonParse(await response.text());
      updateConfirmState(index, { sandboxResult: { ok: response.ok, status: response.status, body } });
      if (response.ok && body && typeof body === 'object' && 'status' in body) {
        updateInvoiceStatusFromWebhook(invoice.invoiceId, 'PAYMENT_CONFIRMED');
      }
    } catch (err) {
      updateConfirmState(index, {
        sandboxResult: { ok: false, status: 0, body: err instanceof Error ? err.message : 'Erro' },
      });
    } finally {
      updateConfirmState(index, { isConfirmingSandbox: false });
    }
  };

  // ── Create composition ────────────────────────────

  const createComposition = async () => {
    setIsCreating(true);
    setError(null);
    setCompositionResults([]);
    setInvoiceStatuses([]);
    setConfirmStates([]);
    setIsPolling(false);

    const results: CompositionResult[] = [];
    const createdStatuses: InvoiceStatus[] = [];
    const newConfirmStates: ConfirmState[] = [];

    for (const method of methods) {
      const invoiceBody = {
        tenantId,
        orderId,
        customer: {
          id: customer.id,
          name: customer.name,
          document: customer.document,
          email: customer.email,
          mobilePhone: customer.mobilePhone,
        },
        amount: method.amount,
        currency,
        dueDate,
        billingType: method.billingType,
        provider: 'ASAAS',
        description: `Composição ${orderId} — ${method.billingType}`,
      };

      try {
        const response = await fetch(`${apiUrl.replace(/\/$/, '')}/invoices`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': `${orderId}:${method.billingType}:${method.id}`,
            'X-Correlation-Id': `frontend-multi-${orderId}`,
            'X-Api-Token': apiToken,
          },
          body: JSON.stringify(invoiceBody),
        });
        const body = safeJsonParse(await response.text());
        if (response.ok && isInvoiceResponse(body)) {
          results.push({ invoiceResult: body, error: null });
          createdStatuses.push({
            invoiceId: body.invoiceId,
            billingType: method.billingType,
            amount: method.amount,
            status: body.status,
            updatedAt: null,
            lastChecked: null,
            error: null,
          });
        } else {
          results.push({ invoiceResult: body, error: `HTTP ${response.status}` });
        }
      } catch (fetchError) {
        results.push({
          invoiceResult: null,
          error: fetchError instanceof Error ? fetchError.message : 'Falha na requisição',
        });
      }

      newConfirmStates.push({
        isConfirmingWebhook: false,
        isConfirmingSandbox: false,
        webhookResult: null,
        sandboxResult: null,
      });
    }

    setCompositionResults(results);
    setInvoiceStatuses(createdStatuses);
    setConfirmStates(newConfirmStates);
    setIsCreating(false);
  };

  const allTerminal = invoiceStatuses.length > 0 && invoiceStatuses.every((s) => TERMINAL_STATUSES.has(s.status));
  const hasSuccessfulInvoices = compositionResults.some(
    (r) => r && !r.error && isInvoiceResponse(r.invoiceResult),
  );

  const isLocalUrl = /localhost|127\.0\.0\.1/.test(apiUrl);
  const sandboxApiMismatch = isRealSandbox && isLocalUrl;

  return (
    <>
      <div className="experimental-notice">
        Tela experimental — EXP-007 Split Payment. O endpoint{' '}
        <code>POST /v1/payment-compositions</code> ainda não existe. Esta tela cria invoices
        individuais para o mesmo pedido usando <code>POST /invoices</code>.
      </div>

      {sandboxApiMismatch && (
        <div className="operational-note operational-note--warning">
          <strong>Runtime mismatch:</strong> o workbench está em <code>ASAAS_SANDBOX_REAL</code> mas
          a API aponta para <code>{apiUrl}</code>. O servidor precisa estar rodando com{' '}
          <code>ASAAS_MOCK=false</code> para criar cobranças reais. Inicie com:{' '}
          <code>bash api/scripts/start-asaas-sandbox-real.sh</code>
          <br />
          Para testes locais com mock, use o runtime <strong>Local mock</strong> e confirme via
          webhook local.
        </div>
      )}

      {/* ── Criar composição ── */}
      <section className="workspace">
        <div className="panel cart-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Carrinho</p>
              <h2>Itens do pedido</h2>
            </div>
            <button className="icon-button" type="button" onClick={addItem} title="Adicionar item">
              <Plus size={18} />
            </button>
          </div>

          <div className="cart-list">
            {items.map((item) => (
              <div className="cart-item" key={item.id}>
                <input
                  className="item-name"
                  value={item.name}
                  onChange={(event) => updateItem(item.id, 'name', event.target.value)}
                  aria-label="Nome do item"
                />
                <div className="quantity-control">
                  <button type="button" onClick={() => updateItem(item.id, 'quantity', Math.max(1, item.quantity - 1))} title="Diminuir">
                    <Minus size={15} />
                  </button>
                  <input
                    value={item.quantity}
                    min={1}
                    type="number"
                    onChange={(event) => updateItem(item.id, 'quantity', Math.max(1, Number(event.target.value)))}
                    aria-label="Quantidade"
                  />
                  <button type="button" onClick={() => updateItem(item.id, 'quantity', item.quantity + 1)} title="Aumentar">
                    <Plus size={15} />
                  </button>
                </div>
                <label className="money-input">
                  <span>Unitário</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(event) => updateItem(item.id, 'unitPrice', Number(event.target.value))}
                  />
                </label>
                <strong>{currencyFormatter.format(item.quantity * item.unitPrice)}</strong>
                <button className="ghost-icon" type="button" onClick={() => removeItem(item.id)} title="Remover">
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>

          <div className="total-bar">
            <div>
              <span>Total</span>
              <strong>{currencyFormatter.format(totalAmount)}</strong>
            </div>
            <ShoppingCart size={30} />
          </div>

          <div className="form-grid">
            <label>
              <span>Nome</span>
              <input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
            </label>
            <label>
              <span>Email</span>
              <input type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
            </label>
            <label>
              <span>Documento</span>
              <input value={customer.document} onChange={(e) => setCustomer({ ...customer, document: e.target.value })} />
            </label>
            <label>
              <span>Telefone</span>
              <input value={customer.mobilePhone} onChange={(e) => setCustomer({ ...customer, mobilePhone: e.target.value })} />
            </label>
            <label>
              <span>Vencimento</span>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </label>
          </div>
        </div>

        <div className="panel composition-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">EXP-007</p>
              <h2>Como você quer pagar?</h2>
            </div>
          </div>

          <div className="headers-box">
            <span>Total do pedido</span>
            <code>{currencyFormatter.format(totalAmount)}</code>
          </div>

          {methods.map((method, index) => {
            const pct = totalAmount > 0 ? Math.round((method.amount / totalAmount) * 100) : 0;
            return (
              <div className="method-row" key={method.id}>
                <strong style={{ minWidth: '1.5rem', color: '#5b6770', fontSize: '0.82rem' }}>#{index + 1}</strong>
                <select
                  value={method.billingType}
                  onChange={(e) => updateMethod(method.id, 'billingType', e.target.value as MethodBillingType)}
                >
                  <option value="PIX">PIX</option>
                  <option value="CREDIT_CARD">CREDIT_CARD</option>
                  <option value="BOLETO" disabled title="Fora do MVP — confirmação assíncrona incompatível com composição">BOLETO (indisponível)</option>
                </select>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={method.amount}
                  onChange={(e) => updateMethod(method.id, 'amount', Number(e.target.value))}
                  style={{ maxWidth: '120px' }}
                />
                <span className="method-percentage-badge">{pct}%</span>
                <button
                  className="ghost-icon"
                  type="button"
                  onClick={() => removeMethod(method.id)}
                  disabled={methods.length <= 1}
                  title="Remover método"
                >
                  <Minus size={15} />
                </button>
              </div>
            );
          })}

          <div className="actions" style={{ justifyContent: 'flex-start', marginTop: '0.5rem' }}>
            <button
              className="secondary-button"
              type="button"
              onClick={addMethod}
              disabled={methods.length >= 2 || remaining === 0}
            >
              <Plus size={16} />
              Adicionar método
            </button>
          </div>

          <div className={`remaining-row ${remaining === 0 ? 'balanced' : 'over'}`}>
            <span>Saldo restante:</span>
            <strong>{currencyFormatter.format(remaining)}</strong>
          </div>

          <label style={{ marginTop: '0.75rem' }}>
            <span>Política de falha</span>
            <select value={failurePolicy} onChange={(e) => setFailurePolicy(e.target.value as FailurePolicy)}>
              <option value="KEEP_CONFIRMED">KEEP_CONFIRMED</option>
              <option value="REVERT_ALL">REVERT_ALL</option>
              <option value="PARTIAL_WINDOW">PARTIAL_WINDOW</option>
            </select>
          </label>

          <textarea
            className="payload-editor"
            spellCheck={false}
            readOnly
            value={JSON.stringify(payload, null, 2)}
            style={{ marginTop: '1rem', minHeight: '280px' }}
          />

          <div className="actions">
            <button
              className="primary-button"
              type="button"
              onClick={createComposition}
              disabled={isCreating || remaining !== 0 || methods.length === 0}
            >
              {isCreating ? <Loader2 className="spin" size={18} /> : null}
              Criar Composição (invoices individuais)
            </button>
          </div>

          {error && <pre className="response error">{error}</pre>}

          {compositionResults.length > 0 && (
            <div className="composition-results">
              {compositionResults.map((result, index) => (
                <pre key={index} className={result?.error ? 'response error' : 'response success'}>
                  {JSON.stringify(
                    result?.error ? { error: result.error, body: result.invoiceResult } : result?.invoiceResult,
                    null, 2,
                  )}
                </pre>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Status / Polling ── */}
      {invoiceStatuses.length > 0 && (
        <section className="polling-section">
          <div className="panel polling-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">GET /invoices/:id</p>
                <h2>Status das invoices</h2>
              </div>
              <div className="polling-controls">
                <label className="polling-interval-label">
                  <span>Verificar a cada</span>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={pollingInterval}
                    onChange={(e) => setPollingInterval(Math.max(1, Number(e.target.value)))}
                    disabled={isPolling}
                    className="polling-interval-input"
                  />
                  <span>s</span>
                </label>

                {!isPolling ? (
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => setIsPolling(true)}
                    disabled={allTerminal}
                    title={allTerminal ? 'Todas as invoices em estado terminal' : undefined}
                  >
                    <Play size={15} />
                    Iniciar polling
                  </button>
                ) : (
                  <button className="secondary-button" type="button" onClick={() => setIsPolling(false)}>
                    <Square size={15} />
                    Parar
                  </button>
                )}

                <button className="secondary-button" type="button" onClick={pollAll} title="Verificar agora">
                  <RefreshCw size={15} />
                </button>
              </div>
            </div>

            {allTerminal && (
              <div className="polling-terminal-notice">
                Todas as invoices estão em estado terminal — polling encerrado automaticamente.
              </div>
            )}

            <table className="invoice-status-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Atualizado em</th>
                  <th>Última verificação</th>
                </tr>
              </thead>
              <tbody>
                {invoiceStatuses.map((entry) => (
                  <tr key={entry.invoiceId} className={TERMINAL_STATUSES.has(entry.status) ? 'row-terminal' : ''}>
                    <td className="invoice-id-cell"><code>{entry.invoiceId}</code></td>
                    <td>{entry.billingType}</td>
                    <td>{currencyFormatter.format(entry.amount)}</td>
                    <td>
                      <span className={statusClass(entry.status)}>
                        {STATUS_LABEL[entry.status] ?? entry.status}
                        {isPolling && !TERMINAL_STATUSES.has(entry.status) && (
                          <Loader2 size={11} className="spin" style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                        )}
                      </span>
                    </td>
                    <td className="muted-cell">
                      {entry.updatedAt ? new Date(entry.updatedAt).toLocaleTimeString('pt-BR') : '—'}
                    </td>
                    <td className="muted-cell">
                      {entry.error
                        ? <span style={{ color: '#a43b3b' }}>{entry.error}</span>
                        : entry.lastChecked ? entry.lastChecked.toLocaleTimeString('pt-BR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Confirmar pagamentos ── */}
      {hasSuccessfulInvoices && (
        <section className="confirm-section">
          <div className="confirm-section-header">
            <div>
              <p className="eyebrow">Webhook / Sandbox</p>
              <h2>Confirmar pagamentos</h2>
            </div>
            <label className="confirm-event-label">
              <span>Evento</span>
              <select
                value={webhookEvent}
                onChange={(e) => setWebhookEvent(e.target.value as WebhookEvent)}
              >
                {WEBHOOK_EVENTS.map((ev) => (
                  <option key={ev} value={ev}>{ev}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="confirm-cards">
            {compositionResults.map((result, index) => {
              if (!result || !isInvoiceResponse(result.invoiceResult)) return null;
              const invoice = result.invoiceResult;
              const cs = confirmStates[index];
              if (!cs) return null;

              const currentStatus = invoiceStatuses.find((s) => s.invoiceId === invoice.invoiceId)?.status ?? invoice.status;
              const isTerminal = TERMINAL_STATUSES.has(currentStatus);

              const webhookPayload = {
                event: webhookEvent,
                payment: {
                  id: invoice.providerPaymentId,
                  status: webhookStatus(webhookEvent),
                  value: invoice.amount,
                  customer: customer.id,
                  externalReference: invoice.externalReference,
                  confirmedDate: new Date().toISOString().slice(0, 10),
                  paymentDate: new Date().toISOString().slice(0, 10),
                },
              };

              return (
                <div
                  key={invoice.invoiceId}
                  className={`confirm-card${isTerminal ? ' confirm-card--terminal' : ''}`}
                >
                  <div className="confirm-card-header">
                    <div className="confirm-card-title">
                      <strong>#{index + 1} — {methods[index]?.billingType ?? invoice.providerPaymentId}</strong>
                      <code className="confirm-invoice-id">{invoice.invoiceId}</code>
                    </div>
                    <div className="confirm-card-meta">
                      <span>{currencyFormatter.format(invoice.amount)}</span>
                      <span className={statusClass(currentStatus)}>
                        {STATUS_LABEL[currentStatus] ?? currentStatus}
                      </span>
                    </div>
                  </div>

                  {invoice.paymentUrl && (
                    <div className="confirm-payment-url">
                      <span>URL de pagamento:</span>
                      <a href={invoice.paymentUrl} target="_blank" rel="noreferrer" className="payment-link">
                        {invoice.paymentUrl}
                      </a>
                    </div>
                  )}

                  <div className="confirm-payload-row">
                    <p className="confirm-payload-label">Payload do webhook</p>
                    <textarea
                      className="payload-editor"
                      spellCheck={false}
                      readOnly
                      value={JSON.stringify(webhookPayload, null, 2)}
                      style={{ minHeight: '180px', fontSize: '0.78rem' }}
                    />
                  </div>

                  <div className="confirm-actions">
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() => confirmViaWebhook(index)}
                      disabled={cs.isConfirmingWebhook || cs.isConfirmingSandbox || isTerminal}
                    >
                      {cs.isConfirmingWebhook ? <Loader2 className="spin" size={16} /> : <Webhook size={16} />}
                      Confirmar via webhook local
                    </button>

                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => confirmViaSandbox(index)}
                      disabled={cs.isConfirmingWebhook || cs.isConfirmingSandbox || isTerminal || !isRealSandbox}
                      title={!isRealSandbox ? 'Requer runtime ASAAS_SANDBOX_REAL (ASAAS_MOCK=false)' : undefined}
                    >
                      {cs.isConfirmingSandbox ? <Loader2 className="spin" size={16} /> : <CheckCircle2 size={16} />}
                      Confirmar via sandbox Asaas
                    </button>
                  </div>

                  {cs.webhookResult && (
                    <pre className={`response ${cs.webhookResult.ok ? 'success' : 'error'}`}>
                      {`HTTP ${cs.webhookResult.status} — webhook\n`}
                      {JSON.stringify(cs.webhookResult.body, null, 2)}
                    </pre>
                  )}

                  {cs.sandboxResult && (
                    <pre className={`response ${cs.sandboxResult.ok ? 'success' : 'error'}`}>
                      {`HTTP ${cs.sandboxResult.status} — sandbox\n`}
                      {JSON.stringify(cs.sandboxResult.body, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
