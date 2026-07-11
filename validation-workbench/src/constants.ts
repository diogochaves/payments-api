import type { CartItem, CustomerForm, SavedCard, NewCardForm, DeployEnv } from './types';

export const LOCAL_WEBHOOK_TOKEN =
  import.meta.env.VITE_LOCAL_WEBHOOK_TOKEN ?? 'payments-api-local-webhook-token-0001';

export const ENV_PRESETS: Record<DeployEnv, { apiUrl: string; apiToken: string; label: string; badge: string }> = {
  local: {
    apiUrl: import.meta.env.VITE_LOCAL_API_URL ?? 'http://localhost:3011',
    apiToken: import.meta.env.VITE_LOCAL_API_TOKEN ?? 'local-dev-token-insecure-do-not-use-in-prod',
    label: 'Local',
    badge: 'DEV',
  },
  staging: {
    apiUrl: import.meta.env.VITE_STAGING_API_URL ?? 'https://oj2st2d44b7bseur6rcd3nl77y0wlqec.lambda-url.us-east-1.on.aws',
    apiToken: import.meta.env.VITE_STAGING_API_TOKEN ?? '',
    label: 'Staging AWS',
    badge: 'STAGING',
  },
};

export const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export const initialItems: CartItem[] = [
  { id: crypto.randomUUID(), name: 'Camiseta ProdOps', quantity: 1, unitPrice: 89.9 },
  { id: crypto.randomUUID(), name: 'Adesivo Reliability', quantity: 2, unitPrice: 9.9 },
];

export const initialCustomer: CustomerForm = {
  id: 'customer-sandbox-001',
  name: 'Cliente Sandbox Magazine Siara',
  email: 'sandbox@example.com',
  document: '11144477735',
  mobilePhone: '11987654321',
};

export const initialSavedCards: SavedCard[] = [
  {
    id: 'card-sandbox-visa-001',
    holderName: 'Cliente Sandbox Magazine Siara',
    brand: 'VISA',
    last4: '1111',
    expiryMonth: '12',
    expiryYear: '2030',
    token: 'card_token_sandbox_visa_001',
  },
  {
    id: 'card-sandbox-master-002',
    holderName: 'Cliente Sandbox Magazine Siara',
    brand: 'MASTERCARD',
    last4: '4444',
    expiryMonth: '08',
    expiryYear: '2029',
    token: 'card_token_sandbox_master_002',
  },
];

export const initialNewCard: NewCardForm = {
  holderName: 'Cliente Sandbox Magazine Siara',
  number: '4111111111111111',
  expiryMonth: '12',
  expiryYear: '2030',
  cvv: '123',
};
