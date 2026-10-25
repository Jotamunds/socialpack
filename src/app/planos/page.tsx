import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlanosScreen } from "@/components/planos/PlanosScreen";
import { startPlanCheckoutAction } from "@/app/actions/billing";
import { subscriptionGrantsAccess } from "@/lib/supabase/subscription-guard";
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
 * 2. status e paymentUrl saem EXCLUSIVAMENTE de dados lidos no banco pelo servidor.
 * 3. O formulário envia apenas o ID do plano ("starter" ou "pro").
 * 4. O bloqueio das páginas protegidas ocorre no servidor.
 */
export default async function PlanosPage() {
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

  if (sub) {
    // Se há um link de pagamento gerado e a conta ainda não foi ativada
    if (sub.payment_url && (sub.status === "incomplete" || sub.status === "past_due")) {
      uiStatus = "pending";
      paymentUrl = sub.payment_url;
    }
  }

  return (
    <PlanosScreen
      status={uiStatus}
      paymentUrl={paymentUrl}
      chooseAction={startPlanCheckoutAction}
    />
  );
}
