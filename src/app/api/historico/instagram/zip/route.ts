import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { subscriptionGrantsAccess } from "@/lib/supabase/subscription-guard";
import { getOwnedStoragePathOrNull } from "@/lib/storage-path";
import {
  applyHistoryPostFilters,
  HISTORY_POSTS_SELECT,
  parseHistoryFilters,
} from "@/lib/history-filters";
import {
  assessHistoryZipObject,
  GENERATED_ARTS_BUCKET,
  HISTORY_ZIP_MAX_BYTES,
  HISTORY_ZIP_MAX_FILE_BYTES,
  HISTORY_ZIP_MAX_POSTS,
  HISTORY_ZIP_MESSAGES,
  historyZipDownloadName,
  historyZipEntryName,
  imageExtensionFromOwnedPath,
  isMissingStoredObject,
} from "@/lib/history-zip";
import { streamStoredZip } from "@/lib/history-zip-stream";

export const dynamic = "force-dynamic";
/** Literal exigido pelo Next. Manter igual a HISTORY_ZIP_MAX_DURATION_SECONDS. */
export const maxDuration = 60;

type HistoryZipPostRow = {
  id: string;
  headline: string | null;
  theme: string | null;
  day: string | null;
  storage_path: string | null;
  image_storage_path: string | null;
};

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { ok: false, error: message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

/**
 * ZIP das artes concluídas do histórico, com os mesmos filtros da página.
 * A sessão vem de auth.getUser(); a consulta e o storage usam o cliente do
 * usuário (RLS). O service role não baixa arquivo nenhum.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonError(HISTORY_ZIP_MESSAGES.unauthorized, 401);
    }

    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("status, current_period_end, cancel_at_period_end")
      .eq("user_id", user.id)
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscriptionError) {
      return jsonError(HISTORY_ZIP_MESSAGES.failed, 500);
    }

    if (!subscription || !subscriptionGrantsAccess(subscription)) {
      return jsonError(HISTORY_ZIP_MESSAGES.subscription, 403);
    }

    const filters = parseHistoryFilters(request.nextUrl.searchParams);

    let query = supabase
      .from("posts")
      .select(HISTORY_POSTS_SELECT)
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    query = applyHistoryPostFilters(query, filters);

    const { data, error: queryError } = await query.limit(HISTORY_ZIP_MAX_POSTS + 1);

    if (queryError) {
      return jsonError(HISTORY_ZIP_MESSAGES.failed, 500);
    }

    const rows = (data ?? []) as HistoryZipPostRow[];
    if (rows.length === 0) {
      return jsonError(HISTORY_ZIP_MESSAGES.empty, 404);
    }
    if (rows.length > HISTORY_ZIP_MAX_POSTS) {
      return jsonError(HISTORY_ZIP_MESSAGES.tooMany, 400);
    }

    const candidates: { path: string; stem: string }[] = [];
    const seenPaths = new Set<string>();

    for (const row of rows) {
      const path = getOwnedStoragePathOrNull(user.id, row.image_storage_path || row.storage_path);
      if (!path || !imageExtensionFromOwnedPath(path) || seenPaths.has(path)) continue;
      seenPaths.add(path);
      candidates.push({
        path,
        stem: row.headline || row.theme || row.day || "arte",
      });
    }

    if (candidates.length === 0) {
      return jsonError(HISTORY_ZIP_MESSAGES.empty, 404);
    }

    // Baixa em sequência e só então abre o stream. Assim um estouro de tamanho
    // ainda responde JSON, em vez de um ZIP cortado. O corpo da resposta é
    // streamed para não esbarrar no limite de payload da Vercel.
    const ready: { name: string; bytes: Uint8Array }[] = [];
    let totalBytes = 0;
    let downloadFailures = 0;

    for (const candidate of candidates) {
      if (request.signal.aborted) {
        return jsonError(HISTORY_ZIP_MESSAGES.failed, 500);
      }

      const { data: blob, error: downloadError } = await supabase.storage
        .from(GENERATED_ARTS_BUCKET)
        .download(candidate.path, {}, { signal: request.signal });

      if (downloadError || !blob) {
        if (!isMissingStoredObject(downloadError)) downloadFailures += 1;
        continue;
      }
      if (blob.size <= 0) continue;

      if (blob.size > HISTORY_ZIP_MAX_FILE_BYTES) {
        return jsonError(HISTORY_ZIP_MESSAGES.tooLarge, 400);
      }

      const assessment = assessHistoryZipObject(candidate.path, {
        size: blob.size,
        contentType: blob.type || null,
      });
      if (!assessment.ok) {
        continue;
      }

      if (totalBytes + blob.size > HISTORY_ZIP_MAX_BYTES) {
        return jsonError(HISTORY_ZIP_MESSAGES.tooLarge, 400);
      }

      const bytes = new Uint8Array(await blob.arrayBuffer());
      if (bytes.byteLength !== blob.size || bytes.byteLength !== assessment.size) {
        return jsonError(HISTORY_ZIP_MESSAGES.failed, 500);
      }

      totalBytes += bytes.byteLength;
      ready.push({
        name: historyZipEntryName(ready.length, candidate.stem, assessment.extension),
        bytes,
      });
    }

    if (ready.length === 0) {
      return jsonError(
        downloadFailures === candidates.length ? HISTORY_ZIP_MESSAGES.failed : HISTORY_ZIP_MESSAGES.empty,
        downloadFailures === candidates.length ? 500 : 404
      );
    }

    const stream = streamStoredZip(
      ready.map((file) => ({
        name: file.name,
        load: async () => file.bytes,
      }))
    );

    const filename = historyZipDownloadName();

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return jsonError(HISTORY_ZIP_MESSAGES.failed, 500);
  }
}
