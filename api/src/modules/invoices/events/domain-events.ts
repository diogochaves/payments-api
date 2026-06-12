/**
 * Domain Events Constants
 * 
 * Regra de Sequência:
 * - COADJUVANTES são disparados primeiro e executam suas ações
 * - PROTAGONISTA só é disparado APÓS os coadjuvantes processarem suas ações
 */

export const INVOICE_EVENTS = {
  // Touchpoint 1: checkout_payment_completed
  // Coadjuvantes (disparados ANTES do protagonista)
  PAYMENT_INTENTION_RECEIVED: 'payments.payment.intention_received', // coadjuvant
  CUSTOMER_NOT_FOUND: 'payments.customer.not_found', // coadjuvant → ação: customer_created
  CUSTOMER_FOUND: 'payments.customer.found', // coadjuvant → ação: payment_processed

  // Protagonista (disparado APÓS coadjuvantes e suas ações)
  INVOICE_CREATED: 'payments.invoice.created', // protagonist

  // Touchpoint 2: customer_created
  // Protagonista (disparado após validação)
  CUSTOMER_CREATED: 'payments.customer.created', // protagonist → ação: payment_processed

  // Touchpoint 3: payment_processed
  // Protagonista
  PAYMENT_PROCESSED: 'payments.payment.processed', // protagonist
} as const;

/**
 * Estados de Processamento para rastrear o fluxo
 */
export enum ProcessingState {
  PENDING = 'pending',
  CUSTOMER_VALIDATION = 'customer_validation',
  CUSTOMER_NOT_FOUND_ACTION = 'customer_not_found_action',
  CUSTOMER_FOUND_ACTION = 'customer_found_action',
  INVOICE_CREATION = 'invoice_creation',
  PAYMENT_PROCESSING = 'payment_processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
