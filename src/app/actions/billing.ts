"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPaymentLinkForPlan } from "@/lib/billing/asaas";
import { isValidPlanId, type BillingPlanId } from "@/lib/billing/plans";
import { sanitizePublicErrorMessage } from "@/lib/public-error";

const PlanFormSchema = z.enum(["starter", "pro"], {
  message: "Plano inválido. Selecione Starter ou Pro.",
});

/**
 * Server action acionada pelo formulário de escolha de plano em /planos.
 *
 * Invariantes de segurança:
 * 1. O plano é estritamente validado com Zod ("starter" | "pro").
 * 2. Preço, moeda ou periodicidade NÃO são lidos do form nem da URL.
 * 3. O valor em reais (49,90 ou 97,00) é recuperado exclusivamente no servidor.
 * 4. A conta NÃO é ativada por esta action; apenas o webhook de pagamento do Asaas ativa.
 */
export async function startPlanCheckoutAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?redirectTo=/planos");
  }

  const rawPlan = formData.get("plan");
  const parsed = PlanFormSchema.safeParse(rawPlan);

  if (!parsed.success) {
    throw new Error("Plano selecionado é inválido.");
  }

  const chosenPlan: BillingPlanId = parsed.data;

  const admin = createAdminClient();

  // Busca a assinatura atual
  const { data: sub } = await admin
    .from("subscriptions")
    .select("id, plan, status, payment_url, payment_link_id, pending_plan")
    .eq("user_id", user.id)
    .maybeSingle();

  // Se já tiver uma assinatura ativa no mesmo plano, não recria
  if (sub && (sub.status === "active" || sub.status === "trialing") && sub.plan === chosenPlan) {
    redirect("/perfil");
  }

  let paymentUrl: string | null = null;

  try {
    // Cria o link de pagamento recorrente no Asaas com valor fixo do servidor
    const link = await createPaymentLinkForPlan({
      userId: user.id,
      plan: chosenPlan,
      userEmail: user.email,
    });

    paymentUrl = link.url;

    // Atualiza o registro no banco: status permanece incomplete/past_due até confirmação do Asaas
    await admin
      .from("subscriptions")
      .update({
        pending_plan: chosenPlan,
        payment_link_id: link.id,
        payment_url: link.url,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    revalidatePath("/planos");
  } catch (err) {
    console.error("[startPlanCheckoutAction Error]:", err);
    throw new Error(sanitizePublicErrorMessage(err));
  }

  // Redireciona o usuário para a tela de pagamento seguro do Asaas
  if (paymentUrl) {
    redirect(paymentUrl);
  } else {
    redirect("/planos");
  }
}
