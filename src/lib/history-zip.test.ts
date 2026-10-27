import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { unzipSync } from "fflate";
import {
  assessHistoryZipObject,
  HISTORY_ZIP_MAX_BYTES,
  HISTORY_ZIP_MAX_DURATION_SECONDS,
  HISTORY_ZIP_MAX_FILE_BYTES,
  HISTORY_ZIP_MESSAGES,
  historyZipDownloadName,
  historyZipEntryName,
  historyZipFilenameFromDisposition,
  historyZipHref,
  imageExtensionFromOwnedPath,
  isMissingStoredObject,
  isSafeHistoryZipEntryName,
  sanitizeZipEntryStem,
} from "./history-zip";
import { streamStoredZip } from "./history-zip-stream";

const USER = "11111111-1111-4111-8111-111111111111";
const OWNED_PNG = `${USER}/22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333.png`;

describe("history zip names", () => {
  it("monta o link com os mesmos query params do histórico", () => {
    const href = historyZipHref({
      empresa: "11111111-1111-4111-8111-111111111111",
      nicho: "pizzaria",
      periodo: "7d",
      busca: "pizza artesanal",
    });
    assert.equal(
      href,
      "/api/historico/instagram/zip?empresa=11111111-1111-4111-8111-111111111111&nicho=pizzaria&periodo=7d&busca=pizza+artesanal"
    );
  });

  it("usa só a data UTC no nome do download", () => {
    const name = historyZipDownloadName(new Date("2026-10-25T23:30:00.000Z"));
    assert.equal(name, "socialpack-historico-2026-10-25.zip");
    assert.equal(
      historyZipFilenameFromDisposition(`attachment; filename="${name}"`),
      name
    );
    assert.equal(historyZipFilenameFromDisposition('attachment; filename="../../etc/passwd"'), "socialpack-historico.zip");
  });

  it("sanitiza nomes internos e impede path traversal", () => {
    assert.equal(sanitizeZipEntryStem("Promoção / ../etc\\passwd"), "Promocao-etc-passwd");
    assert.equal(sanitizeZipEntryStem("   "), "arte");
    const entry = historyZipEntryName(0, "../../segredo", "png");
    assert.equal(entry, "001-segredo.png");
    assert.equal(isSafeHistoryZipEntryName(entry), true);
    assert.equal(isSafeHistoryZipEntryName("../segredo.png"), false);
    assert.equal(isSafeHistoryZipEntryName("001-ok.png.exe"), false);
    assert.equal(historyZipEntryName(1, "Oferta", "webp"), "002-Oferta.webp");
  });

  it("aceita só png e webp em caminho do próprio prefixo já normalizado", () => {
    assert.equal(imageExtensionFromOwnedPath(OWNED_PNG), "png");
    assert.equal(imageExtensionFromOwnedPath(`${USER}/empresa/arte.webp`), "webp");
    assert.equal(imageExtensionFromOwnedPath(`${USER}/../outro/arte.png`), null);
    assert.equal(imageExtensionFromOwnedPath(`${USER}/empresa/%2e%2e/arte.png`), null);
    assert.equal(imageExtensionFromOwnedPath(`${USER}/empresa/arte.svg`), null);
  });
});

describe("history zip assessment", () => {
  it("trata objeto ausente como vazio e o resto como falha", () => {
    assert.equal(isMissingStoredObject(null), true);
    assert.equal(isMissingStoredObject({ status: 404, message: "Object not found" }), true);
    assert.equal(isMissingStoredObject({ statusCode: "404" }), true);
    assert.equal(isMissingStoredObject({ status: 400, message: "Object not found" }), true);
    assert.equal(isMissingStoredObject({ status: 500, message: "Bucket not found" }), false);
  });

  it("mede png dentro do limite e rejeita tipo ou tamanho", () => {
    assert.deepEqual(assessHistoryZipObject(OWNED_PNG, { size: 1200, contentType: "image/png" }), {
      ok: true,
      extension: "png",
      size: 1200,
    });
    assert.deepEqual(
      assessHistoryZipObject(OWNED_PNG, { size: HISTORY_ZIP_MAX_FILE_BYTES + 1, contentType: "image/png" }),
      { ok: false, reason: "too-large" }
    );
    assert.deepEqual(assessHistoryZipObject(OWNED_PNG, { size: 10, contentType: "text/html" }), {
      ok: false,
      reason: "type",
    });
    assert.deepEqual(assessHistoryZipObject(OWNED_PNG, { size: 10, contentType: "application/octet-stream" }), {
      ok: true,
      extension: "png",
      size: 10,
    });
    assert.deepEqual(assessHistoryZipObject(OWNED_PNG, null), { ok: false, reason: "missing" });
  });
});

describe("history zip stream", () => {
  it("gera um ZIP STORE com nomes únicos e bytes originais", async () => {
    const first = new Uint8Array([1, 2, 3, 4, 255]);
    const second = new Uint8Array([9, 8, 7]);
    const stream = streamStoredZip([
      { name: "001-Oferta.png", load: async () => first },
      { name: "002-Dica.webp", load: async () => second },
    ]);
    const zipped = await readWithTimeout(stream);
    const files = unzipSync(zipped);
    assert.deepEqual(files["001-Oferta.png"], first);
    assert.deepEqual(files["002-Dica.webp"], second);
    assert.equal(Object.keys(files).length, 2);
  });

  it("falha o stream se um download quebra, sem entregar ZIP parcial como sucesso", async () => {
    const stream = streamStoredZip([
      {
        name: "001-arte.png",
        load: async () => {
          throw new Error("storage");
        },
      },
    ]);
    await assert.rejects(readWithTimeout(stream));
  });

  it("recusa nome inseguro antes de começar o stream", () => {
    assert.throws(() => streamStoredZip([{ name: "../x.png", load: async () => new Uint8Array([1]) }]));
  });
});

describe("history zip route", () => {
  it("não usa service role nem URL pública e aplica os filtros do histórico", () => {
    const source = readFileSync(new URL("../app/api/historico/instagram/zip/route.ts", import.meta.url), "utf8");
    assert.equal(source.includes("createAdminClient"), false);
    assert.equal(source.includes("SERVICE_ROLE"), false);
    assert.equal(source.includes("getPublicUrl"), false);
    assert.equal(source.includes("createSignedUrl"), false);
    assert.match(source, /auth\.getUser\(/);
    assert.match(source, /\.eq\("user_id", user\.id\)/);
    assert.match(source, /applyHistoryPostFilters/);
    assert.match(source, /parseHistoryFilters/);
    assert.match(source, /getOwnedStoragePathOrNull/);
    assert.match(source, new RegExp(`export const maxDuration = ${HISTORY_ZIP_MAX_DURATION_SECONDS}`));
    assert.equal(HISTORY_ZIP_MAX_BYTES, 32 * 1024 * 1024);
    assert.match(HISTORY_ZIP_MESSAGES.tooMany, /Refine/);
    assert.match(HISTORY_ZIP_MESSAGES.empty, /Nenhuma arte/);
  });
});

async function readWithTimeout(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("timeout")), 2000);
  });

  for (;;) {
    const { done, value } = await Promise.race([reader.read(), timeout]);
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
  }

  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}
