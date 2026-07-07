import { useEffect, useMemo, useState } from 'react';
import {
  Ban,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  Send,
  ShoppingCart,
  Trash2,
  Webhook,
} from 'lucide-react';
import type {
  BillingType,
  CartItem,
  CreditCardFlow,
  CustomerForm,
  DeployEnv,
  InvoiceResponse,
  NewCardForm,
  Provider,
  QueueSnapshot,
  RuntimeMode,
  SavedCard,
  SendResult,
  WebhookEvent,
} from '../types';
import {
  safeJsonParse,
  webhookStatus,
  localStatusAfterWebhook,
  inferCardBrand,
  isInvoiceResponse,
  isQueueSnapshot,
  isSandboxPaymentReceived,
  makeOrderId,
  futureDate,
} from '../utils';
import {
  currencyFormatter,
  initialItems,
  initialCustomer,
  initialSavedCards,
  initialNewCard,
} from '../constants';

interface SinglePaymentScreenProps {
  apiUrl: string;
  apiToken: string;
  webhookToken: string;
  tenantId: string;
  runtimeMode: RuntimeMode;
  deployEnv: DeployEnv;
}

export function SinglePaymentScreen({
  apiUrl,
  apiToken,
  webhookToken,
  tenantId,
  runtimeMode,
  deployEnv,
}: SinglePaymentScreenProps) {
  const [orderId, setOrderId] = useState(makeOrderId);
  const [customer, setCustomer] = useState<CustomerForm>(initialCustomer);
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [currency, setCurrency] = useState('BRL');
  const [dueDate, setDueDate] = useState(() => futureDate(7));
  const [billingType, setBillingType] = useState<BillingType>('PIX');
  const [creditCardFlow, setCreditCardFlow] = useState<CreditCardFlow>('HOSTED_INVOICE');
  const [savedCards, setSavedCards] = useState<SavedCard[]>(initialSavedCards);
  const [selectedCardId, setSelectedCardId] = useState(initialSavedCards[0]?.id ?? '');
  const [newCard, setNewCard] = useState<NewCardForm>(initialNewCard);
  const [remoteIp, setRemoteIp] = useState('127.0.0.1');
  const [provider, setProvider] = useState<Provider>('ASAAS');
  const [webhookEvent, setWebhookEvent] = useState<WebhookEvent>('PAYMENT_CONFIRMED');
  const [payloadText, setPayloadText] = useState('');
  const [isPayloadDirty, setIsPayloadDirty] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [lastInvoice, setLastInvoice] = useState<InvoiceResponse | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<SendResult | null>(null);
  const [sandboxConfirmationResult, setSandboxConfirmationResult] = useState<SendResult | null>(null);
  const [cancelResult, setCancelResult] = useState<SendResult | null>(null);
  const [queueSnapshot, setQueueSnapshot] = useState<QueueSnapshot | null>(null);
  const [queueResult, setQueueResult] = useState<SendResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmingSandboxPayment, setIsConfirmingSandboxPayment] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);

  const isRealAsaasSandbox = runtimeMode === 'ASAAS_SANDBOX_REAL';
  const isStaging = deployEnv === 'staging';

  // When runtimeMode changes to ASAAS_SANDBOX_REAL, force provider to ASAAS
  useEffect(() => {
    if (runtimeMode === 'ASAAS_SANDBOX_REAL') {
      setProvider('ASAAS');
    }
  }, [runtimeMode]);

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
    const selectedCard = savedCards.find((card) => card.id === selectedCardId);
    const cardPayload =
      billingType !== 'CREDIT_CARD'
        ? {}
        : creditCardFlow === 'SAVED_CARD' && selectedCard
          ? {
              creditCardToken: selectedCard.token,
              remoteIp,
              cardReference: {
                cardId: selectedCard.id,
                brand: selectedCard.brand,
                last4: selectedCard.last4,
                expiryMonth: selectedCard.expiryMonth,
                expiryYear: selectedCard.expiryYear,
              },
            }
          : creditCardFlow === 'NEW_CARD'
            ? {
                creditCard: {
                  holderName: newCard.holderName,
                  number: newCard.number,
                  expiryMonth: newCard.expiryMonth,
                  expiryYear: newCard.expiryYear,
                  ccv: newCard.cvv,
                },
                creditCardHolderInfo: {
                  name: customer.name,
                  email: customer.email,
                  cpfCnpj: customer.document,
                  phone: customer.mobilePhone,
                },
                remoteIp,
              }
            : {};

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
      ...cardPayload,
    };
  }, [
    amount,
    billingType,
    creditCardFlow,
    currency,
    customer,
    description,
    dueDate,
    newCard,
    orderId,
    provider,
    remoteIp,
    savedCards,
    selectedCardId,
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

  useEffect(() => {
    if (billingType === 'CREDIT_CARD' && creditCardFlow !== 'HOSTED_INVOICE') {
      setCreditCardFlow('HOSTED_INVOICE');
      setIsPayloadDirty(false);
    }
  }, [billingType, creditCardFlow]);

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

  const updateNewCard = <K extends keyof NewCardForm>(
    field: K,
    value: NewCardForm[K],
  ) => {
    setNewCard((current) => ({ ...current, [field]: value }));
    setIsPayloadDirty(false);
  };

  // updateNewCard is kept for future card flows; suppress unused-var lint if needed
  void updateNewCard;

  const registerNewCard = () => {
    const digits = newCard.number.replace(/\D/g, '');
    const last4 = digits.slice(-4).padStart(4, '0');
    const savedCard: SavedCard = {
      id: `card-workbench-${Date.now()}`,
      holderName: newCard.holderName,
      brand: inferCardBrand(digits),
      last4,
      expiryMonth: newCard.expiryMonth,
      expiryYear: newCard.expiryYear,
      token: `card_token_workbench_${last4}_${Date.now()}`,
    };

    setSavedCards((current) => [...current, savedCard]);
    setSelectedCardId(savedCard.id);
    setCreditCardFlow('SAVED_CARD');
    setIsPayloadDirty(false);
  };

  // registerNewCard is kept for future card flows
  void registerNewCard;

  const resetPayloadFromCart = () => {
    setPayloadText(JSON.stringify(payload, null, 2));
    setIsPayloadDirty(false);
    setError(null);
  };

  const copyPayload = async () => {
    await navigator.clipboard.writeText(payloadText);
  };

  const loadQueueSnapshot = async (showResult = true) => {
    setIsLoadingQueue(true);

    if (showResult) {
      setQueueResult(null);
    }

    try {
      const response = await fetch(`${apiUrl.replace(/\/$/, '')}/webhook/payments/queue`);
      const text = await response.text();
      const body = text ? safeJsonParse(text) : null;

      if (showResult) {
        setQueueResult({ ok: response.ok, status: response.status, body });
      }

      if (response.ok && isQueueSnapshot(body)) {
        setQueueSnapshot(body);
      }
    } catch (queueError) {
      if (showResult) {
        setQueueResult({
          ok: false,
          status: 0,
          body:
            queueError instanceof Error
              ? queueError.message
              : 'Falha ao consultar a fila.',
        });
      }
    } finally {
      setIsLoadingQueue(false);
    }
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
        'X-Api-Token': apiToken,
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
      setSandboxConfirmationResult(null);
      setCancelResult(null);

      if (response.ok && isInvoiceResponse(body)) {
        setLastInvoice(body);
        void loadQueueSnapshot(false);
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
        void loadQueueSnapshot(false);
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

  const confirmSandboxPayment = async () => {
    if (!lastInvoice) {
      return;
    }

    setIsConfirmingSandboxPayment(true);
    setError(null);
    setSandboxConfirmationResult(null);

    try {
      const response = await fetch(
        `${apiUrl.replace(/\/$/, '')}/sandbox/asaas/payments/${lastInvoice.providerPaymentId}/confirm`,
        {
          method: 'POST',
          headers: {
            'X-Correlation-Id': `frontend-sandbox-confirm-${lastInvoice.orderId}`,
          },
        },
      );

      const text = await response.text();
      const body = text ? safeJsonParse(text) : null;
      setSandboxConfirmationResult({ ok: response.ok, status: response.status, body });

      if (response.ok && lastInvoice) {
        setLastInvoice({
          ...lastInvoice,
          status: isSandboxPaymentReceived(body) ? body.status : lastInvoice.status,
        });
        window.setTimeout(() => void loadQueueSnapshot(false), 1200);
      }
    } catch (confirmationError) {
      setError(
        confirmationError instanceof Error
          ? confirmationError.message
          : 'Falha ao confirmar pagamento na Sandbox da Asaas.',
      );
    } finally {
      setIsConfirmingSandboxPayment(false);
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
            'X-Api-Token': apiToken,
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
    <>
      {isStaging && (
        <section className="operational-note operational-note--staging">
          <div>
            <span className="env-badge env-badge--staging">STAGING</span>
            <strong>Lambda AWS — us-east-1 · payments-api-staging</strong>
          </div>
          <p>
            Conectado à infraestrutura real na AWS. Webhooks simulados desabilitados —
            use a Sandbox da Asaas para disparar eventos reais. Fila SQS ativa.
          </p>
        </section>
      )}

      {!isStaging && isRealAsaasSandbox && (
        <section className="operational-note">
          <div>
            <span>Asaas Sandbox real</span>
            <strong>
              Webhook configurado pelo script <code>start-asaas-sandbox-real.sh</code>
            </strong>
          </div>
          <p>
            Crie a invoice aqui, confirme o pagamento na interface Sandbox da Asaas e acompanhe o webhook nos logs da API.
          </p>
        </section>
      )}

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
              <input value={tenantId} readOnly />
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
                onChange={(event) => {
                  const nextBillingType = event.target.value as BillingType;
                  setBillingType(nextBillingType);

                  if (nextBillingType === 'CREDIT_CARD') {
                    setCreditCardFlow('HOSTED_INVOICE');
                  }

                  setIsPayloadDirty(false);
                }}
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
                  <option value="SAVED_CARD" disabled>SAVED_CARD</option>
                  <option value="NEW_CARD" disabled>NEW_CARD</option>
                </select>
              </label>

              <label>
                <span>Remote IP</span>
                <input
                  value={remoteIp}
                  onChange={(event) => {
                    setRemoteIp(event.target.value);
                    setIsPayloadDirty(false);
                  }}
                  disabled={creditCardFlow === 'HOSTED_INVOICE'}
                />
              </label>

              <div className="headers-box wide-field">
                <span>Contrato ativo</span>
                <code>Cartao hospedado: sem creditCardToken, creditCard, cardReference ou remoteIp</code>
              </div>
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
            <span>X-Api-Token</span>
            <code>{apiToken || '(vazio — requisição será rejeitada com 401)'}</code>
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

          {lastInvoice?.paymentUrl && (
            <a
              className="payment-link"
              href={lastInvoice.paymentUrl}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={17} />
              Abrir cobrança na Asaas
            </a>
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
              <span>X-Api-Token</span>
              <code>{apiToken || '(vazio — requisição será rejeitada com 401)'}</code>
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
                <span>Origem</span>
                <strong>{isRealAsaasSandbox ? 'ASAAS_REAL' : 'SIMULACAO_LOCAL'}</strong>
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

            {isRealAsaasSandbox && (
              <div className="headers-box">
                <span>Webhook real</span>
                <code>Aguardando evento enviado pela Asaas para /webhook/payments</code>
              </div>
            )}

            {isRealAsaasSandbox && (
              <div className="sandbox-confirm-panel">
                <div className="panel-header queue-header">
                  <div>
                    <p className="eyebrow">Sandbox Asaas</p>
                    <h2>Confirmar pagamento</h2>
                  </div>
                  <CheckCircle2 size={22} />
                </div>

                <div className="headers-box">
                  <span>POST</span>
                  <code>
                    {lastInvoice
                      ? `/sandbox/asaas/payments/${lastInvoice.providerPaymentId}/confirm`
                      : '/sandbox/asaas/payments/:providerPaymentId/confirm'}
                  </code>
                </div>

                <div className="actions">
                  <button
                    className="primary-button"
                    type="button"
                    onClick={confirmSandboxPayment}
                    disabled={!lastInvoice || isConfirmingSandboxPayment}
                  >
                    {isConfirmingSandboxPayment ? (
                      <Loader2 className="spin" size={18} />
                    ) : (
                      <CheckCircle2 size={18} />
                    )}
                    Confirmar na Sandbox Asaas
                  </button>
                </div>

                {sandboxConfirmationResult && (
                  <pre className={sandboxConfirmationResult.ok ? 'response success' : 'response error'}>
                    {JSON.stringify(
                      {
                        status: sandboxConfirmationResult.status,
                        ok: sandboxConfirmationResult.ok,
                        body: sandboxConfirmationResult.body,
                      },
                      null,
                      2,
                    )}
                  </pre>
                )}
              </div>
            )}

            <div className="queue-panel">
              <div className="panel-header queue-header">
                <div>
                  <p className="eyebrow">Fila de webhook</p>
                  <h2>{queueSnapshot?.configured ? 'SQS configurada' : 'Processamento direto'}</h2>
                </div>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => void loadQueueSnapshot()}
                  title="Atualizar fila"
                >
                  {isLoadingQueue ? <Loader2 className="spin" size={17} /> : <RefreshCw size={17} />}
                </button>
              </div>

              <div className="status-grid queue-grid">
                <div>
                  <span>Modo</span>
                  <strong>{queueSnapshot?.processingMode ?? (isRealAsaasSandbox ? 'sync' : '-')}</strong>
                </div>
                <div>
                  <span>Recebidas</span>
                  <strong>{queueSnapshot?.queue?.approximateNumberOfMessages ?? 0}</strong>
                </div>
                <div>
                  <span>Em processamento</span>
                  <strong>{queueSnapshot?.queue?.approximateNumberOfMessagesNotVisible ?? 0}</strong>
                </div>
                <div>
                  <span>DLQ</span>
                  <strong className={queueSnapshot?.deadLetterQueue?.approximateNumberOfMessages ? 'status-danger' : ''}>
                    {queueSnapshot?.deadLetterQueue?.approximateNumberOfMessages ?? 0}
                  </strong>
                </div>
              </div>

              <div className="headers-box">
                <span>Queue URL</span>
                <code>{queueSnapshot?.queueUrl ?? 'WEBHOOK_QUEUE_URL não configurada'}</code>
                <span>DLQ URL</span>
                <code>{queueSnapshot?.deadLetterQueueUrl ?? 'WEBHOOK_DLQ_URL não configurada'}</code>
              </div>

              {queueResult && (
                <pre className={queueResult.ok ? 'response success' : 'response error'}>
                  {JSON.stringify(
                    {
                      status: queueResult.status,
                      ok: queueResult.ok,
                      body: queueResult.body,
                    },
                    null,
                    2,
                  )}
                </pre>
              )}
            </div>

            <div className="actions">
              <button
                className="primary-button"
                type="button"
                onClick={confirmPayment}
                disabled={!confirmationPayload || isConfirming || isRealAsaasSandbox || isStaging}
              >
                {isConfirming ? <Loader2 className="spin" size={18} /> : <CheckCircle2 size={18} />}
                {isStaging ? 'Webhook via Asaas (real)' : isRealAsaasSandbox ? 'Webhook via Asaas' : 'Enviar webhook'}
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
    </>
  );
}
