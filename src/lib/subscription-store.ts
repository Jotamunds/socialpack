import "server-only";
import { getSessionPayload } from "./session";
import { readDataFile, writeDataFile } from "./storage-dir";
import { getSupabaseServerClient } from "./supabase";
import type { PlanId, SubscriptionPlan, SubscriptionStatus, UserSubscription } from "./types";

const FILENAME = "subscriptions.json";

export const PLANS: SubscriptionPlan[] = [
  {
    id: "starter",
    name: "Starter Comercial",
    price: "R$ 49,90",
    period: "/mês",
    description: "Para pequenos comércios e lojas que precisam de consistência visual semanal.",
    quota: 12,
    features: [
      "12 packs mensais completos (84 posts/mês)",
      "Edição completa de títulos, legendas e @",
      "Upload de fotos reais com preview imediato",
      "Histórico com download em lote",
      "Armazenamento seguro em nuvem",
    ],
  },
  {
    id: "pro",
    name: "Pro Ilimitado",
    price: "R$ 97,00",
    period: "/mês",
    description: "Para agências, freelancers e comércios de alto volume que buscam impacto total.",
    quota: 999,
    isPopular: true,
    features: [
      "Gerações ilimitadas de packs semanais",
      "Todos os 7 templates editoriais (Kinfolk, Polaroid, etc.)",
      "Upload ilimitado de fotos reais em alta resolução",
      "Download ultra-rápido de todos os PNGs",
      "Suporte prioritário via WhatsApp / E-mail",
      "Acesso antecipado a novos temas sazonais",
    ],
  },
];

type LocalStore = Record<string, UserSubscription>; // email -> sub

async function readLocalStore(): Promise<LocalStore> {
  try {
    const raw = await readDataFile(FILENAME);
    return raw ? (JSON.parse(raw) as LocalStore) : {};
  } catch {
    return {};
  }
}

async function writeLocalStore(store: LocalStore) {
  await writeDataFile(FILENAME, JSON.stringify(store, null, 2));
}

function mapFromSupabase(row: Record<string, unknown>): UserSubscription {
  const rawStatus = String(row.status || "none") as SubscriptionStatus;
  const isActuallyActive = rawStatus === "active";
  const rawPlanId = String(row.plan_id || "starter") as PlanId;
  const planId: PlanId = rawPlanId === "free" ? "starter" : rawPlanId;
  const rawQuota = typeof row.generation_quota === "number" ? row.generation_quota : 0;
  const quota = isActuallyActive ? (rawQuota > 0 ? rawQuota : 12) : 0;
  const rawPacks = typeof row.packs_created_count === "number" ? row.packs_created_count : 0;
  const rawUsed = typeof row.used_generations === "number" ? row.used_generations : 0;
  const count = Math.max(rawUsed, rawPacks);

  return {
    userEmail: String(row.user_email || ""),
    status: isActuallyActive ? "active" : "none",
    planId,
    generationQuota: quota,
    usedGenerations: count,
    packsCreatedCount: count,
    currentPeriodEnd: String(row.current_period_end || new Date().toISOString()),
    updatedAt: String(row.updated_at || new Date().toISOString()),
  };
}

