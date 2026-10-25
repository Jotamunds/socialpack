import "server-only";

import { connection } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOwnedStoragePathOrNull } from "@/lib/storage-path";

const SHOWCASE_LIMIT = 4;
const SIGNED_URL_TTL_SECONDS = 3600;

const demoUserIdSchema = z.string().uuid();

/** Lê DEMO_USER_ID do ambiente. Ausente ou inválido não é erro: a seção some. */
function readDemoUserId(): string | null {
  const parsed = demoUserIdSchema.safeParse(process.env.DEMO_USER_ID?.trim());
  return parsed.success ? parsed.data : null;
}

export type DemoShowcaseItem = {
  id: string;
  headline: string;
  imageUrl: string;
};

/**
 * Até 4 artes `completed` da empresa da conta demo.
 * Qualquer falha vira lista vazia. A landing omite a seção nesse caso.
 */
export async function getDemoShowcase(): Promise<DemoShowcaseItem[]> {
  await connection();

  const demoUserId = readDemoUserId();
  if (!demoUserId) {
    return [];
  }

  try {
    const admin = createAdminClient();

    const { data: company, error: companyError } = await admin
      .from("companies")
      .select("id")
      .eq("user_id", demoUserId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (companyError || !company?.id) {
      return [];
    }

    const companyId = company.id as string;

    const { data: posts, error: postsError } = await admin
      .from("posts")
      .select("id, headline, storage_path, image_storage_path, user_id, company_id, status")
      .eq("user_id", demoUserId)
      .eq("company_id", companyId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(SHOWCASE_LIMIT);

    if (postsError || !posts?.length) {
      return [];
    }

    const items: DemoShowcaseItem[] = [];

    for (const post of posts) {
      if (items.length >= SHOWCASE_LIMIT) break;
      if (post.user_id !== demoUserId) continue;
      if (post.company_id !== companyId) continue;
      if (post.status !== "completed") continue;

      const headline = typeof post.headline === "string" ? post.headline.trim() : "";
      if (!headline || typeof post.id !== "string") continue;

      const filePath = getOwnedStoragePathOrNull(
        demoUserId,
        post.image_storage_path || post.storage_path
      );
      if (!filePath) continue;

      const { data, error } = await admin.storage
        .from("generated-arts")
        .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);

      const imageUrl = data?.signedUrl;
      if (error || !imageUrl || !imageUrl.startsWith("https://")) continue;

      items.push({ id: post.id, headline, imageUrl });
    }

    return items;
  } catch (error) {
    console.error(error instanceof Error ? error.message : "unknown");
    return [];
  }
}
