import "server-only";
import { Zip, ZipPassThrough } from "fflate";
import { isSafeHistoryZipEntryName } from "@/lib/history-zip";

export type HistoryZipSource = {
  name: string;
  load: () => Promise<Uint8Array>;
};

/**
 * ZIP em STORE (PNG/WebP já são comprimidos) emitido em stream.
 * Só um arquivo fica em memória por vez; o consumidor drena os chunks.
 */
export function streamStoredZip(files: readonly HistoryZipSource[]): ReadableStream<Uint8Array> {
  if (files.length === 0) {
    throw new Error("ZIP vazio.");
  }
  for (const file of files) {
    if (!isSafeHistoryZipEntryName(file.name)) {
      throw new Error("Nome de arquivo inválido.");
    }
  }

  const pending: Uint8Array[] = [];
  let wake: (() => void) | null = null;
  let ended = false;
  let failed: Error | null = null;

  const notify = () => {
    const resume = wake;
    wake = null;
    resume?.();
  };

  const fail = (error: unknown) => {
    if (failed) return;
    failed = error instanceof Error ? error : new Error("Falha ao gerar o ZIP.");
    notify();
  };

  return new ReadableStream<Uint8Array>({
    start() {
      const zip = new Zip((err, data, final) => {
        if (failed) return;
        if (err) {
          fail(err);
          return;
        }
        if (data && data.byteLength > 0) pending.push(data.slice());
        if (final) ended = true;
        notify();
      });

      void (async () => {
        try {
          for (const file of files) {
            if (failed) return;
            const bytes = await file.load();
            if (failed) return;
            if (bytes.byteLength === 0) {
              fail(new Error("Arquivo vazio."));
              return;
            }
            const entry = new ZipPassThrough(file.name);
            zip.add(entry);
            entry.push(bytes, true);
          }
          if (!failed) zip.end();
        } catch (error) {
          fail(error);
        }
      })();
    },
    async pull(controller) {
      for (;;) {
        if (failed) {
          controller.error(failed);
          return;
        }
        const chunk = pending.shift();
        if (chunk) {
          controller.enqueue(chunk);
          if (pending.length === 0 && ended) controller.close();
          return;
        }
        if (ended) {
          controller.close();
          return;
        }
        await new Promise<void>((resolve) => {
          wake = resolve;
        });
      }
    },
    cancel() {
      fail(new Error("Download cancelado."));
    },
  });
}
