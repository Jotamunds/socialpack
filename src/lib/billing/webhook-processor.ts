import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAsaasPayment,
  cancelAsaasSubscription,
  type AsaasPaymentResponse,
} from "@/lib/billing/asaas";
import {
  BILLING_PLANS,
  calculatePeriodEnd,
  validatePaymentAmountForPlan,
  type BillingPlanId,
} from "@/lib/billing/plans";

export interface AsaasWebhookPayload {
  id?: string;
  event?: string;
  dateCreated?: string;
  payment?: {
    id: string;
    customer?: string;
    subscription?: string;
    paymentLink?: string;
    value?: number;
    netValue?: number;
    status?: string;
    billingType?: string;
    dueDate?: string;
    invoiceUrl?: string;
    externalReference?: string;
  };
  subscription?: {
    id: string;
    customer?: string;
    status?: string;
  };
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  plan: BillingPlanId;
  status: string;
  company_quota: number;
  pending_plan?: BillingPlanId | null;
  pending_checkout_id?: string | null;
  payment_link_id?: string | null;
  payment_url?: string | null;
  gateway_subscription_id?: string | null;
  previous_gateway_subscription_id?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean | null;
  created_at?: string;
  updated_at?: string;
}

export type SupabaseAdminClient = ReturnType<typeof createAdminClient>;

export interface WebhookProcessorDependencies {
  admin?: SupabaseAdminClient;
  getAsaasPayment?: (paymentId: string) => Promise<AsaasPaymentResponse>;
  cancelAsaasSubscription?: (subscriptionId: string) => Promise<void>;
  now?: () => Date;
}

export interface WebhookProcessResult {
  statusCode: number;
  body: Record<string, unknown>;
}

/**
 * Adquire o bloqueio de processamento atômico para o evento de webhook.
 * Retorna:
 * - 'already_processed': evento já foi concluído anteriormente
 * - 'in_progress': outra requisição ativa está processando no momento
 * - 'acquired': a requisição atual obteve a posse do processamento
 */
async function acquireWebhookLock(
  admin: SupabaseAdminClient,
  eventId: string,
  eventType: string,
  payload: AsaasWebhookPayload,
  timeoutSeconds: number = 60
): Promise<"already_processed" | "in_progress" | "acquired"> {
  // 1. Tenta usar a RPC transacional se disponível
  try {
    if (typeof admin.rpc === "function") {
      const { data: rpcResult, error: rpcError } = await admin.rpc(
        "acquire_billing_webhook_event",
        {
          p_event_id: eventId,
          p_event_type: eventType,
          p_payload: payload,
          p_timeout_seconds: timeoutSeconds,
        }
      );

      if (!rpcError && rpcResult) {
        return rpcResult as "already_processed" | "in_progress" | "acquired";
      }
    }
  } catch {
    // Fallback para query direta se RPC não estiver instalada
  }

  // 2. Fallback idempotente direto no banco
  const { data: existing, error: selectErr } = await admin
    .from("billing_webhook_events")
    .select("id, status, last_attempt_at, created_at, attempts")
    .eq("id", eventId)
    .maybeSingle();

  if (selectErr) {
    throw new Error(`Erro ao consultar evento de webhook: ${selectErr.message}`);
  }

  const now = new Date();

  if (existing) {
    if (existing.status === "processed") {
      return "already_processed";
    }

    if (existing.status === "processing") {
      const lastTime = new Date(existing.last_attempt_at || existing.created_at).getTime();
      const ageSec = (now.getTime() - lastTime) / 1000;
      if (ageSec < timeoutSeconds) {
        return "in_progress";
      }
    }

    // Evento failed ou processing abandonado além do timeout: reabre tentativa
    const { error: updateErr } = await admin
      .from("billing_webhook_events")
      .update({
        status: "processing",
        attempts: (existing.attempts || 1) + 1,
        last_attempt_at: now.toISOString(),
        payload,
        error_message: null,
      })
      .eq("id", eventId);

    if (updateErr) {
      throw new Error(`Falha ao reabrir evento de webhook: ${updateErr.message}`);
    }

    return "acquired";
  }

  // Inserção de novo evento
  const { error: insertErr } = await admin.from("billing_webhook_events").insert({
    id: eventId,
    event: eventType,
    status: "processing",
    payload,
    attempts: 1,
    last_attempt_at: now.toISOString(),
  });

  if (insertErr) {
    if (
      insertErr.code === "23505" ||
      insertErr.message?.toLowerCase().includes("duplicate") ||
      insertErr.message?.toLowerCase().includes("unique")
    ) {
      return "in_progress";
    }
    throw new Error(`Falha ao registrar novo evento de webhook: ${insertErr.message}`);
  }

  return "acquired";
}

