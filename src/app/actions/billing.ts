"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createPaymentLinkForPlan,
  deleteAsaasPaymentLink,
} from "@/lib/billing/asaas";
import { isValidPlanId, type BillingPlanId } from "@/lib/billing/plans";
import { sanitizePublicErrorMessage } from "@/lib/public-error";

const PlanFormSchema = z.enum(["starter", "pro"], {
  message: "Plano inválido. Selecione Starter ou Pro.",
});

/**
 * Server action acionada pelo formulário de escolha de plano em /planos.
 *
 * Invariantes de segurança e integridade:
 * 1. O plano é estritamente validado com Zod ("starter" | "pro").
 * 2. Preço, moeda ou periodicidade NÃO são lidos do form nem da URL.
 * 3. O valor em reais (49,90 ou 97,00) é recuperado exclusivamente no servidor.
 * 4. A conta NÃO é ativada por esta action; apenas o webhook de pagamento do Asaas ativa.
 * 5. Garante a existência da assinatura local antes de criar o link e verifica a persistência antes de redirecionar.
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

  // 1. Busca a assinatura atual com tolerância/retentativas para aguardar trigger de auth se recém-cadastrado
  let sub: {
    id: string;
    plan: string;
    status: string;
    payment_url: string | null;
    payment_link_id: string | null;
    pending_plan: string | null;
  } | null = null;

  for (let attempt = 1; attempt <= 5; attempt++) {
    const { data, error } = await admin
      .from("subscriptions")
      .select("id, plan, status, payment_url, payment_link_id, pending_plan")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error(`[Checkout] Erro ao consultar assinatura (tentativa ${attempt}):`, error);
    }

    if (data) {
      sub = data;
      break;
    }

    // Aguarda 100ms antes da próxima tentativa
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Se após as retentativas o registro ainda não existir, cria explicitamente a linha de assinatura
  if (!sub) {
    const { data: newSub, error: insertError } = await admin
      .from("subscriptions")
      .insert({
        user_id: user.id,
        plan: "starter",
        status: "incomplete",
        company_quota: 1,
      })
      .select("id, plan, status, payment_url, payment_link_id, pending_plan")
      .single();

    if (insertError || !newSub) {
      console.error("[Checkout] Falha ao criar registro inicial de assinatura:", insertError);
      throw new Error("Não foi possível inicializar a assinatura. Tente novamente em alguns segundos.");
    }

    sub = newSub;
  }

  // Se já tiver uma assinatura ativa no mesmo plano, redireciona para o perfil
  if (sub && (sub.status === "active" || sub.status === "trialing") && sub.plan === chosenPlan) {
    redirect("/perfil");
  }

  // Se havia um link de pagamento anterior pendente, invalida no Asaas para não gerar cobranças orfãs
  if (sub.payment_link_id) {
    try {
      await deleteAsaasPaymentLink(sub.payment_link_id);
    } catch (e) {
      console.warn("[Checkout] Não foi possível remover link de pagamento anterior:", e);
    }
  }

  let paymentUrl: string | null = null;

  try {
    // 2. Cria o link de pagamento recorrente no Asaas com valor fixo do servidor
    const link = await createPaymentLinkForPlan({
      userId: user.id,
      plan: chosenPlan,
      userEmail: user.email,
    });

    paymentUrl = link.url;

    // 3. Atualiza o registro no banco e VERIFICA se o registro foi realmente atualizado
    const { data: updatedSub, error: updateError } = await admin
      .from("subscriptions")
      .update({
        pending_plan: chosenPlan,
        payment_link_id: link.id,
        payment_url: link.url,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (updateError || !updatedSub) {
      console.error("[Checkout] Falha ao persistir link na assinatura:", updateError);
      throw new Error("Falha ao registrar sessão de pagamento no servidor. Tente novamente.");
    }

    revalidatePath("/planos");
  } catch (err) {
    console.error("[startPlanCheckoutAction Error]:", err);
    throw new Error(sanitizePublicErrorMessage(err));
  }

  // 4. Redireciona o usuário para a tela de pagamento seguro do Asaas somente após validação de persistência
  if (paymentUrl) {
    redirect(paymentUrl);
  } else {
    redirect("/planos");
  }
}

