import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { getSessionEmail } from "@/lib/session";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase";

const ALLOWED_MIME_TYPES = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/jpg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  const email = await getSessionEmail();
  if (!email) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado ou formato inválido." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Tamanho do arquivo excede o limite permitido de 5MB." },
        { status: 400 },
      );
    }

    const mimeType = file.type.toLowerCase();
    const extension = ALLOWED_MIME_TYPES.get(mimeType);

    if (!extension) {
      return NextResponse.json(
        { error: "Formato de arquivo não suportado. Envie JPG, PNG ou WEBP." },
        { status: 400 },
      );
    }

    const uniqueId = randomUUID();
    const safeFilename = `${uniqueId}${extension}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // 1. Tentar upload no Supabase Storage caso configurado
    const supabase = getSupabaseServerClient();
    if (supabase && isSupabaseConfigured()) {
      const buckets = ["user-uploads", "templates-bg"];
      for (const bucket of buckets) {
        try {
          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(safeFilename, fileBuffer, {
              contentType: mimeType,
              upsert: true,
            });

          if (!uploadError) {
            const { data } = supabase.storage.from(bucket).getPublicUrl(safeFilename);
            if (data?.publicUrl) {
              return NextResponse.json({
                url: data.publicUrl,
                filename: safeFilename,
                size: file.size,
                mimeType,
                storage: "supabase",
              });
            }
          }
        } catch {
          // continua para o fallback local
        }
      }
    }

    // 2. Fallback seguro em armazenamento local: public/uploads/
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const targetFilePath = path.join(uploadDir, safeFilename);
    await writeFile(targetFilePath, fileBuffer);

    const publicUrl = `/uploads/${safeFilename}`;

    return NextResponse.json({
      url: publicUrl,
      filename: safeFilename,
      size: file.size,
      mimeType,
      storage: "local",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno ao processar upload.";
    console.error("[SocialPack Upload] Erro:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
