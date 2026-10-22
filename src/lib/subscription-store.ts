import "server-only";
import { readDataFile, writeDataFile } from "./storage-dir";
import { getSupabaseServerClient } from "./supabase";
import type { PlanId, SubscriptionPlan, SubscriptionStatus, UserSubscription } from "./types";

const FILENAME = "subscriptions.json";

export const PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Gratuito",
    price: "R$ 0",
    period: "para sempre",
    description: "Ideal para testar a qualidade dos calendários editoriais e das artes semanais.",
    quota: 3,
    features: [
      "Até 3 gerações de packs de teste",
      "7 posts por pack (Segunda a Domingo)",
      "Templates visuais padrão",
      "Exportação em 1080x1080px",
    ],
  },
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
  return {
    userEmail: String(row.user_email || ""),
    status: (row.status || "free") as SubscriptionStatus,
    planId: (row.plan_id || "free") as PlanId,
    generationQuota: typeof row.generation_quota === "number" ? row.generation_quota : 3,
    usedGenerations: typeof row.used_generations === "number" ? row.used_generations : 0,
    currentPeriodEnd: String(row.current_period_end || new Date().toISOString()),
    updatedAt: String(row.updated_at || new Date().toISOString()),
  };
}

export function getDefaultSubscription(userEmail: string): UserSubscription {
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);

  return {
    userEmail: userEmail.toLowerCase(),
    status: "free",
    planId: "free",
    generationQuota: 3,
    usedGenerations: 0,
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
        .eq("user_email", normalizedEmail)
        .maybeSingle();

      if (!error && data) {
        return mapFromSupabase(data);
      }
    } catch (err) {
      console.warn("[SocialPack] Erro ao consultar assinatura no Supabase:", err);
    }
  }

  const local = await readLocalStore();
  if (local[normalizedEmail]) {
    return local[normalizedEmail];
  }

  // Cria padrão gratuito caso ainda não exista
  const initial = getDefaultSubscription(normalizedEmail);
  await updateSubscription(normalizedEmail, initial);
  return initial;
}

/**
 * Atualiza ou insere a assinatura do usuário.
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
        .eq("user_email", normalizedEmail)
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

  const updated: UserSubscription = {
    ...current,
    ...updates,
    userEmail: normalizedEmail,
    updatedAt: new Date().toISOString(),
  };

  if (supabase) {
    try {
      await supabase.from("subscriptions").upsert(
        {
          user_email: normalizedEmail,
          status: updated.status,
          plan_id: updated.planId,
          generation_quota: updated.generationQuota,
          used_generations: updated.usedGenerations,
          current_period_end: updated.currentPeriodEnd,
          updated_at: updated.updatedAt,
        },
        { onConflict: "user_email" },
      );
    } catch (err) {
      console.warn("[SocialPack] Falha ao sincronizar assinatura no Supabase:", err);
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

/**
 * Checa se o usuário possui cota disponível antes de autorizar a geração de posts.
 */
export async function checkQuota(
  userEmail: string,
): Promise<{ allowed: boolean; remaining: number; sub: UserSubscription }> {
  const sub = await getSubscription(userEmail);
  const remaining = Math.max(0, sub.generationQuota - sub.usedGenerations);
  const allowed = sub.status === "active" || remaining > 0;

  return {
    allowed,
    remaining,
    sub,
  };
}

/**
 * Incrementa o uso da cota após uma geração bem-sucedida.
 */
export async function incrementQuota(
  userEmail: string,
): Promise<UserSubscription> {
  const sub = await getSubscription(userEmail);
  return updateSubscription(userEmail, {
    usedGenerations: sub.usedGenerations + 1,
  });
}
