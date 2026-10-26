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
 * Adiciona uma quantidade de dias úteis a uma data UTC, pulando sábados e domingos.
 * Representa a tolerância de compensação bancária pós-ciclo (fins de semana bancários),
 * mantendo cálculo previsível e independente de calendários externos de feriados.
 */
export function addBusinessDays(startDate: Date, businessDays: number): Date {
  const result = new Date(startDate.getTime());
  let added = 0;
  while (added < businessDays) {
    result.setUTCDate(result.getUTCDate() + 1);
    const dayOfWeek = result.getUTCDay();
    // 0 = Domingo, 6 = Sábado
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }
  return result;
}

/**
 * Calcula a data de término do ciclo de acesso.
 * O ciclo contratado cobre 1 mês civil a partir do vencimento da cobrança (dueDate),
 * ajustando para o último dia do mês quando o dia de origem não existir no mês de destino
 * (ex: 31 de janeiro -> 28/29 de fevereiro; 31 de agosto -> 30 de setembro).
 * Acrescenta 3 dias úteis de tolerância bancária (grace period) após o término do ciclo.
 */
export function calculatePeriodEnd(
  dueDateStr: string | null | undefined,
  baseDate: Date = new Date()
): Date {
  let baseYear: number;
  let baseMonth: number; // 1-12
  let baseDay: number;

  if (dueDateStr && /^\d{4}-\d{2}-\d{2}/.test(dueDateStr)) {
    const [y, m, d] = dueDateStr.split("-").map(Number);
    baseYear = y;
    baseMonth = m;
    baseDay = d;
  } else {
    baseYear = baseDate.getUTCFullYear();
    baseMonth = baseDate.getUTCMonth() + 1;
    baseDay = baseDate.getUTCDate();
  }

  // Avança exatamente 1 mês civil em UTC
  const targetYear = baseMonth === 12 ? baseYear + 1 : baseYear;
  const targetMonth = baseMonth === 12 ? 1 : baseMonth + 1; // 1-12

  // Último dia do mês de destino em UTC (dia 0 do mês seguinte)
  const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  const targetDay = Math.min(baseDay, daysInTargetMonth);

  const cycleEnd = new Date(Date.UTC(targetYear, targetMonth - 1, targetDay, 23, 59, 59, 999));

  return addBusinessDays(cycleEnd, GRACE_PERIOD_DAYS);
}

/**
 * Valida se o valor recebido pelo gateway é suficiente para ativar o plano pretendido.
 * A validação é estritamente baseada em centavos inteiros (priceCents).
 * Para Pro: exige pelo menos 9700 centavos (R$ 97,00). Valores menores (inclusive R$ 96,95) são rejeitados.
 * Para Starter: exige pelo menos 4990 centavos (R$ 49,90). Valores menores são rejeitados.
 * Não há tolerância implícita nem fallback automático entre planos.
 */
export function validatePaymentAmountForPlan(
  plan: BillingPlanId,
  paidAmount: number
): boolean {
  if (typeof paidAmount !== "number" || isNaN(paidAmount) || paidAmount <= 0) {
    return false;
  }
  const config = getPlanServerConfig(plan);
  const paidCents = Math.round(paidAmount * 100);
  return paidCents >= config.priceCents;
}