/**
 * Processador central e determinístico de webhooks Asaas.
 * Utilizado diretamente pela rota /api/webhooks/asaas e pela suíte de testes funcionais.
 */
export async function processAsaasWebhookEvent(
  payload: AsaasWebhookPayload,
  dependencies: WebhookProcessorDependencies = {}
): Promise<WebhookProcessResult> {
  const admin = dependencies.admin || createAdminClient();
  const getPayment = dependencies.getAsaasPayment || getAsaasPayment;
  const cancelSub = dependencies.cancelAsaasSubscription || cancelAsaasSubscription;
  const getNow = dependencies.now || (() => new Date());

  if (!payload.id || !payload.event) {
    return {
      statusCode: 200,
      body: { received: true, ignored: true, reason: "ID ou evento ausente" },
    };
  }

  // 1. Aquisição Atômica de Idempotência
  let lockStatus: "already_processed" | "in_progress" | "acquired";
  try {
    lockStatus = await acquireWebhookLock(admin, payload.id, payload.event, payload);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Webhook Asaas] Falha na aquisição de lock para evento ${payload.id}:`, errorMsg);
    return {
      statusCode: 500,
      body: { error: "Erro interno ao validar idempotência do evento.", detail: errorMsg },
    };
  }

  if (lockStatus === "already_processed") {
    return {
      statusCode: 200,
      body: { received: true, duplicate: true, status: "processed" },
    };
  }

  if (lockStatus === "in_progress") {
    return {
      statusCode: 409,
      body: {
        received: true,
        pending: true,
        status: "in_progress",
        error: "Evento em processamento ativo por outra requisição. Tente novamente.",
      },
    };
  }

  // 2. Execução da Lógica de Negócio
  try {
    if (payload.payment?.id) {
      await handlePaymentEvent({
        event: payload.event,
        paymentId: payload.payment.id,
        admin,
        getPayment,
        cancelSub,
        getNow,
      });
    } else if (payload.subscription?.id) {
      await handleSubscriptionEvent(payload.event, payload.subscription.id, admin);
    }

    // 3. Marcação confirmada como 'processed'
    const { error: processedErr } = await admin
      .from("billing_webhook_events")
      .update({
        status: "processed",
        processed_at: getNow().toISOString(),
        error_message: null,
      })
      .eq("id", payload.id);

    if (processedErr) {
      throw new Error(`Falha ao persistir status processed do evento: ${processedErr.message}`);
    }

    return {
      statusCode: 200,
      body: { received: true, processed: true },
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Webhook Asaas Error] Evento ${payload.id} falhou:`, errorMsg);

    // Registra falha de processamento
    try {
      await admin
        .from("billing_webhook_events")
        .update({
          status: "failed",
          error_message: errorMsg,
        })
        .eq("id", payload.id);
    } catch (saveFailedErr) {
      console.error(`[Webhook Asaas] Não foi possível registrar status failed do evento ${payload.id}:`, saveFailedErr);
    }

    // Retorna HTTP 500 para instruir Asaas a reenfileirar em caso de falha transitória
    return {
      statusCode: 500,
      body: {
        received: true,
        error: "Falha no processamento do evento de cobrança. Solicitação para reenvio.",
        detail: errorMsg,
      },
    };
  }
}

