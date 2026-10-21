"use client";

import { useRef, useState } from "react";
import {
  DownloadIcon,
  ImagesIcon,
  SparklesIcon,
  SpinnerIcon,
} from "@/components/icons";
import { downloadNodeAsPng } from "@/lib/export-image";
import type { CompanyProfile, GenerateResponse } from "@/lib/types";
import { fileNameFor, PostCard } from "./PostCard";

type Props = {
  profile: CompanyProfile;
  result: GenerateResponse | null;
  isGenerating: boolean;
  onRegenerate: () => Promise<void>;
};

export function PostsSection({
  profile,
  result,
  isGenerating,
  onRegenerate,
}: Props) {
  const canvasMapRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState("");

  const registerCanvas = (id: string, node: HTMLDivElement | null) => {
    if (node) {
      canvasMapRef.current.set(id, node);
    } else {
      canvasMapRef.current.delete(id);
    }
  };

  const handleDownloadAll = async () => {
    if (!result || result.posts.length === 0) return;
    setDownloadingAll(true);
    try {
      for (let i = 0; i < result.posts.length; i++) {
        const post = result.posts[i];
        const node = canvasMapRef.current.get(post.id);
        if (node) {
          setDownloadProgress(`Baixando ${i + 1} de ${result.posts.length}...`);
          await downloadNodeAsPng(node, fileNameFor(profile, post, i));
          // Pequena pausa entre downloads para o navegador não bloquear
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    } catch {
      // Ignora erro geral
    } finally {
      setDownloadingAll(false);
      setDownloadProgress("");
    }
  };

  if (isGenerating) {
    return (
      <div className="apple-card p-12 text-center space-y-5 animate-fade-up bg-white">
        <div className="mx-auto size-14 grid place-items-center rounded-full bg-[#f5f5f7] border border-[#d2d2d7]">
          <SpinnerIcon className="size-6 text-[#0071e3]" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="text-xl font-semibold text-[#1d1d1f] tracking-tight">
            Gerando pack semanal...
          </h3>
          <p className="text-xs sm:text-sm text-[#6e6e73] leading-relaxed">
            Formatando textos persuasivos para <span className="font-semibold text-[#1d1d1f]">{profile.name}</span>, calibrando o tom de voz e renderizando os 5 cards 1080x1080.
          </p>
        </div>

        {/* Skeleton cards preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto pt-2">
          <div className="h-60 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] animate-pulse" />
          <div className="h-60 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] animate-pulse hidden md:block" />
        </div>
      </div>
    );
  }

  if (!result || result.posts.length === 0) {
    return (
      <div className="apple-card p-10 sm:p-14 text-center space-y-4 animate-fade-up bg-white">
        <div className="mx-auto size-14 rounded-full bg-[#f5f5f7] border border-[#d2d2d7] grid place-items-center text-[#86868b]">
          <ImagesIcon className="size-6" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h3 className="text-xl font-semibold text-[#1d1d1f] tracking-tight">
            Nenhum pack gerado ainda
          </h3>
          <p className="text-xs sm:text-sm text-[#6e6e73] leading-relaxed">
            Configure o perfil do cliente ao lado e clique em{" "}
            <span className="font-semibold text-[#1d1d1f]">“Gerar Semana de Posts”</span> para criar automaticamente os 5 cards 1080x1080 e as legendas correspondentes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-5" aria-label="Semana de posts gerada">
      {/* Barra de Ações Superior Apple */}
      <div className="apple-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#0071e3] bg-[#0071e3]/10 px-2.5 py-0.5 rounded-full">
              5 Artes Prontas
            </span>
            <span className="text-xs text-[#6e6e73]">
              Nicho: <strong className="text-[#1d1d1f]">{result.nicheLabel}</strong>
            </span>
            <span className="text-xs text-[#86868b]">•</span>
            <span className="text-xs text-[#86868b]">
              {result.source === "niche"
                ? "Textos exclusivos do nicho"
                : result.source === "mixed"
                ? "Textos combinados do nicho"
                : "Textos persuasivos adaptados"}
            </span>
          </div>
          <p className="text-xs text-[#86868b]">
            Formato quadrado 1080x1080px otimizado para o feed do Instagram.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isGenerating || downloadingAll}
            className="btn-ghost text-xs py-2 px-4 flex-1 sm:flex-initial"
            title="Sorteia novos textos e combinações visuais"
          >
            <SparklesIcon className="size-3.5 text-[#6e6e73]" /> Gerar Outra Semana
          </button>

          <button
            id="btn-download-all"
            type="button"
            onClick={handleDownloadAll}
            disabled={downloadingAll || isGenerating}
            className="btn-primary text-xs py-2 px-4 flex-1 sm:flex-initial"
          >
            {downloadingAll ? (
              <>
                <SpinnerIcon className="size-3.5" /> {downloadProgress || "Baixando..."}
              </>
            ) : (
              <>
                <DownloadIcon className="size-3.5" /> Baixar Todos os 5 PNGs
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid de 5 Cards */}
      <div className="space-y-5">
        {result.posts.map((post, idx) => (
          <PostCard
            key={post.id}
            post={post}
            index={idx}
            profile={profile}
            registerCanvas={registerCanvas}
          />
        ))}
      </div>
    </section>
  );
}
