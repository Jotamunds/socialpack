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
      <div className="glass rounded-3xl p-12 text-center space-y-6 animate-fade-up">
        <div className="relative mx-auto size-20 grid place-items-center">
          <div className="absolute inset-0 rounded-full bg-brand-gradient blur-xl opacity-60 animate-pulse" />
          <div className="relative size-16 rounded-2xl bg-brand-gradient grid place-items-center animate-spin text-white">
            <SparklesIcon className="size-8" />
          </div>
        </div>
        <div className="space-y-2 max-w-md mx-auto">
          <h3 className="font-display text-2xl font-bold text-white tracking-tight">
            Criando sua semana de posts...
          </h3>
          <p className="text-sm text-white/60">
            Selecionando temas persuasivos para <span className="text-brand-fuchsia font-semibold">{profile.name}</span>, ajustando copies para o nicho e aplicando suas cores nos templates 1080x1080.
          </p>
        </div>

        {/* Skeleton cards preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-4 opacity-50">
          <div className="h-64 rounded-2xl skeleton" />
          <div className="h-64 rounded-2xl skeleton hidden md:block" />
        </div>
      </div>
    );
  }

  if (!result || result.posts.length === 0) {
    return (
      <div className="glass rounded-3xl p-10 sm:p-14 text-center space-y-5 animate-fade-up">
        <div className="mx-auto size-16 rounded-2xl bg-white/5 border border-white/10 grid place-items-center text-white/50">
          <ImagesIcon className="size-8" />
        </div>
        <div className="space-y-2 max-w-md mx-auto">
          <h3 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
            Nenhum post gerado ainda
          </h3>
          <p className="text-sm text-white/60 leading-relaxed">
            Configure o perfil da sua empresa ao lado e clique em{" "}
            <span className="text-white font-medium">“Gerar Semana de Posts”</span> para criar automaticamente 5 artes modernas 1080x1080 com legendas prontas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6" aria-label="Semana de posts gerada">
      {/* Barra de Ações Superior */}
      <div className="glass rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-amber">
              ✦ 5 Posts Prontos
            </span>
            <span className="text-white/20">•</span>
            <span className="text-xs text-white/70">
              Nicho: <strong className="text-white">{result.nicheLabel}</strong>
            </span>
            <span className="text-white/20">•</span>
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">
              {result.source === "niche"
                ? "Textos exclusivos do nicho"
                : result.source === "mixed"
                ? "Textos do nicho + complementares"
                : "Textos persuasivos gerais adaptados"}
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Cada card está pronto no formato quadrado 1080x1080 para o feed do Instagram.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isGenerating || downloadingAll}
            className="btn-ghost text-xs flex-1 sm:flex-initial"
            title="Sorteia novos textos e combinações visuais"
          >
            <SparklesIcon /> Gerar Outra Semana
          </button>

          <button
            id="btn-download-all"
            type="button"
            onClick={handleDownloadAll}
            disabled={downloadingAll || isGenerating}
            className="btn-primary text-xs py-2.5 px-4 flex-1 sm:flex-initial"
          >
            {downloadingAll ? (
              <>
                <SpinnerIcon /> {downloadProgress || "Baixando..."}
              </>
            ) : (
              <>
                <DownloadIcon /> Baixar Todos os 5 PNGs
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid de 5 Cards */}
      <div className="space-y-6">
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