/**
 * Trata o processamento de cobranças e atualizações financeiras.
 */
async function handlePaymentEvent(params: {
  event: string;
  paymentId: string;
  admin: SupabaseAdminClient;
  getPayment: (id: string) => Promise<AsaasPaymentResponse>;
  cancelSub: (id: string) => Promise<void>;
  getNow: () => Date;
}) {
  const { event, paymentId, admin, getPayment, cancelSub, getNow } = params;

  // Re-consulta autenticada e oficial no Asaas
  const realPayment = await getPayment(paymentId);

  // Parsing do externalReference
  let targetUserId: string | null = null;
  let fallbackPlan: BillingPlanId | null = null;
  let checkoutId: string | null = null;

  if (realPayment.externalReference) {
    const parts = realPayment.externalReference.split(":");
    targetUserId = parts[0] || null;
    if (parts[1] === "pro" || parts[1] === "starter") {
      fallbackPlan = parts[1];
    }
    checkoutId = parts[2] || null;
  }

  // Localização da assinatura local
  let userSub: SubscriptionRow | null = null;

  // Busca 1: por identificador de assinatura (corrente ou anterior)
  if (realPayment.subscription) {
    const { data: subByGateway, error: errByGateway } = await admin
      .from("subscriptions")
      .select("*")
      .or(
        `gateway_subscription_id.eq.${realPayment.subscription},previous_gateway_subscription_id.eq.${realPayment.subscription}`
      )
      .maybeSingle();

    if (errByGateway) {
      throw new Error(`Erro ao buscar assinatura por gateway_subscription_id: ${errByGateway.message}`);
    }
    userSub = subByGateway;
  }

  // Busca 2: por link de pagamento
  if (!userSub && realPayment.paymentLink) {
    const { data: subByLink, error: errByLink } = await admin
      .from("subscriptions")
      .select("*")
      .eq("payment_link_id", realPayment.paymentLink)
      .maybeSingle();

    if (errByLink) {
      throw new Error(`Erro ao buscar assinatura por link: ${errByLink.message}`);
    }
    userSub = subByLink;
  }

  // Busca 3: por user_id identificado no externalReference
  if (!userSub && targetUserId) {
    const { data: subByUser, error: errByUser } = await admin
      .from("subscriptions")
      .select("*")
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (errByUser) {
      throw new Error(`Erro ao buscar assinatura por user_id: ${errByUser.message}`);
    }
    userSub = subByUser;
  }

  // Rejeição de segurança se a assinatura não puder ser associada de forma inequívoca
  if (!userSub || !userSub.user_id) {
    throw new Error(
      `Nenhuma assinatura local encontrada para o pagamento ${paymentId}. Evento retido para reconciliação manual.`
    );
  }

  // Rejeição de segurança: pagamento emitido para um usuário nunca pode alterar a conta de outro
  if (targetUserId && targetUserId !== userSub.user_id) {
    throw new Error(
      `Inconsistência de segurança: pagamento do usuário ${targetUserId} tentou vincular-se à assinatura de ${userSub.user_id}.`
    );
  }

  // ============================================================================
  // PRIORIDADE P0: PAGAMENTO DE ASSINATURA ANTERIOR EM TRANSIÇÃO
  // ============================================================================
  const isPreviousSubPayment = Boolean(
    realPayment.subscription &&
    userSub.previous_gateway_subscription_id &&
    userSub.previous_gateway_subscription_id === realPayment.subscription
  );

  if (isPreviousSubPayment) {
    console.log(
      `[Webhook Asaas] Pagamento ${paymentId} pertence à assinatura anterior em transição (${realPayment.subscription}). Registrando no histórico sem alterar plano atual.`
    );

    // 1. Registra no histórico financeiro vinculado ao usuário com plano Starter e ID da assinatura antiga
    await recordBillingPayment(admin, userSub.user_id, realPayment, "starter");

    // 2. Se a assinatura anterior ainda precisa de cancelamento remoto no Asaas, tenta cancelá-la
    if (userSub.previous_gateway_subscription_id) {
      try {
        await cancelSub(userSub.previous_gateway_subscription_id);
        console.log(`[Webhook Asaas] Assinatura anterior ${userSub.previous_gateway_subscription_id} cancelada com sucesso.`);
      } catch (cancelErr) {
        console.warn(
          `[Webhook Asaas] Falha ao cancelar assinatura anterior ${userSub.previous_gateway_subscription_id} durante recebimento de pagamento tardio:`,
          cancelErr
        );
        // Preserva previous_gateway_subscription_id intacto para reconciliação posterior
      }
    }

    // 3. RETORNA sem nunca alterar plano atual, cota, pending_plan ou gateway_subscription_id
    return;
  }

  // Proteção contra links antigos obsoletos
  if (
    userSub.payment_link_id &&
    realPayment.paymentLink &&
    userSub.payment_link_id !== realPayment.paymentLink
  ) {
    console.warn(
      `[Webhook Asaas] Pagamento ${paymentId} pertence a link obsoleto (${realPayment.paymentLink} vs ${userSub.payment_link_id}).`
    );
    if (userSub.status === "active" && userSub.plan === "pro") {
      console.warn("[Webhook Asaas] Ignorando alteração de plano para preservar Pro contra link antigo.");
      await recordBillingPayment(admin, userSub.user_id, realPayment, userSub.plan);
      return;
    }
  }

  // Proteção contra tentativas de checkouts antigos substituídos
  if (
    userSub.pending_checkout_id &&
    checkoutId &&
    userSub.pending_checkout_id !== checkoutId
  ) {
    console.warn(
      `[Webhook Asaas] Pagamento ${paymentId} com checkoutId ${checkoutId} divergente do pendente ${userSub.pending_checkout_id}.`
    );
    if (userSub.status === "active") {
      await recordBillingPayment(admin, userSub.user_id, realPayment, userSub.plan);
      return;
    }
  }

  // Determina o plano pretendido no servidor
  const intendedPlan: BillingPlanId =
    userSub.pending_plan === "pro" || fallbackPlan === "pro" ? "pro" : "starter";

  // Validação estrita de valores em centavos inteiros (sem tolerância implícita nem fallback automático)
  const isAmountValid = validatePaymentAmountForPlan(intendedPlan, realPayment.value);
  if (!isAmountValid) {
    // Registra no histórico para auditoria, mas não ativa nem altera a assinatura
    await recordBillingPayment(admin, userSub.user_id, realPayment, intendedPlan);
    throw new Error(
      `Pagamento ${paymentId} de R$ ${realPayment.value} insuficiente para o plano ${intendedPlan}. Nenhuma assinatura ativada.`
    );
  }

  const isConfirmed =
    event === "PAYMENT_RECEIVED" ||
    event === "PAYMENT_CONFIRMED" ||
    realPayment.status === "RECEIVED" ||
    realPayment.status === "CONFIRMED";

  if (isConfirmed) {
    const quota = BILLING_PLANS[intendedPlan].companyQuota;
    const now = getNow();
    const periodEnd = calculatePeriodEnd(realPayment.dueDate, now);

    // ==========================================================================
    // PRIORIDADE P0: TRANSIÇÃO DE STARTER PARA PRO E CANCELAMENTO ANTERIOR
    // ==========================================================================
    const oldSubToCancel =
      intendedPlan === "pro"
        ? userSub.previous_gateway_subscription_id ||
          (userSub.gateway_subscription_id &&
          userSub.gateway_subscription_id !== realPayment.subscription
            ? userSub.gateway_subscription_id
            : null)
        : null;

    if (oldSubToCancel) {
      // Tenta cancelar assinatura anterior no Asaas.
      // Se falhar, lança erro para NÃO limpar previous_gateway_subscription_id e reenfileirar no Asaas
      await cancelSub(oldSubToCancel);
      console.log(`[Webhook Asaas] Assinatura anterior ${oldSubToCancel} confirmada como cancelada no Asaas.`);
    }

    // Atualização da assinatura local
    const { error: updateSubErr } = await admin
      .from("subscriptions")
      .update({
        plan: intendedPlan,
        status: "active",
        company_quota: quota,
        pending_plan: null,
        pending_checkout_id: null,
        gateway_subscription_id: realPayment.subscription || userSub.gateway_subscription_id,
        previous_gateway_subscription_id: null, // Limpa apenas após cancelamento remoto confirmado
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        updated_at: now.toISOString(),
      })
      .eq("user_id", userSub.user_id);

    if (updateSubErr) {
      throw new Error(`Falha ao persistir assinatura no banco: ${updateSubErr.message}`);
    }
  } else if (
    event === "PAYMENT_REFUNDED" ||
    event === "PAYMENT_CHARGEBACK_REQUESTED" ||
    realPayment.status === "REFUNDED" ||
    realPayment.status === "CHARGEBACK_REQUESTED"
  ) {
    const { error: pastDueErr } = await admin
      .from("subscriptions")
      .update({
        status: "past_due",
        updated_at: getNow().toISOString(),
      })
      .eq("user_id", userSub.user_id);

    if (pastDueErr) {
      throw new Error(`Falha ao atualizar status para past_due: ${pastDueErr.message}`);
    }
  } else if (event === "PAYMENT_OVERDUE" || realPayment.status === "OVERDUE") {
    const currentEnd = userSub.current_period_end
      ? new Date(userSub.current_period_end)
      : new Date(0);

    if (currentEnd.getTime() <= getNow().getTime()) {
      const { error: overdueErr } = await admin
        .from("subscriptions")
        .update({
          status: "past_due",
          updated_at: getNow().toISOString(),
        })
        .eq("user_id", userSub.user_id);

      if (overdueErr) {
        throw new Error(`Falha ao atualizar status overdue: ${overdueErr.message}`);
      }
    }
  }

  // Registra no histórico financeiro seguro com checagem estrita de erro
  await recordBillingPayment(admin, userSub.user_id, realPayment, intendedPlan);
}

