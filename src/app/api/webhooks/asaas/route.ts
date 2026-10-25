import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAsaasPayment,
  cancelAsaasSubscription,
  verifyAsaasWebhookToken,
  type AsaasPaymentResponse,
} from "@/lib/billing/asaas";
import {
  BILLING_PLANS,
  calculatePeriodEnd,
  validatePaymentAmountForPlan,
  type BillingPlanId,
} from "@/lib/billing/plans";

export const dynamic = "force-dynamic";

interface AsaasWebhookPayload {
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

export async function POST(request: Request) {
  // 1. Validação de segurança do token de webhook
  const receivedToken = request.headers.get("asaas-access-token");
  const isAuthorized = verifyAsaasWebhookToken(receivedToken);

  if (!isAuthorized) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let body: AsaasWebhookPayload;
  try {
    body = (await request.json()) as AsaasWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Payload JSON inválido" }, { status: 400 });
  }

  // Ping ou notificação sem identificador essencial
  if (!body.id || !body.event) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const admin = createAdminClient();

  // 2. Garantia de Idempotência Resiliente
  // Consulta se o evento já existe em billing_webhook_events
  const { data: existingEvent, error: selectErr } = await admin
    .from("billing_webhook_events")
    .select("id, status, created_at, attempts")
    .eq("id", body.id)
    .maybeSingle();

  if (selectErr) {
    console.error("[Asaas Webhook] Erro ao consultar idempotência:", selectErr);
    // Erro transitório de banco -> responde 500 para Asaas reenviar
    return NextResponse.json({ error: "Erro interno no banco de dados" }, { status: 500 });
  }

  if (existingEvent) {
    if (existingEvent.status === "processed") {
      // Evento já foi confirmado com sucesso anteriormente
      return NextResponse.json({ received: true, duplicate: true, status: "processed" });
    }

    if (existingEvent.status === "processing") {
      // Se está em processamento há menos de 60 segundos, evita colisão entre workers simultâneos
      const ageSeconds =
        (Date.now() - new Date(existingEvent.created_at).getTime()) / 1000;
      if (ageSeconds < 60) {
        return NextResponse.json({ received: true, pending: true, status: "in_progress" });
      }
    }

    // Se estava 'failed' ou 'processing' expirado, reabre como 'processing' e incrementa tentativas
    await admin
      .from("billing_webhook_events")
      .update({
        status: "processing",
        attempts: (existingEvent.attempts || 1) + 1,
        error_message: null,
        payload: body,
      })
      .eq("id", body.id);
  } else {
    // Insere novo evento com status 'processing'
    const { error: insertErr } = await admin.from("billing_webhook_events").insert({
      id: body.id,
      event: body.event,
      status: "processing",
      payload: body,
      attempts: 1,
    });

    if (insertErr) {
      if (insertErr.code === "23505" || insertErr.message?.toLowerCase().includes("duplicate")) {
        // Concorrência no mesmo instante
        return NextResponse.json({ received: true, duplicate: true });
      }
      console.error("[Asaas Webhook] Erro ao registrar evento de webhook:", insertErr);
      return NextResponse.json({ error: "Falha ao gravar evento de webhook" }, { status: 500 });
    }
  }

  try {
    // 3. Processamento de Eventos de Cobrança / Assinatura
    if (body.payment?.id) {
      await handlePaymentEvent(body.event, body.payment.id, admin);
    } else if (body.subscription?.id) {
      await handleSubscriptionEvent(body.event, body.subscription.id, admin);
    }

    // 4. Marca o evento como 'processed' com sucesso
    await admin
      .from("billing_webhook_events")
      .update({
        status: "processed",
        processed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", body.id);

    return NextResponse.json({ received: true, processed: true }, { status: 200 });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Asaas Webhook Error] Evento ${body.id} falhou:`, errorMsg);

    // Marca o evento como 'failed' com mensagem de erro
    await admin
      .from("billing_webhook_events")
      .update({
        status: "failed",
        error_message: errorMsg,
      })
      .eq("id", body.id);

    // Retorna HTTP 500 para instruir o Asaas a reenviar o evento em caso de falha transitória
    return NextResponse.json(
      {
        received: true,
        error: "Falha no processamento do evento de cobrança. Solicitação para reenvio.",
        detail: errorMsg,
      },
      { status: 500 }
    );
  }
}

/**
 * Trata eventos relacionados a cobranças.
 * Sempre re-consulta os dados direto na API oficial do Asaas para garantir integridade.
 */
async function handlePaymentEvent(
  event: string,
  paymentId: string,
  admin: ReturnType<typeof createAdminClient>
) {
  // Consulta a fonte oficial do Asaas
  // Em caso de falha (rede/timeout/502), lança erro para ser capturado e retornar 500
  const realPayment = await getAsaasPayment(paymentId);

  // Identifica o usuário e o plano pretendido
  let targetUserId: string | null = null;
  let fallbackPlan: BillingPlanId | null = null;

  if (realPayment.externalReference) {
    const parts = realPayment.externalReference.split(":");
    targetUserId = parts[0] || null;
    if (parts[1] === "pro" || parts[1] === "starter") {
      fallbackPlan = parts[1];
    }
  }

  // Busca a assinatura no banco com correspondência estrita
  let userSub: any = null;

  if (realPayment.paymentLink) {
    // Busca exata pelo link de pagamento
    const { data: subByLink, error: errByLink } = await admin
      .from("subscriptions")
      .select("*")
      .eq("payment_link_id", realPayment.paymentLink)
      .maybeSingle();

    if (errByLink) throw new Error(`Erro ao buscar assinatura por link: ${errByLink.message}`);
    userSub = subByLink;
  }

  if (!userSub && realPayment.subscription) {
    // Busca exata pelo identificador de assinatura ou assinatura anterior em transição
    const { data: subByGateway, error: errByGateway } = await admin
      .from("subscriptions")
      .select("*")
      .or(
        `gateway_subscription_id.eq.${realPayment.subscription},previous_gateway_subscription_id.eq.${realPayment.subscription}`
      )
      .maybeSingle();

    if (errByGateway)
      throw new Error(`Erro ao buscar assinatura por gateway_subscription_id: ${errByGateway.message}`);
    userSub = subByGateway;
  }

  if (!userSub && targetUserId) {
    // Se não encontrou por link nem por subscription id, tenta por targetUserId
    const { data: subByUser, error: errByUser } = await admin
      .from("subscriptions")
      .select("*")
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (errByUser) throw new Error(`Erro ao buscar assinatura por user_id: ${errByUser.message}`);

    // Se o pagamento veio de um link diferente do link registrado na assinatura do usuário,
    // verifica se é um link antigo obsoleto para não sobrescrever uma assinatura já ativa/mais recente
    if (subByUser && realPayment.paymentLink && subByUser.payment_link_id !== realPayment.paymentLink) {
      console.warn(
        `[Webhook Asaas] Pagamento ${paymentId} pertence a um link antigo (${realPayment.paymentLink}) diferente do link atual (${subByUser.payment_link_id}).`
      );
      // Registra o pagamento para histórico financeiro, mas não altera o plano atual se já estiver ativo
      if (subByUser.status === "active" && subByUser.plan === "pro") {
        console.warn("[Webhook Asaas] Ignorando alteração de plano para evitar downgrade indesejado por link antigo.");
        await recordBillingPayment(admin, subByUser.user_id, realPayment, subByUser.plan);
        return;
      }
    }
    userSub = subByUser;
  }

  if (!userSub || !userSub.user_id) {
    console.warn(`[Webhook Asaas] Nenhuma assinatura local encontrada para o pagamento ${paymentId}.`);
    return;
  }

  const finalUserId: string = userSub.user_id;

  // Determina o plano pretendido com base nos registros do servidor
  const intendedPlan: BillingPlanId =
    userSub.pending_plan === "pro" || fallbackPlan === "pro" ? "pro" : "starter";

  // REGRA DE SEGURANÇA MÁXIMA DE VALORES:
  // Pro: exige R$ 97,00 ou mais. Se menor, NÃO ativa Pro e NÃO faz fallback para Starter!
  // Starter: exige R$ 49,90 ou mais. Se menor, NÃO ativa!
  let resolvedPlan: BillingPlanId | null = null;

  if (intendedPlan === "pro") {
    if (validatePaymentAmountForPlan("pro", realPayment.value)) {
      resolvedPlan = "pro";
    } else {
      console.error(
        `[Webhook Asaas] Pagamento ${paymentId} de R$ ${realPayment.value} é insuficiente para o Plano Pro (exige R$ 97,00). Ativação rejeitada.`
      );
    }
  } else {
    if (validatePaymentAmountForPlan("starter", realPayment.value)) {
      resolvedPlan = "starter";
    } else {
      console.error(
        `[Webhook Asaas] Pagamento ${paymentId} de R$ ${realPayment.value} é insuficiente para o Plano Starter (exige R$ 49,90). Ativação rejeitada.`
      );
    }
  }

  // Eventos de sucesso de pagamento
  if (
    event === "PAYMENT_RECEIVED" ||
    event === "PAYMENT_CONFIRMED" ||
    realPayment.status === "RECEIVED" ||
    realPayment.status === "CONFIRMED"
  ) {
    if (!resolvedPlan) {
      // Valor insuficiente: registra o pagamento no histórico, mas não ativa a assinatura
      await recordBillingPayment(admin, finalUserId, realPayment, intendedPlan);
      return;
    }

    const quota = BILLING_PLANS[resolvedPlan].companyQuota;
    const now = new Date();

    // Calcula o término do período com base no vencimento real da cobrança + 3 dias úteis de tolerância bancária
    const periodEnd = calculatePeriodEnd(realPayment.dueDate, now);

    // PREVENÇÃO DE COBRANÇA DUPLA NO UPGRADE:
    // Se o cliente subiu para Pro e possuía uma assinatura Starter anterior ativa, cancela a anterior no Asaas
    const oldSubToCancel =
      resolvedPlan === "pro"
        ? userSub.previous_gateway_subscription_id ||
          (userSub.gateway_subscription_id &&
          userSub.gateway_subscription_id !== realPayment.subscription
            ? userSub.gateway_subscription_id
            : null)
        : null;

    if (oldSubToCancel) {
      try {
        await cancelAsaasSubscription(oldSubToCancel);
        console.log(`[Webhook Asaas] Assinatura anterior ${oldSubToCancel} cancelada com sucesso no Asaas.`);
      } catch (cancelErr) {
        console.error(
          `[Webhook Asaas] Falha ao cancelar assinatura anterior ${oldSubToCancel} no Asaas durante upgrade:`,
          cancelErr
        );
        // Mantém registrado em previous_gateway_subscription_id para retentativa se falhar
      }
    }

    const { error: updateSubErr } = await admin
      .from("subscriptions")
      .update({
        plan: resolvedPlan,
        status: "active",
        company_quota: quota,
        pending_plan: null, // Limpa o plano pendente
        gateway_subscription_id: realPayment.subscription || userSub.gateway_subscription_id,
        previous_gateway_subscription_id: oldSubToCancel ? null : userSub.previous_gateway_subscription_id,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        updated_at: now.toISOString(),
      })
      .eq("user_id", finalUserId);

    if (updateSubErr) {
      throw new Error(`Falha ao atualizar assinatura no banco: ${updateSubErr.message}`);
    }
  } else if (
    event === "PAYMENT_REFUNDED" ||
    event === "PAYMENT_CHARGEBACK_REQUESTED" ||
    realPayment.status === "REFUNDED" ||
    realPayment.status === "CHARGEBACK_REQUESTED"
  ) {
    // Pagamento estornado ou contestado -> bloqueia acesso
    await admin
      .from("subscriptions")
      .update({
        status: "past_due",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", finalUserId);
  } else if (event === "PAYMENT_OVERDUE" || realPayment.status === "OVERDUE") {
    // Verifica se a assinatura atual já expirou
    const currentEnd = userSub.current_period_end
      ? new Date(userSub.current_period_end)
      : new Date(0);

    if (currentEnd.getTime() <= Date.now()) {
      await admin
        .from("subscriptions")
        .update({
          status: "past_due",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", finalUserId);
    }
  }

  // Registra / atualiza o pagamento no histórico seguro
  await recordBillingPayment(admin, finalUserId, realPayment, resolvedPlan || intendedPlan);
}


/**
 * Registra o pagamento na tabela de auditoria segura billing_payments.
 */
async function recordBillingPayment(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  realPayment: AsaasPaymentResponse,
  plan: BillingPlanId
) {
  await admin.from("billing_payments").upsert(
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
}

/**
 * Trata eventos de ciclo de vida de assinaturas no Asaas.
 */
async function handleSubscriptionEvent(
  event: string,
  subscriptionId: string,
  admin: ReturnType<typeof createAdminClient>
) {
  if (
    event === "SUBSCRIPTION_DELETED" ||
    event === "SUBSCRIPTION_INACTIVATED"
  ) {
    // Mantém acesso até o término do ciclo atual pago (cancel_at_period_end)
    await admin
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("gateway_subscription_id", subscriptionId);
  }
}