export function getDefaultSubscription(userEmail: string): UserSubscription {
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);

  return {
    userEmail: userEmail.toLowerCase().trim(),
    status: "none",
    planId: "starter",
    generationQuota: 0,
    usedGenerations: 0,
    packsCreatedCount: 0,
    currentPeriodEnd: nextMonth.toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Obtém o status da assinatura do usuário (Supabase ou fallback local).
 */
export async function getSubscription(userEmail: string): Promise<UserSubscription> {
  const normalizedEmail = userEmail.toLowerCase().trim();
  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .ilike("user_email", normalizedEmail)
        .maybeSingle();

      if (!error && data) {
        // Checa se a tabela profiles possui contagem maior ou mais recente
        let profileCount = 0;
        try {
          const { data: profData } = await supabase
            .from("profiles")
            .select("packs_created_count")
            .ilike("user_email", normalizedEmail)
            .maybeSingle();
          if (profData && typeof profData.packs_created_count === "number") {
            profileCount = profData.packs_created_count;
          }
        } catch {}

        const mapped = mapFromSupabase(data);
        if (profileCount > (mapped.packsCreatedCount ?? 0)) {
          mapped.packsCreatedCount = profileCount;
          mapped.usedGenerations = profileCount;
        }
        return mapped;
      }
    } catch (err) {
      console.warn("[SocialPack] Erro ao consultar assinatura no Supabase:", err);
    }

    // Se ainda não existir em subscriptions, tenta obter do profiles
    try {
      const { data: profData, error: profErr } = await supabase
        .from("profiles")
        .select("packs_created_count")
        .ilike("user_email", normalizedEmail)
        .maybeSingle();

      if (!profErr && profData) {
        const count = typeof profData.packs_created_count === "number" ? profData.packs_created_count : 0;
        const initial = getDefaultSubscription(normalizedEmail);
        initial.packsCreatedCount = count;
        initial.usedGenerations = count;
        await updateSubscription(normalizedEmail, initial);
        return initial;
      }
    } catch (err) {
      console.warn("[SocialPack] Erro ao consultar profile no Supabase:", err);
    }
  }

  const local = await readLocalStore();
  if (local[normalizedEmail]) {
    const item = local[normalizedEmail];
    const count = Math.max(item.usedGenerations || 0, item.packsCreatedCount || 0);
    return {
      ...item,
      usedGenerations: count,
      packsCreatedCount: count,
    };
  }

  // Fallback para Cookie de Sessão JWT (garante persistência multi-container em serverless como Vercel)
  try {
    const payload = await getSessionPayload();
    if (
      payload &&
      payload.email.toLowerCase().trim() === normalizedEmail &&
      payload.status === "active"
    ) {
      const plan = PLANS.find((p) => p.id === payload.planId) || PLANS[0];
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      const cookieSub: UserSubscription = {
        userEmail: normalizedEmail,
        status: "active",
        planId: (payload.planId as PlanId) || "starter",
        generationQuota: payload.quota || plan.quota,
        usedGenerations: 0,
        packsCreatedCount: 0,
        currentPeriodEnd: nextMonth.toISOString(),
        updatedAt: new Date().toISOString(),
      };
      try {
        local[normalizedEmail] = cookieSub;
        await writeLocalStore(local);
      } catch {}
      return cookieSub;
    }
  } catch {
    // cookies() pode não estar disponível em execuções fora do ciclo de vida HTTP
  }

  // Cria padrão sem assinatura ativa caso ainda não exista
  const initial = getDefaultSubscription(normalizedEmail);
  await updateSubscription(normalizedEmail, initial);
  return initial;
}

/**
 * Atualiza ou insere a assinatura do usuário no Supabase e cache local.
 */
