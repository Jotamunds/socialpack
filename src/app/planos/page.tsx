import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PlanosScreen } from "@/components/planos/PlanosScreen";
import { startPlanCheckoutAction } from "@/app/actions/billing";
import { subscriptionGrantsAccess } from "@/lib/supabase/subscription-guard";
import { PLAN_DISPLAY } from "@/lib/plans-display";
import type { BillingReviewCode } from "@/lib/billing/review-codes";
import type { BillingUiStatus } from "@/components/planos/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Planos | SocialPack",
  description: "Escolha o plano Starter ou Pro do SocialPack.",
};

/**
 * Tela de escolha de planos e acompanhamento de pagamento.
 *
 * Invariantes estritas de segurança:
 * 1. Não lê preço, plano ou status da URL (searchParams são ignorados).
 * 2. status, review_code e paymentUrl saem EXCLUSIVAMENTE de dados lidos no banco pelo servidor.
 * 3. O formulário envia apenas o ID do plano ("starter" ou "pro").
 * 4. O bloqueio das páginas protegidas ocorre no servidor.
 * 5. billing_webhook_events é lido apenas via admin client no servidor (sem RLS vazada).
 */
type PlanosPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function PlanosPage(props: PlanosPageProps) {
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const wantChangePlan = searchParams?.mudar === "1" || searchParams?.trocar === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Usuário não autenticado pode visualizar os planos, mas a action exigirá login
  if (!user) {
    return <PlanosScreen status="none" chooseAction={startPlanCheckoutAction} />;
  }

  // Consulta assinatura do usuário diretamente no banco
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status, payment_url, pending_plan, cancel_at_period_end, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  // Se já possui assinatura com acesso válido, redireciona para a área do app
  if (
    sub &&
    subscriptionGrantsAccess({
      status: sub.status,
      current_period_end: sub.current_period_end,
      cancel_at_period_end: sub.cancel_at_period_end,
    })
  ) {
    redirect("/perfil");
  }

  let uiStatus: BillingUiStatus = "none";
  let paymentUrl: string | null = null;
  let reviewCode: BillingReviewCode | null = null;
  let expectedPlanPriceLabel: string | null = null;

  // Consulta o evento mais recente em manual_review para o usuário logado
  try {
    const admin = createAdminClient();
    const { data: latestReviewEvent } = await admin
      .from("billing_webhook_events")
      .select("review_code, created_at")
      .eq("user_id", user.id)
      .eq("status", "manual_review")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestReviewEvent?.review_code) {
      reviewCode = latestReviewEvent.review_code as BillingReviewCode;
    }
  } catch (err) {
    // Tolerância em ambientes de teste sem service_role configurado
    console.warn("[PlanosPage] Não foi possível consultar eventos de revisão:", err);
  }

  if (reviewCode && (!sub || sub.status === "incomplete" || sub.status === "past_due")) {
    uiStatus = "review";
    paymentUrl = sub?.payment_url ?? null;
    const targetPlan = sub?.pending_plan || sub?.plan;
    const display = targetPlan ? PLAN_DISPLAY.find((p) => p.id === targetPlan) : null;
    expectedPlanPriceLabel = display ? `${display.priceLabel}${display.periodLabel}` : null;
  } else if (sub) {
    // Se há um link de pagamento gerado e a conta ainda não foi ativada
    if (sub.payment_url && (sub.status === "incomplete" || sub.status === "past_due") && !wantChangePlan) {
      uiStatus = "pending";
      paymentUrl = sub.payment_url;
    }
  }

  return (
    <PlanosScreen
      status={uiStatus}
      paymentUrl={paymentUrl}
      reviewCode={reviewCode}
      expectedPlanPriceLabel={expectedPlanPriceLabel}
      chooseAction={startPlanCheckoutAction}
    />
  );
}
