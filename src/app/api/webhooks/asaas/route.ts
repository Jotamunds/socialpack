import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAsaasPayment,
  verifyAsaasWebhookToken,
  type AsaasPaymentResponse,
} from "@/lib/billing/asaas";
import {
  BILLING_PLANS,
  GRACE_PERIOD_DAYS,
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

  // 2. Garantia de Idempotência no Banco de Dados
  // Se o evento já foi processado anteriormente, responde 200 imediatamente
  const { error: eventInsertError } = await admin
    .from("billing_webhook_events")
    .insert({
      id: body.id,
      event: body.event,
      payload: body,
      processed_at: new Date().toISOString(),
    });

  if (eventInsertError) {
    // Código 23505 = unique_violation no Postgres
    if (
      eventInsertError.code === "23505" ||
      eventInsertError.message?.toLowerCase().includes("duplicate")
    ) {
      return NextResponse.json({ received: true, duplicate: true });
    }
  }

  try {
    // 3. Processamento de Eventos de Cobrança / Pagamento
    if (body.payment?.id) {
      await handlePaymentEvent(body.event, body.payment.id, admin);
    } else if (body.subscription?.id) {
      await handleSubscriptionEvent(body.event, body.subscription.id, admin);
    }

    return NextResponse.json({ received: true, processed: true });
  } catch (err) {
    // Log interno seguro sem expor credenciais
    console.error("[Asaas Webhook Error]:", err instanceof Error ? err.message : err);
    // Retorna 200 mesmo em exceções de negócio para evitar que o Asaas pause a fila após 15 retentativas
    return NextResponse.json({ received: true, error: "Erro interno processado" }, { status: 200 });
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
  let realPayment: AsaasPaymentResponse;
  try {
    realPayment = await getAsaasPayment(paymentId);
  } catch (err) {
    console.error(`Não foi possível consultar pagamento ${paymentId} no Asaas:`, err);
    return;
  }

  // Identifica o usuário e o plano pretendido através de múltiplas chaves seguras:
  // 1. paymentLink id salvo em subscriptions
  // 2. subscription id salvo em subscriptions
  // 3. externalReference (formato userId:plan ou userId)
  let targetUserId: string | null = null;
  let fallbackPlan: BillingPlanId = "starter";

  if (realPayment.externalReference) {
    const parts = realPayment.externalReference.split(":");
    targetUserId = parts[0] || null;
    if (parts[1] === "pro" || parts[1] === "starter") {
      fallbackPlan = parts[1];
    }
  }

  // Busca a assinatura no banco
  let subQuery = admin.from("subscriptions").select("*");

  if (realPayment.paymentLink) {
    subQuery = subQuery.or(
      `payment_link_id.eq.${realPayment.paymentLink}${
        targetUserId ? `,user_id.eq.${targetUserId}` : ""
      }`
    );
  } else if (realPayment.subscription) {
    subQuery = subQuery.or(
      `gateway_subscription_id.eq.${realPayment.subscription}${
        targetUserId ? `,user_id.eq.${targetUserId}` : ""
      }`
    );
  } else if (targetUserId) {
    subQuery = subQuery.eq("user_id", targetUserId);
  } else {
    // Sem forma de correlacionar com o usuário local
    console.warn(`[Webhook Asaas] Pagamento ${paymentId} sem correlação com usuário local.`);
    return;
  }

  const { data: userSub, error: subError } = await subQuery.maybeSingle();

  if (subError || !userSub) {
    console.warn(
      `[Webhook Asaas] Nenhuma assinatura local encontrada para o pagamento ${paymentId}.`
    );
    return;
  }

  targetUserId = userSub.user_id;

  // Determina o plano que deve ser ativado com base no valor real recebido
  // REGRA DE SEGURANÇA MÁXIMA: Plano Pro SÓ é liberado mediante valor >= R$ 97,00
  const intendedPlan: BillingPlanId =
    userSub.pending_plan === "pro" || fallbackPlan === "pro" || userSub.plan === "pro"
      ? "pro"
      : "starter";

  let resolvedPlan: BillingPlanId = "starter";

  if (intendedPlan === "pro") {
    if (validatePaymentAmountForPlan("pro", realPayment.value)) {
      resolvedPlan = "pro";
    } else {
      // Valor insuficiente para Pro -> ativa no máximo Starter
      resolvedPlan = "starter";
    }
  } else {
    resolvedPlan = "starter";
  }

  const quota = BILLING_PLANS[resolvedPlan].companyQuota;

  // Eventos de sucesso de pagamento
  if (
    event === "PAYMENT_RECEIVED" ||
    event === "PAYMENT_CONFIRMED" ||
    realPayment.status === "RECEIVED" ||
    realPayment.status === "CONFIRMED"
  ) {
    const now = new Date();
    // 30 dias de ciclo + 3 dias de tolerância
    const periodEnd = new Date(
      now.getTime() + (30 + GRACE_PERIOD_DAYS) * 24 * 60 * 60 * 1000
    );

    await admin
      .from("subscriptions")
      .update({
        plan: resolvedPlan,
        status: "active",
        company_quota: quota,
        pending_plan: null, // Limpa o plano pendente
        gateway_subscription_id: realPayment.subscription || userSub.gateway_subscription_id,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        updated_at: now.toISOString(),
      })
      .eq("user_id", targetUserId);
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
      .eq("user_id", targetUserId);
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
        .eq("user_id", targetUserId);
    }
  }

  // Registra / atualiza o pagamento no histórico seguro
  await admin.from("billing_payments").upsert(
    {
      user_id: targetUserId,
      asaas_payment_id: realPayment.id,
      asaas_subscription_id: realPayment.subscription || null,
      asaas_payment_link_id: realPayment.paymentLink || null,
      plan: resolvedPlan,
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
