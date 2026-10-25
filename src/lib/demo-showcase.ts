import "server-only";

import { connection } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOwnedStoragePathOrNull } from "@/lib/storage-path";

/** Conta demo fixa. O helper não recebe id do cliente. */
const DEMO_USER_ID = "cfe15d67-997c-4f51-9e38-6cf13e6e0b4f";

const SHOWCASE_LIMIT = 4;
const SIGNED_URL_TTL_SECONDS = 3600;

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

  try {
    const admin = createAdminClient();

    const { data: company, error: companyError } = await admin
      .from("companies")
      .select("id")
      .eq("user_id", DEMO_USER_ID)
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
      .eq("user_id", DEMO_USER_ID)
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
      if (post.user_id !== DEMO_USER_ID) continue;
      if (post.company_id !== companyId) continue;
      if (post.status !== "completed") continue;

      const headline = typeof post.headline === "string" ? post.headline.trim() : "";
      if (!headline || typeof post.id !== "string") continue;

      const filePath = getOwnedStoragePathOrNull(
        DEMO_USER_ID,
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
  } catch {
    return [];
  }
}
