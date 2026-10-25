import "server-only";
import crypto from "node:crypto";
import { getAsaasConfig } from "@/lib/env";
import { BILLING_PLANS, type BillingPlanId, getPlanServerConfig } from "./plans";

export interface AsaasPaymentLinkResponse {
  id: string;
  name: string;
  value: number;
  active: boolean;
  chargeType: string;
  url: string;
  billingType: string;
  subscriptionCycle?: string;
  externalReference?: string;
  deleted?: boolean;
}

export interface AsaasPaymentResponse {
  id: string;
  customer: string;
  subscription?: string | null;
  paymentLink?: string | null;
  dueDate: string;
  value: number;
  netValue?: number;
  originalValue?: number | null;
  status:
    | "PENDING"
    | "RECEIVED"
    | "CONFIRMED"
    | "OVERDUE"
    | "REFUNDED"
    | "RECEIVED_IN_CASH"
    | "REFUND_REQUESTED"
    | "REFUND_IN_PROGRESS"
    | "CHARGEBACK_REQUESTED"
    | "CHARGEBACK_DISPUTE"
    | "AWAITING_CHARGEBACK_REVERSAL"
    | "DUNNING_REQUESTED"
    | "DUNNING_RECEIVED"
    | "AWAITING_RISK_ANALYSIS"
    | string;
  billingType: string;
  invoiceUrl: string;
  bankSlipUrl?: string | null;
  transactionReceiptUrl?: string | null;
  deleted?: boolean;
  externalReference?: string | null;
  paymentDate?: string | null;
  clientPaymentDate?: string | null;
  confirmedDate?: string | null;
}

export interface AsaasSubscriptionResponse {
  id: string;
  customer: string;
  value: number;
  nextDueDate: string;
  cycle: string;
  description?: string;
  billingType: string;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED" | string;
  deleted?: boolean;
  externalReference?: string | null;
}

/**
 * Cliente HTTP autenticado para a API v3 do Asaas.
 */
async function asaasFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  const { apiKey, baseUrl } = getAsaasConfig();
  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    accept: "application/json",
    "Content-Type": "application/json",
    access_token: apiKey,
    "User-Agent": "SocialPack/1.0 (Automated Billing)",
    ...(options.headers as Record<string, string>),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      cache: "no-store",
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg =
        json?.errors?.[0]?.description ||
        json?.message ||
        `Erro ${res.status} ao comunicar com Asaas.`;
      return { ok: false, error: errorMsg, status: res.status };
    }

    return { ok: true, data: json as T };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Falha de rede com Asaas: ${msg}`, status: 500 };
  }
}

/**
 * Cria um link de pagamento recorrente (assinatura) hospedado pelo Asaas.
 *
 * Segurança essencial:
 * 1. O valor é lido do servidor (nunca do formulário).
 * 2. `billingType = "UNDEFINED"` permite que o cliente escolha Pix, Boleto ou Cartão.
 * 3. `chargeType = "RECURRENT"` e `subscriptionCycle = "MONTHLY"` configuram a assinatura.
 * 4. O Asaas colhe os dados cadastrais (CPF/CNPJ, Nome, Telefone) de forma 100% segura
 *    e em conformidade com PCI/LGPD, sem que o SocialPack precise pedir ou armazenar CPF.
 */
export async function createPaymentLinkForPlan(params: {
  userId: string;
  plan: BillingPlanId;
  userEmail?: string;
}): Promise<AsaasPaymentLinkResponse> {
  const planConfig = getPlanServerConfig(params.plan);

  const payload = {
    name: planConfig.name,
    description: planConfig.description,
    value: planConfig.price,
    billingType: "UNDEFINED",
    chargeType: "RECURRENT",
    subscriptionCycle: "MONTHLY",
    externalReference: `${params.userId}:${params.plan}`,
    notificationEnabled: true,
  };

  const res = await asaasFetch<AsaasPaymentLinkResponse>("/paymentLinks", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Não foi possível criar o link de pagamento: ${res.error}`);
  }

  return res.data;
}

/**
 * Consulta um pagamento no Asaas diretamente por ID.
 * Usado pelo webhook para re-validar os dados na fonte oficial antes de qualquer liberação.
 */
export async function getAsaasPayment(paymentId: string): Promise<AsaasPaymentResponse> {
  const res = await asaasFetch<AsaasPaymentResponse>(`/payments/${paymentId}`, {
    method: "GET",
  });

  if (!res.ok) {
    throw new Error(`Falha ao consultar pagamento ${paymentId} no Asaas: ${res.error}`);
  }

  return res.data;
}

/**
 * Consulta uma assinatura no Asaas diretamente por ID.
 */
export async function getAsaasSubscription(
  subscriptionId: string
): Promise<AsaasSubscriptionResponse> {
  const res = await asaasFetch<AsaasSubscriptionResponse>(
    `/subscriptions/${subscriptionId}`,
    {
      method: "GET",
    }
  );

  if (!res.ok) {
    throw new Error(`Falha ao consultar assinatura ${subscriptionId} no Asaas: ${res.error}`);
  }

  return res.data;
}

/**
 * Cancela uma assinatura recorrente no Asaas.
 */
export async function cancelAsaasSubscription(subscriptionId: string): Promise<void> {
  const res = await asaasFetch<{ id: string; deleted: boolean }>(
    `/subscriptions/${subscriptionId}`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {
    // Se já estiver deletada (404), trata como sucesso idempotente
    if (res.status === 404) return;
    throw new Error(`Falha ao cancelar assinatura ${subscriptionId} no Asaas: ${res.error}`);
  }
}

/**
 * Remove ou invalida um link de pagamento no Asaas.
 * Utilizado para invalidar links pendentes anteriores quando o cliente gera um novo link.
 */
export async function deleteAsaasPaymentLink(paymentLinkId: string): Promise<void> {
  const res = await asaasFetch<{ id: string; deleted: boolean }>(
    `/paymentLinks/${paymentLinkId}`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {
    // Se já foi deletado (404), sucesso idempotente
    if (res.status === 404) return;
    console.warn(`[Asaas] Não foi possível remover link de pagamento ${paymentLinkId}: ${res.error}`);
  }
}


/**
 * Validação de segurança do token de webhook com timingSafeEqual para mitigar timing attacks.
 */
export function verifyAsaasWebhookToken(receivedToken: string | null | undefined): boolean {
  const { webhookToken } = getAsaasConfig();
  if (!webhookToken) {
    // Se o webhookToken não estiver configurado no ambiente, recusa por segurança
    return false;
  }

  if (!receivedToken) {
    return false;
  }

  try {
    const receivedBuf = Buffer.from(receivedToken);
    const expectedBuf = Buffer.from(webhookToken);

    if (receivedBuf.length !== expectedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(receivedBuf, expectedBuf);
  } catch {
    return false;
  }
}
