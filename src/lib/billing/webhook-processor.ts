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
  // Tarefas 1, 2 e 3: A aquisição do lock de concorrência DEVE ser estritamente atômica via RPC PostgreSQL.
  // Nenhum fallback não atômico em JavaScript é permitido. Se a RPC não estiver disponível
  // ou falhar, o webhook falha de forma segura para impedir processamento duplicado ou desprotegido.
  if (!admin || typeof admin.rpc !== "function") {
    throw new Error(
      "Falha na proteção de concorrência: cliente de banco de dados não suporta a RPC 'acquire_billing_webhook_event'."
    );
  }

  const { data: rpcResult, error: rpcError } = await admin.rpc(
    "acquire_billing_webhook_event",
    {
      p_event_id: eventId,
      p_event_type: eventType,
      p_payload: payload,
      p_timeout_seconds: timeoutSeconds,
    }
  );

  if (rpcError) {
    throw new Error(
      `Falha na RPC de concorrência acquire_billing_webhook_event: ${rpcError.message}`
    );
  }

  if (
    rpcResult !== "acquired" &&
    rpcResult !== "already_processed" &&
    rpcResult !== "in_progress"
  ) {
    throw new Error(
      `Retorno inesperado da RPC acquire_billing_webhook_event: ${String(rpcResult)}`
    );
  }

  return rpcResult;
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
    const { data: processedRows, error: processedErr } = await admin
      .from("billing_webhook_events")
      .update({
        status: "processed",
        processed_at: getNow().toISOString(),
        error_message: null,
      })
      .eq("id", payload.id)
      .select("id");

    if (processedErr || !processedRows || processedRows.length === 0) {
      throw new Error(`Falha ao persistir status processed do evento: ${processedErr?.message || "Nenhum registro atualizado"}`);
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
  // DIFERENCIAÇÃO EXPLÍCITA DE ASSINATURAS (Tarefas 2 e 3):
  // 1. Assinatura atual (gateway_subscription_id)
  // 2. Assinatura anterior já substituída (previous_gateway_subscription_id diferente da atual)
  // 3. Assinatura nova ainda pendente de confirmação (pending_plan / pending_checkout_id / link)
  // ============================================================================
  const paymentSubId = realPayment.subscription || null;
  const currentSubId = userSub.gateway_subscription_id || null;
  const previousSubId = userSub.previous_gateway_subscription_id || null;

  // 1. Assinatura atual: coincide com gateway_subscription_id
  // REGRA INVIOLÁVEL: Nunca trate a assinatura como antiga quando seu identificador for igual a gateway_subscription_id!
  const isCurrentSubPayment = Boolean(
    paymentSubId &&
    currentSubId &&
    paymentSubId === currentSubId
  );

  // 2. Assinatura anterior já substituída:
  // Deve coincidir com previous_gateway_subscription_id E ser ESTRITAMENTE DIFERENTE de gateway_subscription_id
  const isPreviousSubPayment = Boolean(
    paymentSubId &&
    previousSubId &&
    paymentSubId === previousSubId &&
    !isCurrentSubPayment
  );

  // 3. Assinatura nova ainda pendente de confirmação (upgrade pendente):
  // Ocorre quando o usuário tem pending_plan === "pro", o pagamento correlaciona-se estritamente
  // com o checkout ou link de pagamento pendente e NÃO é um pagamento da assinatura atual
  const isPendingUpgradeConfirmation = Boolean(
    userSub.pending_plan === "pro" &&
    !isCurrentSubPayment &&
    (
      (checkoutId && userSub.pending_checkout_id ? checkoutId === userSub.pending_checkout_id : false) ||
      (realPayment.paymentLink && userSub.payment_link_id ? realPayment.paymentLink === userSub.payment_link_id : false) ||
      (!userSub.pending_checkout_id && !userSub.payment_link_id && fallbackPlan === "pro")
    )
  );

  // ============================================================================
  // PRIORIDADE P0: PAGAMENTO DE ASSINATURA ANTERIOR JÁ SUBSTITUÍDA EM TRANSIÇÃO
  // ============================================================================
  if (isPreviousSubPayment) {
    console.log(
      `[Webhook Asaas] Pagamento ${paymentId} pertence à assinatura anterior substituída (${realPayment.subscription}). Registrando no histórico sem alterar plano atual.`
    );

    // 1. Registra no histórico financeiro vinculado ao usuário com plano Starter e ID da assinatura antiga
    await recordBillingPayment(admin, userSub.user_id, realPayment, "starter");

    // 2. Cancela assinatura anterior no Asaas se ainda houver previousSubId
    if (previousSubId) {
      try {
        await cancelSub(previousSubId);
        console.log(`[Webhook Asaas] Assinatura anterior ${previousSubId} cancelada com sucesso.`);
      } catch (cancelErr) {
        // Tarefa 6: Se o cancelamento da assinatura antiga falhar, preserve os identificadores necessários
        // e NÃO marque silenciosamente o evento como concluído. Garante estratégia de retentativa/recuperação.
        const msg = cancelErr instanceof Error ? cancelErr.message : String(cancelErr);
        throw new Error(
          `Falha ao cancelar assinatura anterior ${previousSubId} no Asaas durante recebimento de pagamento tardio: ${msg}`
        );
      }

      // Limpa previous_gateway_subscription_id apenas após confirmação do cancelamento remoto
      const { data: clearedRows, error: clearErr } = await admin
        .from("subscriptions")
        .update({
          previous_gateway_subscription_id: null,
          updated_at: getNow().toISOString(),
        })
        .eq("user_id", userSub.user_id)
        .select("id");

      if (clearErr || !clearedRows || clearedRows.length === 0) {
        throw new Error(`Falha ao limpar previous_gateway_subscription_id no banco: ${clearErr?.message || "Nenhum registro atualizado"}`);
      }
    }

    // 3. RETORNA sem nunca alterar plano atual, cota, pending_plan ou gateway_subscription_id
    return;
  }

  // ============================================================================
  // ETAPA 2 — VALIDAÇÃO DA CORRELAÇÃO ENTRE CHECKOUT, PAGAMENTO E PLANO
  // ============================================================================

  // Tarefa 9: Proteção contra rebaixamento involuntário de Pro para Starter
  // Conta Pro (ativa, past_due ou incomplete) NUNCA pode ser rebaixada para Starter por pagamento de checkout antigo ou avulso
  if (userSub.plan === "pro" && !isCurrentSubPayment && !isPendingUpgradeConfirmation) {
    const isStarterPayment =
      fallbackPlan === "starter" ||
      (!paymentSubId && realPayment.value === 49.9) ||
      (paymentSubId && paymentSubId !== currentSubId);

    if (isStarterPayment) {
      console.warn(
        `[Webhook Asaas] Pagamento ${paymentId} do plano Starter recebido para conta Pro (${userSub.status}). Rebaixamento automático rejeitado.`
      );
      await recordBillingPayment(admin, userSub.user_id, realPayment, "starter");
      if (paymentSubId && paymentSubId !== currentSubId && paymentSubId !== previousSubId) {
        try {
          await cancelSub(paymentSubId);
        } catch (cancelErr) {
          const msg = cancelErr instanceof Error ? cancelErr.message : String(cancelErr);
          throw new Error(`Falha ao cancelar assinatura legada ${paymentSubId} no Asaas: ${msg}`);
        }
      }
      return;
    }
  }

  // Tarefas 4 e 5: Proteção universal contra links de pagamento obsoletos
  // Impede que pagamentos de links antigos ativem assinaturas em QUALQUER estado (active, incomplete, past_due)
  if (
    !isCurrentSubPayment &&
    userSub.payment_link_id &&
    realPayment.paymentLink &&
    userSub.payment_link_id !== realPayment.paymentLink
  ) {
    console.warn(
      `[Webhook Asaas] Pagamento ${paymentId} pertence a link obsoleto (${realPayment.paymentLink} vs ${userSub.payment_link_id}). Nenhuma assinatura ativada ou alterada.`
    );
    await recordBillingPayment(admin, userSub.user_id, realPayment, fallbackPlan || userSub.plan);
    return;
  }

  // Tarefas 2, 4 e 5: Proteção universal contra checkouts divergentes ou substituídos
  // Se houver pending_checkout_id, um pagamento com checkoutId diferente NÃO pode ativar a conta (mesmo se incomplete ou past_due)
  if (
    !isCurrentSubPayment &&
    userSub.pending_checkout_id &&
    checkoutId &&
    userSub.pending_checkout_id !== checkoutId
  ) {
    console.warn(
      `[Webhook Asaas] Pagamento ${paymentId} com checkoutId ${checkoutId} divergente do pendente ${userSub.pending_checkout_id}. Nenhuma assinatura ativada ou alterada.`
    );
    await recordBillingPayment(admin, userSub.user_id, realPayment, fallbackPlan || userSub.plan);
    return;
  }

  // Tarefa 5: Proteção contra divergência entre plano do pagamento e plano pendente da assinatura
  // Um checkout com plano diferente do plano pendente não pode alterar o registro
  if (!isCurrentSubPayment && userSub.pending_plan && fallbackPlan && fallbackPlan !== userSub.pending_plan) {
    console.warn(
      `[Webhook Asaas] Pagamento ${paymentId} para plano ${fallbackPlan} diverge do plano pendente ${userSub.pending_plan}. Nenhuma assinatura ativada.`
    );
    await recordBillingPayment(admin, userSub.user_id, realPayment, fallbackPlan);
    return;
  }

  // Tarefas 1, 2 e 6: Validação de dados suficientes para correlação segura
  // Se NÃO for recorrência da assinatura atual, deve haver comprovação confiável da intenção de checkout:
  // 1. Ou checkoutId coincidente com userSub.pending_checkout_id
  // 2. Ou paymentLink coincidente com userSub.payment_link_id
  // 3. Ou, na ausência de checkout pendente, checkoutId explícito com plano informado
  const hasCorrelationAnchor =
    isCurrentSubPayment ||
    (userSub.pending_checkout_id && checkoutId && checkoutId === userSub.pending_checkout_id) ||
    (userSub.payment_link_id && realPayment.paymentLink && realPayment.paymentLink === userSub.payment_link_id) ||
    (!userSub.pending_checkout_id && !userSub.payment_link_id && checkoutId && fallbackPlan);

  if (!isCurrentSubPayment && !hasCorrelationAnchor) {
    console.warn(
      `[Webhook Asaas] Pagamento ${paymentId} sem dados suficientes para correlação segura (checkoutId: ${checkoutId}, pendingCheckout: ${userSub.pending_checkout_id}, paymentLink: ${realPayment.paymentLink}, subLink: ${userSub.payment_link_id}). Nenhuma assinatura ativada ou alterada.`
    );
    await recordBillingPayment(admin, userSub.user_id, realPayment, fallbackPlan || userSub.plan);
    return;
  }

  // Determina o plano pretendido no servidor de forma estrita e segura
  let intendedPlan: BillingPlanId;
  if (isCurrentSubPayment) {
    // Pagamento da assinatura atual: renova o plano atual (Starter ou Pro)
    intendedPlan = userSub.plan;
  } else if (isPendingUpgradeConfirmation) {
    // Pagamento correlacionado ao checkout do upgrade para Pro
    intendedPlan = "pro";
  } else if (userSub.pending_plan) {
    intendedPlan = userSub.pending_plan;
  } else if (fallbackPlan) {
    intendedPlan = fallbackPlan;
  } else {
    intendedPlan = userSub.plan;
  }

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

    // Identifica se estamos renovando a assinatura atual ativa
    const isRenewingCurrentSub = isCurrentSubPayment && userSub.status === "active";

    // ==========================================================================
    // CANCELAMENTO SEGURO DA ASSINATURA ANTERIOR APÓS CONFIRMAÇÃO DO UPGRADE
    // Tarefa 4: Não cancele a assinatura Starter atual enquanto o upgrade para Pro
    // ainda não tiver sido confirmado por um pagamento válido e correlacionado.
    // ==========================================================================
    const oldSubToCancel =
      !isRenewingCurrentSub && intendedPlan === "pro"
        ? (userSub.previous_gateway_subscription_id &&
           userSub.previous_gateway_subscription_id !== realPayment.subscription
            ? userSub.previous_gateway_subscription_id
            : userSub.gateway_subscription_id &&
              userSub.gateway_subscription_id !== realPayment.subscription
            ? userSub.gateway_subscription_id
            : null)
        : null;

    if (oldSubToCancel) {
      // Tenta cancelar assinatura anterior no Asaas.
      // Tarefa 6: Se falhar, lança erro para NÃO limpar previous_gateway_subscription_id e reenfileirar no Asaas
      try {
        await cancelSub(oldSubToCancel);
        console.log(`[Webhook Asaas] Assinatura anterior ${oldSubToCancel} confirmada como cancelada no Asaas.`);
      } catch (cancelErr) {
        const msg = cancelErr instanceof Error ? cancelErr.message : String(cancelErr);
        throw new Error(
          `Falha ao cancelar assinatura anterior ${oldSubToCancel} no Asaas durante upgrade: ${msg}`
        );
      }
    }

    // Monta payload de persistência da assinatura
    const updatePayload: Record<string, unknown> = {
      plan: intendedPlan,
      status: "active",
      company_quota: quota,
      gateway_subscription_id: realPayment.subscription || userSub.gateway_subscription_id,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
      updated_at: now.toISOString(),
    };

    if (isRenewingCurrentSub) {
      // Tarefa 4: Renovação da assinatura atual — preserva pendência de upgrade não confirmada
      updatePayload.pending_plan = userSub.pending_plan || null;
      updatePayload.pending_checkout_id = userSub.pending_checkout_id || null;
      updatePayload.payment_link_id = userSub.payment_link_id || null;
      updatePayload.payment_url = userSub.payment_url || null;
      updatePayload.previous_gateway_subscription_id = userSub.previous_gateway_subscription_id || null;
    } else {
      // Confirmação de novo plano / ativação / upgrade: limpa checkout pendente e previous sub
      updatePayload.pending_plan = null;
      updatePayload.pending_checkout_id = null;
      updatePayload.previous_gateway_subscription_id = null;
    }

    // Tarefa 7: Atualização crítica com validação estrita de registros afetados
    const { data: updatedSubRows, error: updateSubErr } = await admin
      .from("subscriptions")
      .update(updatePayload)
      .eq("user_id", userSub.user_id)
      .select("id");

    if (updateSubErr || !updatedSubRows || updatedSubRows.length === 0) {
      throw new Error(`Falha ao persistir assinatura no banco: ${updateSubErr?.message || "Nenhum registro atualizado"}`);
    }
  } else if (
    event === "PAYMENT_REFUNDED" ||
    event === "PAYMENT_CHARGEBACK_REQUESTED" ||
    realPayment.status === "REFUNDED" ||
    realPayment.status === "CHARGEBACK_REQUESTED"
  ) {
    const { data: pastDueRows, error: pastDueErr } = await admin
      .from("subscriptions")
      .update({
        status: "past_due",
        updated_at: getNow().toISOString(),
      })
      .eq("user_id", userSub.user_id)
      .select("id");

    if (pastDueErr || !pastDueRows || pastDueRows.length === 0) {
      throw new Error(`Falha ao atualizar status para past_due: ${pastDueErr?.message || "Nenhum registro atualizado"}`);
    }
  } else if (event === "PAYMENT_OVERDUE" || realPayment.status === "OVERDUE") {
    const currentEnd = userSub.current_period_end
      ? new Date(userSub.current_period_end)
      : new Date(0);

    if (currentEnd.getTime() <= getNow().getTime()) {
      const { data: overdueRows, error: overdueErr } = await admin
        .from("subscriptions")
        .update({
          status: "past_due",
          updated_at: getNow().toISOString(),
        })
        .eq("user_id", userSub.user_id)
        .select("id");

      if (overdueErr || !overdueRows || overdueRows.length === 0) {
        throw new Error(`Falha ao atualizar status overdue: ${overdueErr?.message || "Nenhum registro atualizado"}`);
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
    const { data: subRows, error: subErr } = await admin
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("gateway_subscription_id", subscriptionId)
      .select("id");

    if (subErr || !subRows || subRows.length === 0) {
      throw new Error(`Falha ao marcar cancelamento de assinatura no banco: ${subErr?.message || "Assinatura não encontrada para cancelamento"}`);
    }
  }
}
