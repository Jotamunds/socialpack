/**
 * Códigos estruturados para eventos de webhook em revisão manual (manual_review).
 * Permitem apresentação padronizada na interface e rastreabilidade na auditoria.
 *
 * Definidos no PLANO DE IMPLEMENTAÇÃO (Seção 1).
 */
export const BILLING_REVIEW_CODES = {
  /** Valor pago maior que o plano; estorno solicitado ao Asaas com sucesso. */
  OVERPAID_REFUNDED: "OVERPAID_REFUNDED",
  /** Valor pago maior; a chamada de estorno falhou (saldo indisponível, erro de rede/Asaas). Suporte resolve manualmente. */
  OVERPAID_REFUND_FAILED: "OVERPAID_REFUND_FAILED",
  /** Valor pago menor que o plano (ex.: boleto parcial). Nenhuma ativação. */
  UNDERPAID: "UNDERPAID",
  /** Pagamento recebido por meio fora da lista aceita (inclui RECEIVED_IN_CASH), com valor exato. */
  UNSUPPORTED_METHOD: "UNSUPPORTED_METHOD",
  /** Pagamento sem assinatura local correlacionável. */
  UNMATCHED_PAYMENT: "UNMATCHED_PAYMENT",
  /** Pagamento associado a um link de pagamento obsoleto/anterior. */
  STALE_LINK: "STALE_LINK",
  /** Checkout divergente do pending_checkout_id registrado para o usuário. */
  DIVERGENT_CHECKOUT: "DIVERGENT_CHECKOUT",
  /** Plano do pagamento diverge do pending_plan registrado na assinatura. */
  PLAN_MISMATCH: "PLAN_MISMATCH",
  /** Pagamento sem dados suficientes para correlação segura com assinatura local. */
  NO_CORRELATION: "NO_CORRELATION",
} as const;

export type BillingReviewCode =
  (typeof BILLING_REVIEW_CODES)[keyof typeof BILLING_REVIEW_CODES];

export function isValidReviewCode(code: unknown): code is BillingReviewCode {
  return (
    typeof code === "string" &&
    Object.values(BILLING_REVIEW_CODES).includes(code as BillingReviewCode)
  );
}
