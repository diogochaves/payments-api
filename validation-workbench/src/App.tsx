import { useEffect, useMemo, useState } from 'react';
import {
  Ban,
  CheckCircle2,
  Copy,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  Send,
  ShoppingCart,
  Trash2,
  Webhook,
} from 'lucide-react';

type BillingType = 'BOLETO' | 'PIX' | 'CREDIT_CARD' | 'UNDEFINED';
type Provider = 'ASAAS' | 'ITAU';
type CreditCardFlow = 'HOSTED_INVOICE' | 'TOKENIZED';
type WebhookEvent =
  | 'PAYMENT_AWAITING_RISK_ANALYSIS'
  | 'PAYMENT_APPROVED_BY_RISK_ANALYSIS'
  | 'PAYMENT_REPROVED_BY_RISK_ANALYSIS'
  | 'PAYMENT_AUTHORIZED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_DELETED'
  | 'PAYMENT_REFUNDED';

type CartItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

type CustomerForm = {
  id: string;
  name: string;
  email: string;
  document: string;
  mobilePhone: string;
};

type SendResult = {
  ok: boolean;
  status: number;
  body: unknown;
};

type InvoiceResponse = {
  invoiceId: string;
  orderId: string;
  provider: Provider;
  providerPaymentId: string;
  status: string;
  amount: number;
  currency: string;
  paymentUrl?: string;
  externalReference: string;
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const makeOrderId = () => `MS-TEST-${Date.now()}`;

const futureDate = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const initialItems: CartItem[] = [
  { id: crypto.randomUUID(), name: 'Camiseta ProdOps', quantity: 1, unitPrice: 89.9 },
  { id: crypto.randomUUID(), name: 'Adesivo Reliability', quantity: 2, unitPrice: 9.9 },
];

const initialCustomer: CustomerForm = {
  id: 'customer-sandbox-001',
  name: 'Cliente Sandbox Magazine Siara',
  email: 'sandbox@example.com',
  document: '11144477735',
  mobilePhone: '11987654321',
};

function App() {
  const [apiUrl, setApiUrl] = useState('http://localhost:3011');
  const [webhookToken, setWebhookToken] = useState('webhook-secret');
  const [tenantId, setTenantId] = useState('magazine-siara');
  const [orderId, setOrderId] = useState(makeOrderId);
  const [customer, setCustomer] = useState<CustomerForm>(initialCustomer);
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [currency, setCurrency] = useState('BRL');
  const [dueDate, setDueDate] = useState(() => futureDate(7));
  const [billingType, setBillingType] = useState<BillingType>('PIX');
  const [creditCardFlow, setCreditCardFlow] = useState<CreditCardFlow>('HOSTED_INVOICE');
  const [creditCardToken, setCreditCardToken] = useState('card_token_sandbox');
  const [remoteIp, setRemoteIp] = useState('127.0.0.1');
  const [provider, setProvider] = useState<Provider>('ASAAS');
  const [webhookEvent, setWebhookEvent] = useState<WebhookEvent>('PAYMENT_CONFIRMED');
  const [payloadText, setPayloadText] = useState('');
  const [isPayloadDirty, setIsPayloadDirty] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [lastInvoice, setLastInvoice] = useState<InvoiceResponse | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<SendResult | null>(null);
  const [cancelResult, setCancelResult] = useState<SendResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const amount = useMemo(
    () => items.reduce((total, item) => total + item.quantity * item.unitPrice, 0),
    [items],
  );

  const description = useMemo(() => {
    const summary = items
      .map((item) => `${item.quantity}x ${item.name}`)
      .join(', ');
    return `Pedido ${orderId}: ${summary}`;
  }, [items, orderId]);

  const payload = useMemo(() => {
    return {
      tenantId,
      orderId,
      customer: {
        id: customer.id,
        name: customer.name,
        document: customer.document,
        email: customer.email,
        mobilePhone: customer.mobilePhone,
      },
      amount: Number(amount.toFixed(2)),
      currency,
      dueDate,
      billingType,
      provider,
      description,
      ...(billingType === 'CREDIT_CARD' && creditCardFlow === 'TOKENIZED'
        ? {
            creditCardToken,
            remoteIp,
          }
        : {}),
    };
  }, [
    amount,
    billingType,
    creditCardFlow,
    creditCardToken,
    currency,
    customer,
    description,
    dueDate,
    orderId,
    provider,
    remoteIp,
    tenantId,
  ]);

  const confirmationPayload = useMemo(() => {
    if (!lastInvoice) {
      return null;
    }

    return {
      event: webhookEvent,
      payment: {
        id: lastInvoice.providerPaymentId,
        status: webhookStatus(webhookEvent),
        value: lastInvoice.amount,
        customer: customer.id,
        externalReference: lastInvoice.externalReference,
        confirmedDate: new Date().toISOString().slice(0, 10),
        paymentDate: new Date().toISOString().slice(0, 10),
      },
    };
  }, [customer.id, lastInvoice, webhookEvent]);

  useEffect(() => {
    if (!isPayloadDirty) {
      setPayloadText(JSON.stringify(payload, null, 2));
    }
  }, [isPayloadDirty, payload]);

  const endpoint = '/invoices';
  const idempotencyKey = `${orderId}:create`;
  const cancelIdempotencyKey = `${lastInvoice?.orderId ?? orderId}:cancel`;
  const isCreditCard = billingType === 'CREDIT_CARD';

  const updateItem = <K extends keyof CartItem>(
    id: string,
    field: K,
    value: CartItem[K],
  ) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
    setIsPayloadDirty(false);
  };

  const addItem = () => {
    setItems((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name: 'Novo item',
        quantity: 1,
        unitPrice: 19.9,
      },
    ]);
    setIsPayloadDirty(false);
  };

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    setIsPayloadDirty(false);
  };

  const resetPayloadFromCart = () => {
    setPayloadText(JSON.stringify(payload, null, 2));
    setIsPayloadDirty(false);
    setError(null);
  };

  const copyPayload = async () => {
    await navigator.clipboard.writeText(payloadText);
  };

  const sendPayment = async () => {
    setIsSending(true);
    setError(null);
    setResult(null);

    try {
      const parsedPayload = JSON.parse(payloadText) as unknown;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
        'X-Correlation-Id': `frontend-${orderId}`,
      };

      const response = await fetch(`${apiUrl.replace(/\/$/, '')}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(parsedPayload),
      });

      const text = await response.text();
      const body = text ? safeJsonParse(text) : null;
      setResult({ ok: response.ok, status: response.status, body });
      setConfirmationResult(null);
      setCancelResult(null);

      if (response.ok && isInvoiceResponse(body)) {
        setLastInvoice(body);
      }
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : 'Falha ao enviar o payload.',
      );
    } finally {
      setIsSending(false);
    }
  };

  const confirmPayment = async () => {
    if (!confirmationPayload) {
      return;
    }

    setIsConfirming(true);
    setError(null);
    setConfirmationResult(null);

    try {
      const response = await fetch(`${apiUrl.replace(/\/$/, '')}/webhook/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'asaas-access-token': webhookToken,
        },
        body: JSON.stringify(confirmationPayload),
      });

      const text = await response.text();
      const body = text ? safeJsonParse(text) : null;
      setConfirmationResult({ ok: response.ok, status: response.status, body });

      if (response.ok && lastInvoice) {
        setLastInvoice({ ...lastInvoice, status: localStatusAfterWebhook(webhookEvent, lastInvoice.status) });
      }
    } catch (confirmationError) {
      setError(
        confirmationError instanceof Error
          ? confirmationError.message
          : 'Falha ao confirmar o pagamento.',
      );
    } finally {
      setIsConfirming(false);
    }
  };

  const cancelInvoice = async () => {
    if (!lastInvoice) {
      return;
    }

    setIsCancelling(true);
    setError(null);
    setCancelResult(null);

    try {
      const response = await fetch(
        `${apiUrl.replace(/\/$/, '')}/invoices/${lastInvoice.invoiceId}`,
        {
          method: 'DELETE',
          headers: {
            'X-Tenant-Id': tenantId,
            'Idempotency-Key': cancelIdempotencyKey,
            'X-Correlation-Id': `frontend-cancel-${lastInvoice.orderId}`,
          },
        },
      );

      const text = await response.text();
      const body = text ? safeJsonParse(text) : null;
      setCancelResult({ ok: response.ok, status: response.status, body });

      if (response.ok && isInvoiceResponse(body)) {
        setLastInvoice(body);
      }
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : 'Falha ao cancelar a invoice.',
      );
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <main className="app-shell">
      <section className="toolbar">
        <div>
          <p className="eyebrow">Payments API</p>
          <h1>Testador BDD de pagamentos</h1>
        </div>

        <label className="api-field">
          <span>API URL</span>
          <input
            value={apiUrl}
            onChange={(event) => setApiUrl(event.target.value)}
            placeholder="http://localhost:3011"
          />
        </label>
        <label className="api-field">
          <span>Webhook token</span>
          <input
            value={webhookToken}
            onChange={(event) => setWebhookToken(event.target.value)}
            placeholder="ASAAS_WEBHOOK_TOKEN"
          />
        </label>
      </section>

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
                  <button
                    type="button"
                    onClick={() =>
                      updateItem(item.id, 'quantity', Math.max(1, item.quantity - 1))
                    }
                    title="Diminuir quantidade"
                  >
                    <Minus size={15} />
                  </button>
                  <input
                    value={item.quantity}
                    min={1}
                    type="number"
                    onChange={(event) =>
                      updateItem(
                        item.id,
                        'quantity',
                        Math.max(1, Number(event.target.value)),
                      )
                    }
                    aria-label="Quantidade"
                  />
                  <button
                    type="button"
                    onClick={() => updateItem(item.id, 'quantity', item.quantity + 1)}
                    title="Aumentar quantidade"
                  >
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
                    onChange={(event) =>
                      updateItem(item.id, 'unitPrice', Number(event.target.value))
                    }
                  />
                </label>

                <strong>{currencyFormatter.format(item.quantity * item.unitPrice)}</strong>

                <button
                  className="ghost-icon"
                  type="button"
                  onClick={() => removeItem(item.id)}
                  title="Remover item"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>

          <div className="total-bar">
            <div>
              <span>Total</span>
              <strong>{currencyFormatter.format(amount)}</strong>
            </div>
            <ShoppingCart size={30} />
          </div>

          <div className="form-grid">
            <label>
              <span>Tenant</span>
              <input value={tenantId} onChange={(event) => setTenantId(event.target.value)} />
            </label>
            <label>
              <span>Order ID</span>
              <div className="inline-input">
                <input value={orderId} onChange={(event) => setOrderId(event.target.value)} />
                <button type="button" onClick={() => setOrderId(makeOrderId())} title="Gerar order ID">
                  <RefreshCw size={16} />
                </button>
              </div>
            </label>
            <label>
              <span>Nome</span>
              <input
                value={customer.name}
                onChange={(event) => setCustomer({ ...customer, name: event.target.value })}
              />
            </label>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={customer.email}
                onChange={(event) => setCustomer({ ...customer, email: event.target.value })}
              />
            </label>
            <label>
              <span>Documento</span>
              <input
                value={customer.document}
                onChange={(event) =>
                  setCustomer({ ...customer, document: event.target.value })
                }
              />
            </label>
            <label>
              <span>Telefone</span>
              <input
                value={customer.mobilePhone}
                onChange={(event) =>
                  setCustomer({ ...customer, mobilePhone: event.target.value })
                }
              />
            </label>
            <label>
              <span>Customer ID</span>
              <input
                value={customer.id}
                onChange={(event) => setCustomer({ ...customer, id: event.target.value })}
              />
            </label>
            <label>
              <span>External ID</span>
              <input
                value={orderId}
                readOnly
              />
            </label>
          </div>
        </div>

        <div className="panel payload-panel">
          <div className="panel-header payload-header">
            <div>
              <p className="eyebrow">Feature 1</p>
              <h2>Criar invoice</h2>
            </div>
            <Send size={24} />
          </div>

          <div className="invoice-options">
            <label>
              <span>Vencimento</span>
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </label>
            <label>
              <span>Billing</span>
              <select
                value={billingType}
                onChange={(event) => setBillingType(event.target.value as BillingType)}
              >
                <option value="PIX">PIX</option>
                <option value="BOLETO">BOLETO</option>
                <option value="CREDIT_CARD">CREDIT_CARD</option>
                <option value="UNDEFINED">UNDEFINED</option>
              </select>
            </label>
            <label>
              <span>Provider</span>
              <select
                value={provider}
                onChange={(event) => setProvider(event.target.value as Provider)}
              >
                <option value="ASAAS">ASAAS</option>
                <option value="ITAU">ITAU</option>
              </select>
            </label>
            <label>
              <span>Moeda</span>
              <input value={currency} onChange={(event) => setCurrency(event.target.value)} />
            </label>
          </div>

          {isCreditCard && (
            <div className="card-experiment-grid">
              <label>
                <span>Fluxo cartão</span>
                <select
                  value={creditCardFlow}
                  onChange={(event) => {
                    setCreditCardFlow(event.target.value as CreditCardFlow);
                    setIsPayloadDirty(false);
                  }}
                >
                  <option value="HOSTED_INVOICE">HOSTED_INVOICE</option>
                  <option value="TOKENIZED">TOKENIZED</option>
                </select>
              </label>

              <label>
                <span>Credit card token</span>
                <input
                  value={creditCardToken}
                  onChange={(event) => {
                    setCreditCardToken(event.target.value);
                    setIsPayloadDirty(false);
                  }}
                  disabled={creditCardFlow !== 'TOKENIZED'}
                />
              </label>

              <label>
                <span>Remote IP</span>
                <input
                  value={remoteIp}
                  onChange={(event) => {
                    setRemoteIp(event.target.value);
                    setIsPayloadDirty(false);
                  }}
                  disabled={creditCardFlow !== 'TOKENIZED'}
                />
              </label>
            </div>
          )}

          <textarea
            className="payload-editor"
            spellCheck={false}
            value={payloadText}
            onChange={(event) => {
              setPayloadText(event.target.value);
              setIsPayloadDirty(true);
            }}
          />

          <div className="actions">
            <button className="secondary-button" type="button" onClick={resetPayloadFromCart}>
              <RefreshCw size={17} />
              Sincronizar
            </button>
            <button className="secondary-button" type="button" onClick={copyPayload}>
              <Copy size={17} />
              Copiar
            </button>
            <button
              className="primary-button"
              type="button"
              onClick={sendPayment}
              disabled={isSending || items.length === 0}
            >
              {isSending ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
              Criar invoice
            </button>
          </div>

          <div className="headers-box">
            <span>POST {endpoint} | Idempotency-Key</span>
            <code>{idempotencyKey}</code>
          </div>

          {error && <pre className="response error">{error}</pre>}

          {result && (
            <pre className={result.ok ? 'response success' : 'response error'}>
              {JSON.stringify(
                {
                  status: result.status,
                  ok: result.ok,
                  body: result.body,
                },
                null,
                2,
              )}
            </pre>
          )}
        </div>

        <div className="feature-row">
          <div className="panel feature-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Feature 2</p>
                <h2>Cancelar invoice</h2>
              </div>
              <Ban size={24} />
            </div>

            <div className="status-grid compact">
              <div>
                <span>Invoice</span>
                <strong>{lastInvoice?.invoiceId ?? 'Aguardando criação'}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong className={lastInvoice?.status === 'CANCELLED' ? 'status-danger' : ''}>
                  {lastInvoice?.status ?? 'NAO_CRIADA'}
                </strong>
              </div>
              <div>
                <span>Provider payment</span>
                <strong>{lastInvoice?.providerPaymentId ?? '-'}</strong>
              </div>
              <div>
                <span>DELETE</span>
                <strong>{lastInvoice ? `/invoices/${lastInvoice.invoiceId}` : '/invoices/:id'}</strong>
              </div>
            </div>

            <div className="headers-box">
              <span>X-Tenant-Id</span>
              <code>{tenantId}</code>
              <span>Idempotency-Key</span>
              <code>{cancelIdempotencyKey}</code>
            </div>

            <div className="actions">
              <button
                className="danger-button"
                type="button"
                onClick={cancelInvoice}
                disabled={!lastInvoice || isCancelling || lastInvoice.status === 'CONFIRMED'}
              >
                {isCancelling ? <Loader2 className="spin" size={18} /> : <Ban size={18} />}
                Cancelar invoice
              </button>
            </div>

            {lastInvoice?.status === 'CONFIRMED' && (
              <pre className="response error">
                Cancelamento bloqueado para invoice confirmada. Use o fluxo de estorno.
              </pre>
            )}

            {cancelResult && (
              <pre className={cancelResult.ok ? 'response success' : 'response error'}>
                {JSON.stringify(
                  {
                    status: cancelResult.status,
                    ok: cancelResult.ok,
                    body: cancelResult.body,
                  },
                  null,
                  2,
                )}
              </pre>
            )}
          </div>

        <div className="panel feature-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Feature 3</p>
              <h2>Webhook de pagamento</h2>
            </div>
            <Webhook size={24} />
          </div>

          <div className="status-grid">
            <div>
              <span>Invoice</span>
              <strong>{lastInvoice?.invoiceId ?? 'Aguardando criação'}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong className={lastInvoice?.status === 'CONFIRMED' ? 'status-ok' : ''}>
                {lastInvoice?.status ?? 'NAO_CRIADA'}
              </strong>
            </div>
            <div>
              <span>Provider payment</span>
              <strong>{lastInvoice?.providerPaymentId ?? '-'}</strong>
            </div>
            <div>
              <span>External reference</span>
              <strong>{lastInvoice?.externalReference ?? orderId}</strong>
            </div>
          </div>

          <label className="webhook-event-field">
            <span>Evento Asaas</span>
            <select
              value={webhookEvent}
              onChange={(event) => setWebhookEvent(event.target.value as WebhookEvent)}
            >
                <option value="PAYMENT_CONFIRMED">PAYMENT_CONFIRMED</option>
                <option value="PAYMENT_RECEIVED">PAYMENT_RECEIVED</option>
                <option value="PAYMENT_AWAITING_RISK_ANALYSIS">
                  PAYMENT_AWAITING_RISK_ANALYSIS
                </option>
                <option value="PAYMENT_APPROVED_BY_RISK_ANALYSIS">
                  PAYMENT_APPROVED_BY_RISK_ANALYSIS
                </option>
                <option value="PAYMENT_REPROVED_BY_RISK_ANALYSIS">
                  PAYMENT_REPROVED_BY_RISK_ANALYSIS
                </option>
                <option value="PAYMENT_AUTHORIZED">PAYMENT_AUTHORIZED</option>
                <option value="PAYMENT_CREDIT_CARD_CAPTURE_REFUSED">
                  PAYMENT_CREDIT_CARD_CAPTURE_REFUSED
                </option>
                <option value="PAYMENT_OVERDUE">PAYMENT_OVERDUE</option>
                <option value="PAYMENT_DELETED">PAYMENT_DELETED</option>
                <option value="PAYMENT_REFUNDED">PAYMENT_REFUNDED</option>
              </select>
            </label>

          <pre className="webhook-preview">
            {JSON.stringify(confirmationPayload ?? { event: webhookEvent }, null, 2)}
          </pre>

          <div className="actions">
            <button
              className="primary-button"
              type="button"
              onClick={confirmPayment}
              disabled={!confirmationPayload || isConfirming}
            >
              {isConfirming ? <Loader2 className="spin" size={18} /> : <CheckCircle2 size={18} />}
              Enviar webhook
            </button>
          </div>

          {confirmationResult && (
            <pre className={confirmationResult.ok ? 'response success' : 'response error'}>
              {JSON.stringify(
                {
                  status: confirmationResult.status,
                  ok: confirmationResult.ok,
                  body: confirmationResult.body,
                },
                null,
                2,
              )}
            </pre>
          )}
        </div>
        </div>
      </section>
    </main>
  );
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function webhookStatus(event: WebhookEvent) {
  if (event === 'PAYMENT_AUTHORIZED') {
    return 'AUTHORIZED';
  }

  if (event === 'PAYMENT_RECEIVED') {
    return 'RECEIVED';
  }

  if (event === 'PAYMENT_DELETED') {
    return 'DELETED';
  }

  if (event === 'PAYMENT_REFUNDED') {
    return 'REFUNDED';
  }

  if (event === 'PAYMENT_OVERDUE') {
    return 'OVERDUE';
  }

  if (
    event === 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED' ||
    event === 'PAYMENT_REPROVED_BY_RISK_ANALYSIS'
  ) {
    return 'REFUSED';
  }

  return 'CONFIRMED';
}

function localStatusAfterWebhook(event: WebhookEvent, currentStatus: string) {
  if (event === 'PAYMENT_CONFIRMED') {
    return 'CONFIRMED';
  }

  if (event === 'PAYMENT_RECEIVED') {
    return 'RECEIVED';
  }

  return currentStatus;
}

function isInvoiceResponse(body: unknown): body is InvoiceResponse {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const invoice = body as Partial<InvoiceResponse>;

  return (
    typeof invoice.invoiceId === 'string' &&
    typeof invoice.orderId === 'string' &&
    typeof invoice.providerPaymentId === 'string' &&
    typeof invoice.externalReference === 'string'
  );
}

export default App;