export async function updateSubscription(
  userEmail: string,
  updates: Partial<UserSubscription>,
): Promise<UserSubscription> {
  const normalizedEmail = userEmail.toLowerCase().trim();
  const supabase = getSupabaseServerClient();
  let current: UserSubscription | null = null;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .ilike("user_email", normalizedEmail)
        .maybeSingle();

      if (!error && data) {
        current = mapFromSupabase(data);
      }
    } catch (err) {
      console.warn("[SocialPack] Erro ao carregar assinatura no Supabase:", err);
    }
  }

  if (!current) {
    const local = await readLocalStore();
    current = local[normalizedEmail] || getDefaultSubscription(normalizedEmail);
  }

  const updatedPacks = updates.packsCreatedCount ?? updates.usedGenerations;
  const countToSet =
    typeof updatedPacks === "number"
      ? updatedPacks
      : Math.max(current.packsCreatedCount ?? 0, current.usedGenerations ?? 0);

  const updated: UserSubscription = {
    ...current,
    ...updates,
    userEmail: normalizedEmail,
    usedGenerations: countToSet,
    packsCreatedCount: countToSet,
    updatedAt: new Date().toISOString(),
  };

  if (supabase) {
    const subPayload = {
      user_email: normalizedEmail,
      status: updated.status,
      plan_id: updated.planId,
      generation_quota: updated.generationQuota,
      used_generations: updated.usedGenerations,
      packs_created_count: updated.packsCreatedCount,
      current_period_end: updated.currentPeriodEnd,
      updated_at: updated.updatedAt,
    };

    try {
      const { error } = await supabase
        .from("subscriptions")
        .upsert(subPayload, { onConflict: "user_email" });

      if (error) {
        if (error.message?.includes("packs_created_count")) {
          const { packs_created_count: _, ...fallbackPayload } = subPayload;
          await supabase
            .from("subscriptions")
            .upsert(fallbackPayload, { onConflict: "user_email" });
        } else {
          await supabase
            .from("subscriptions")
            .update(subPayload)
            .ilike("user_email", normalizedEmail);
        }
      }
    } catch (err) {
      console.warn("[SocialPack] Falha ao sincronizar assinatura no Supabase:", err);
    }

    try {
      await supabase
        .from("profiles")
        .update({
          packs_created_count: updated.packsCreatedCount,
          updated_at: updated.updatedAt,
        })
        .ilike("user_email", normalizedEmail);
    } catch (err) {
      console.warn("[SocialPack] Falha ao atualizar packs_created_count no profiles:", err);
    }
  }

  try {
    const local = await readLocalStore();
    local[normalizedEmail] = updated;
    await writeLocalStore(local);
  } catch {
    // no-op em ambientes restritos
  }

  return updated;
}

export type QuotaCheckResult = {
  allowed: boolean;
  remaining: number;
  sub: UserSubscription;
  status: 200 | 402 | 403;
  errorMessage?: string;
};

/**
 * Checa se o usuário possui cota disponível antes de autorizar a geração de posts.
 */
export async function checkQuota(
  userEmail: string,
): Promise<QuotaCheckResult> {
  const sub = await getSubscription(userEmail);

  // Modelo 100% pago: usuários sem assinatura ativa são impedidos de gerar
  if (sub.status !== "active") {
    return {
      allowed: false,
      remaining: 0,
      sub,
      status: 403,
      errorMessage: "Assinatura ativa necessária. Escolha o plano Starter ou Pro para gerar novos packs.",
    };
  }

  // Plano Pro (ilimitado): registrar a quantidade criada sem travar a geração
  if (sub.planId === "pro" || sub.generationQuota >= 999) {
    const remaining = Math.max(0, sub.generationQuota - sub.usedGenerations);
    return {
      allowed: true,
      remaining: remaining > 0 ? remaining : 999,
      sub,
      status: 200,
    };
  }

  // Plano Starter (com limite definido de 12 packs mensais)
  const currentCount = Math.max(sub.usedGenerations || 0, sub.packsCreatedCount || 0);
  const remaining = Math.max(0, sub.generationQuota - currentCount);

  if (remaining <= 0) {
    return {
      allowed: false,
      remaining: 0,
      sub,
      status: 403,
      errorMessage: "Limite de packs atingido. Faça upgrade para o plano Pro",
    };
  }

  return {
    allowed: true,
    remaining,
    sub,
    status: 200,
  };
}

/**
 * Incrementa o uso da cota após uma geração bem-sucedida.
 */
export async function incrementQuota(
  userEmail: string,
): Promise<UserSubscription> {
  const sub = await getSubscription(userEmail);
  const currentCount = Math.max(sub.usedGenerations || 0, sub.packsCreatedCount || 0);
  const nextCount = currentCount + 1;

  return updateSubscription(userEmail, {
    usedGenerations: nextCount,
    packsCreatedCount: nextCount,
  });
}

