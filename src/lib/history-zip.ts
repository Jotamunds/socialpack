import { serializeHistoryFilters, type HistoryPostsFilter } from "@/lib/history-filters";

/**
 * Limites do ZIP do histórico.
 *
 * 30 posts cobre um mês de uma empresa com cerca de um post por dia, com folga
 * para um pacote semanal. 32 MB é o teto da soma dos arquivos: a rota baixa
 * em sequência e desiste antes de responder se o próximo arquivo estourar.
 * Cada arquivo segue o limite do bucket `generated-arts` (5 MB).
 *
 * `maxDuration` na rota precisa ser o literal 60 — o Next lê esse export
 * estaticamente e não acompanha esta constante.
 */
export const HISTORY_ZIP_MAX_POSTS = 30;
export const HISTORY_ZIP_MAX_BYTES = 32 * 1024 * 1024;
export const HISTORY_ZIP_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const HISTORY_ZIP_MAX_DURATION_SECONDS = 60;

export const HISTORY_ZIP_API_PATH = "/api/historico/instagram/zip";
export const GENERATED_ARTS_BUCKET = "generated-arts";

const HISTORY_ZIP_FILENAME = /^socialpack-historico-\d{4}-\d{2}-\d{2}\.zip$/;
const SAFE_ZIP_ENTRY = /^\d{3}-[A-Za-z0-9](?:[A-Za-z0-9-]{0,47})\.(png|webp)$/;
const ENTRY_STEM_MAX = 48;

export const HISTORY_ZIP_MESSAGES = {
  unauthorized: "Faça login para baixar o histórico.",
  subscription: "É necessária uma assinatura ativa para baixar o histórico.",
  empty: "Nenhuma arte encontrada com esses filtros.",
  tooMany: `Há mais de ${HISTORY_ZIP_MAX_POSTS} artes nesse filtro. Refine empresa, nicho, período ou busca e tente de novo.`,
  tooLarge: `As artes desse filtro passam de ${HISTORY_ZIP_MAX_BYTES / (1024 * 1024)} MB. Refine os filtros e tente de novo.`,
  failed: "Não foi possível gerar o ZIP. Tente de novo.",
} as const;

export function historyZipHref(filters: HistoryPostsFilter): string {
  const qs = serializeHistoryFilters(filters).toString();
  return qs ? `${HISTORY_ZIP_API_PATH}?${qs}` : HISTORY_ZIP_API_PATH;
}

/** Nome do download: só data UTC, sem texto vindo do usuário. */
export function historyZipDownloadName(now: Date = new Date()): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const name = `socialpack-historico-${year}-${month}-${day}.zip`;
  if (!HISTORY_ZIP_FILENAME.test(name)) {
    throw new Error("Nome de download inválido.");
  }
  return name;
}

export function historyZipFilenameFromDisposition(header: string | null): string {
  const match = header?.match(/filename="(socialpack-historico-\d{4}-\d{2}-\d{2}\.zip)"/);
  return match?.[1] ?? "socialpack-historico.zip";
}

export function sanitizeZipEntryStem(raw: string): string {
  const ascii = raw.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  const cleaned = ascii
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, ENTRY_STEM_MAX)
    .replace(/-+$/g, "");
  return cleaned || "arte";
}

export function isSafeHistoryZipEntryName(name: string): boolean {
  return SAFE_ZIP_ENTRY.test(name) && !name.includes("..") && !name.includes("/") && !name.includes("\\");
}

export function historyZipEntryName(
  index: number,
  stemSource: string,
  extension: "png" | "webp"
): string {
  if (!Number.isInteger(index) || index < 0 || index > HISTORY_ZIP_MAX_POSTS - 1) {
    throw new Error("Índice de arquivo inválido.");
  }
  const name = `${String(index + 1).padStart(3, "0")}-${sanitizeZipEntryStem(stemSource)}.${extension}`;
  if (!isSafeHistoryZipEntryName(name)) {
    throw new Error("Nome de arquivo inválido.");
  }
  return name;
}

/**
 * Extensão permitida pelo bucket. Rejeita segmento com travessia ou caracteres
 * que o storage poderia reinterpretar.
 */
export function imageExtensionFromOwnedPath(path: string): "png" | "webp" | null {
  if (path.includes("%") || path.includes("?") || path.includes("#") || path.includes("\\") || path.includes("\0")) {
    return null;
  }
  const segments = path.split("/");
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) return null;
  const base = segments[segments.length - 1] ?? "";
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(base) || base.includes("..")) return null;
  const lower = base.toLowerCase();
  if (lower.endsWith(".png")) return "png";
  if (lower.endsWith(".webp")) return "webp";
  return null;
}

export type HistoryZipAssessment =
  | { ok: true; extension: "png" | "webp"; size: number }
  | { ok: false; reason: "missing" | "too-large" | "type" };

export function assessHistoryZipObject(
  path: string,
  info: {
    size?: number;
    contentType?: string | null;
    metadata?: { size?: number; mimetype?: string | null } | null;
  } | null
): HistoryZipAssessment {
  if (!info) return { ok: false, reason: "missing" };

  const pathExtension = imageExtensionFromOwnedPath(path);
  if (!pathExtension) return { ok: false, reason: "type" };

  const rawType = info.contentType || info.metadata?.mimetype || "";
  const contentType = rawType.split(";")[0]?.trim().toLowerCase() ?? "";
  // Sem tipo, ou o fallback genérico do storage, confia na extensão já validada.
  if (contentType && contentType !== "application/octet-stream") {
    const expected = pathExtension === "png" ? "image/png" : "image/webp";
    if (contentType !== expected) return { ok: false, reason: "type" };
  }

  const size = positiveByteSize(info.size) ?? positiveByteSize(info.metadata?.size);
  if (size == null) return { ok: false, reason: "missing" };
  if (size > HISTORY_ZIP_MAX_FILE_BYTES) return { ok: false, reason: "too-large" };
  return { ok: true, extension: pathExtension, size };
}

/** 404 do storage (arquivo apagado) não é falha da rota. */
export function isMissingStoredObject(
  error: { status?: number; statusCode?: string; message?: string } | null | undefined
): boolean {
  if (!error) return true;
  if (error.status === 404 || error.statusCode === "404") return true;
  return (error.message ?? "").toLowerCase().includes("object not found");
}

function positiveByteSize(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) return null;
  return value;
}
