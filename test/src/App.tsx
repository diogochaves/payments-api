import { useEffect, useMemo, useState } from 'react';
import {
  Copy,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  Send,
  ShoppingCart,
  Trash2,
} from 'lucide-react';

type PaymentMode = 'payments' | 'invoices';
type BillingType = 'BOLETO' | 'PIX' | 'CREDIT_CARD' | 'UNDEFINED';
type Provider = 'ASAAS' | 'ITAU';

type CartItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

type CustomerForm = {
  id: string;
  externalId: string;
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
  externalId: 'external-sandbox-001',
  name: 'Cliente Sandbox Magazine Siara',
  email: 'sandbox@example.com',
  document: '11144477735',
  mobilePhone: '11987654321',
};

function App() {
  const [apiUrl, setApiUrl] = useState('http://localhost:3011');
  const [mode, setMode] = useState<PaymentMode>('invoices');
  const [tenantId, setTenantId] = useState('magazine-siara');
  const [orderId, setOrderId] = useState(makeOrderId);
  const [customer, setCustomer] = useState<CustomerForm>(initialCustomer);
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [currency, setCurrency] = useState('BRL');
  const [dueDate, setDueDate] = useState(() => futureDate(7));
  const [billingType, setBillingType] = useState<BillingType>('PIX');
  const [provider, setProvider] = useState<Provider>('ASAAS');
  const [payloadText, setPayloadText] = useState('');
  const [isPayloadDirty, setIsPayloadDirty] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

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
    if (mode === 'payments') {
      return {
        tenantId,
        amount: Number(amount.toFixed(2)),
        description,
        customer: {
          externalId: customer.externalId,
          name: customer.name,
          email: customer.email,
          cpfCnpj: customer.document,
        },
      };
    }

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
    };
  }, [
    amount,
    billingType,
    currency,
    customer,
    description,
    dueDate,
    mode,
    orderId,
    provider,
    tenantId,
  ]);

  useEffect(() => {
    if (!isPayloadDirty) {
      setPayloadText(JSON.stringify(payload, null, 2));
    }
  }, [isPayloadDirty, payload]);

  const endpoint = mode === 'payments' ? '/payments' : '/invoices';
  const idempotencyKey = `${orderId}:create`;

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
      };

      if (mode === 'invoices') {
        headers['Idempotency-Key'] = idempotencyKey;
        headers['X-Correlation-Id'] = `frontend-${orderId}`;
      }

      const response = await fetch(`${apiUrl.replace(/\/$/, '')}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(parsedPayload),
      });

      const text = await response.text();
      const body = text ? safeJsonParse(text) : null;
      setResult({ ok: response.ok, status: response.status, body });
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

  return (
    <main className="app-shell">
      <section className="toolbar">
        <div>
          <p className="eyebrow">Payments API</p>
          <h1>Testador de carrinho e payload</h1>
        </div>

        <label className="api-field">
          <span>API URL</span>
          <input
            value={apiUrl}
            onChange={(event) => setApiUrl(event.target.value)}
            placeholder="http://localhost:3011"
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
                value={customer.externalId}
                onChange={(event) =>
                  setCustomer({ ...customer, externalId: event.target.value })
                }
              />
            </label>
          </div>
        </div>

        <div className="panel payload-panel">
          <div className="panel-header payload-header">
            <div>
              <p className="eyebrow">Payload</p>
              <h2>{endpoint}</h2>
            </div>

            <div className="mode-switch" role="group" aria-label="Tipo de payload">
              <button
                className={mode === 'invoices' ? 'active' : ''}
                type="button"
                onClick={() => {
                  setMode('invoices');
                  setIsPayloadDirty(false);
                }}
              >
                Invoices
              </button>
              <button
                className={mode === 'payments' ? 'active' : ''}
                type="button"
                onClick={() => {
                  setMode('payments');
                  setIsPayloadDirty(false);
                }}
              >
                Payments
              </button>
            </div>
          </div>

          {mode === 'invoices' && (
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
              Enviar
            </button>
          </div>

          {mode === 'invoices' && (
            <div className="headers-box">
              <span>Idempotency-Key</span>
              <code>{idempotencyKey}</code>
            </div>
          )}

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

export default App;
