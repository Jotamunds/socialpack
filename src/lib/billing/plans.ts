import "server-only";

export type BillingPlanId = "starter" | "pro";

export interface BillingPlanConfig {
  readonly id: BillingPlanId;
  readonly name: string;
  readonly price: number;
  readonly priceCents: number;
  readonly companyQuota: number;
  readonly cycle: "MONTHLY";
  readonly description: string;
}

/**
 * Tabela canônica de planos e preços fixos no servidor.
 * Qualquer tentativa de definir preço ou cota fora daqui é estritamente ignorada.
 *
 * Starter: R$ 49,90 / mês (1 empresa)
 * Pro: R$ 97,00 / mês (até 3 empresas)
 */
export const BILLING_PLANS: Record<BillingPlanId, BillingPlanConfig> = {
  starter: {
    id: "starter",
    name: "Plano Starter",
    price: 49.9,
    priceCents: 4990,
    companyQuota: 1,
    cycle: "MONTHLY",
    description: "SocialPack Starter - 1 Empresa, 7 posts semanais",
  },
  pro: {
    id: "pro",
    name: "Plano Pro",
    price: 97.0,
    priceCents: 9700,
    companyQuota: 3,
    cycle: "MONTHLY",
    description: "SocialPack Pro - Até 3 Empresas, 7 posts semanais por empresa",
  },
} as const;

/** Tolerância pós-vencimento em dias para aguardar compensação bancária (boleto/compensação) */
export const GRACE_PERIOD_DAYS = 3;

export function isValidPlanId(value: unknown): value is BillingPlanId {
  return value === "starter" || value === "pro";
}

export function getPlanServerConfig(plan: BillingPlanId): BillingPlanConfig {
  const config = BILLING_PLANS[plan];
  if (!config) {
    throw new Error(`Plano desconhecido: ${String(plan)}`);
  }
  return config;
}

/**
 * Valida se o valor recebido pelo gateway é suficiente para ativar o plano pretendido.
 * Para Pro: o valor deve ser exatamente ou maior que R$ 97,00.
 * Para Starter: o valor deve ser suficiente para R$ 49,90.
 */
export function validatePaymentAmountForPlan(
  plan: BillingPlanId,
  paidAmount: number
): boolean {
  const config = getPlanServerConfig(plan);
  // Aceita com pequena tolerância de arredondamento de centavos caso haja desconto/centavos
  return paidAmount >= config.price - 0.05;
}