/**
 * Registra o pagamento na tabela billing_payments e verifica retorno de erro.
 */
export async function recordBillingPayment(
  admin: SupabaseAdminClient,
  userId: string,
  realPayment: AsaasPaymentResponse,
  plan: BillingPlanId
): Promise<void> {
  const { error: upsertErr } = await admin.from("billing_payments").upsert(
    {
      user_id: userId,
      asaas_payment_id: realPayment.id,
      asaas_subscription_id: realPayment.subscription || null,
      asaas_payment_link_id: realPayment.paymentLink || null,
      plan,
      status: realPayment.status,
      value: realPayment.value,
      net_value: realPayment.netValue || null,
      billing_type: realPayment.billingType,
      invoice_url: realPayment.invoiceUrl,
      due_date: realPayment.dueDate,
      payment_date: realPayment.clientPaymentDate || realPayment.confirmedDate || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "asaas_payment_id" }
  );

  if (upsertErr) {
    throw new Error(`Falha ao persistir pagamento em billing_payments: ${upsertErr.message}`);
  }
}

/**
 * Trata eventos de cancelamento de assinatura no gateway Asaas.
 */
async function handleSubscriptionEvent(
  event: string,
  subscriptionId: string,
  admin: SupabaseAdminClient
): Promise<void> {
  if (
    event === "SUBSCRIPTION_DELETED" ||
    event === "SUBSCRIPTION_INACTIVATED"
  ) {
    const { error: subErr } = await admin
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("gateway_subscription_id", subscriptionId);

    if (subErr) {
      throw new Error(`Falha ao marcar cancelamento de assinatura no banco: ${subErr.message}`);
    }
  }
}
