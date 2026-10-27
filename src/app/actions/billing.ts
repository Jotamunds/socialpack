"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createPaymentLinkForPlan,
  deleteAsaasPaymentLink,
} from "@/lib/billing/asaas";
import { type BillingPlanId } from "@/lib/billing/plans";
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
 * 5. Bloqueia checkouts incompatíveis:
 *    - Usuário com Pro ativo não pode assinar Starter.
 *    - Usuário com Starter ativo deve usar upgradeToProAction().
 *    - Usuário com assinatura ativa no mesmo plano é redirecionado ao perfil.
 *    - Checkout pendente para o mesmo plano é reutilizado.
 *    - Checkout pendente para outro plano é invalidado no Asaas antes de substituir.
 * 6. Trata concorrência na criação inicial da assinatura contra o trigger de auth.
 * 7. Gera identificador único de tentativa de checkout (pending_checkout_id).
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
    pending_checkout_id?: string | null;
  } | null = null;

  for (let attempt = 1; attempt <= 5; attempt++) {
    const { data, error } = await admin
      .from("subscriptions")
      .select("id, plan, status, payment_url, payment_link_id, pending_plan, pending_checkout_id")
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
  // Trata concorrência com o trigger de auth (conflito 23505) reconsultando a linha criada
  if (!sub) {
    const { data: newSub, error: insertError } = await admin
      .from("subscriptions")
      .insert({
        user_id: user.id,
        plan: "starter",
        status: "incomplete",
        company_quota: 1,
      })
      .select("id, plan, status, payment_url, payment_link_id, pending_plan, pending_checkout_id")
      .maybeSingle();

    if (insertError) {
      // Conflito de chave única: outro processo (ex: trigger) criou a linha simultaneamente
      if (insertError.code === "23505" || insertError.message?.toLowerCase().includes("duplicate")) {
        const { data: conflictSub } = await admin
          .from("subscriptions")
          .select("id, plan, status, payment_url, payment_link_id, pending_plan, pending_checkout_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (conflictSub) {
          sub = conflictSub;
        }
      }

      if (!sub) {
        console.error("[Checkout] Falha ao criar registro inicial de assinatura:", insertError);
        throw new Error("Não foi possível inicializar a assinatura. Tente novamente em alguns segundos.");
      }
    } else if (newSub) {
      sub = newSub;
    }
  }

  if (!sub) {
    throw new Error("Não foi possível carregar os dados da assinatura.");
  }

  // 2. Validações estritas de transição baseadas no estado da assinatura:
  if (sub.status === "active" || sub.status === "trialing") {
    // a) Já tem assinatura ativa no mesmo plano
    if (sub.plan === chosenPlan) {
      redirect("/perfil");
    }

    // b) Já tem Pro ativo: bloqueia criação de assinatura Starter concorrente
    if (sub.plan === "pro" && chosenPlan === "starter") {
      throw new Error("Você já possui o Plano Pro ativo. Não é possível assinar o Plano Starter simultaneamente.");
    }

    // c) Tem Starter ativo e quer Pro: deve seguir pelo fluxo formal de upgrade
    if (sub.plan === "starter" && chosenPlan === "pro") {
      redirect("/configuracoes");
    }
  }

  // 3. Reutilização de checkout pendente para o mesmo plano
  if (sub.pending_plan === chosenPlan && sub.payment_url && sub.payment_link_id) {
    redirect(sub.payment_url);
  }

  // 4. Invalidação de link de pagamento anterior se for de outro plano
  if (sub.payment_link_id) {
    try {
      await deleteAsaasPaymentLink(sub.payment_link_id);
    } catch (e) {
      console.warn(
        `[Checkout] Aviso ao tentar invalidar link de pagamento anterior ${sub.payment_link_id} no Asaas (não-bloqueante):`,
        e
      );
    }
  }

  let paymentUrl: string | null = null;
  const checkoutId = crypto.randomUUID();
  let createdLinkId: string | null = null;
  let linkPersisted = false;

  try {
    // 5. Cria o link de pagamento recorrente no Asaas com valor fixo do servidor e identificador de checkout
    const link = await createPaymentLinkForPlan({
      userId: user.id,
      plan: chosenPlan,
      userEmail: user.email,
      checkoutId,
    });

    createdLinkId = link.id;
    paymentUrl = link.url;

    // 6. Atualiza o registro no banco com pending_checkout_id e VERIFICA se o registro foi realmente atualizado
    const { data: updatedSub, error: updateError } = await admin
      .from("subscriptions")
      .update({
        pending_plan: chosenPlan,
        pending_checkout_id: checkoutId,
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

    linkPersisted = true;
    revalidatePath("/planos");
  } catch (err) {
    // Tarefa 8: Rollback de integridade: se o link foi criado no Asaas mas o banco falhou, exclui o link órfão
    if (createdLinkId && !linkPersisted) {
      try {
        await deleteAsaasPaymentLink(createdLinkId);
        console.log(`[Checkout] Link órfão ${createdLinkId} removido no Asaas após falha de persistência.`);
      } catch (cleanupErr) {
        console.error("[Checkout] Falha ao remover link órfão no Asaas após erro de persistência:", cleanupErr);
      }
    }
    console.error("[startPlanCheckoutAction Error]:", err);
    throw new Error(sanitizePublicErrorMessage(err));
  }

  // 7. Redireciona o usuário para a tela de pagamento seguro do Asaas somente após validação de persistência
  if (paymentUrl) {
    redirect(paymentUrl);
  } else {
    redirect("/planos");
  }
}




/**
 * Server Action para revalidação da rota de planos (/planos).
 * Permite reconsulta dos dados mais recentes sem reload completo.
 */
export async function refreshPlanosAction(): Promise<void> {
  revalidatePath("/planos");
}
