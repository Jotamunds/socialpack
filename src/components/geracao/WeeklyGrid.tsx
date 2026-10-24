"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, DownloadIcon, SparklesIcon, SpinnerIcon } from "@/components/icons";
import type { PreviewPostItem } from "./PostPreviewModal";

interface WeeklyGridProps {
  posts: PreviewPostItem[];
  isGenerating: boolean;
  onSelectPost: (post: PreviewPostItem) => void;
  onDownloadPost: (post: PreviewPostItem) => void;
}

export function WeeklyGrid({
  posts,
  isGenerating,
  onSelectPost,
  onDownloadPost,
}: WeeklyGridProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleCopy(post: PreviewPostItem) {
    const text = `${post.caption}\n\n${(post.hashtags || []).join(" ")}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(post.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert("Falha ao copiar legenda.");
    }
  }

  // 1. Estado de Carregamento / Geração em Andamento
  if (isGenerating) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[#5e6ad2]/10 border border-[#5e6ad2]/20 text-[#7170ff] text-xs">
          <SpinnerIcon className="size-4 animate-spin text-[#5e6ad2]" />
          <span>
            <strong>Renderizando pacote semanal...</strong> O Satori e o Resvg estão processando os 7 posts em 1080×1080px e salvando no bucket privado.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.01)] p-4 space-y-3 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-20 bg-[rgba(255,255,255,0.06)] rounded" />
                <div className="h-4 w-16 bg-[rgba(255,255,255,0.04)] rounded-full" />
              </div>
              <div className="w-full aspect-square bg-[rgba(255,255,255,0.03)] rounded-lg flex items-center justify-center">
                <SpinnerIcon className="size-6 text-[#5e6ad2]/40 animate-spin" />
              </div>
              <div className="h-4 w-3/4 bg-[rgba(255,255,255,0.06)] rounded" />
              <div className="h-3 w-1/2 bg-[rgba(255,255,255,0.04)] rounded" />
              <div className="flex gap-2 pt-2">
                <div className="h-8 flex-1 bg-[rgba(255,255,255,0.04)] rounded" />
                <div className="h-8 flex-1 bg-[rgba(255,255,255,0.04)] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Estado Vazio (Nenhum Post Gerado Ainda)
  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.01)] p-12 text-center space-y-4 max-w-2xl mx-auto my-6">
        <div className="size-12 rounded-xl bg-[#0f1011] border border-[rgba(255,255,255,0.08)] text-[#5e6ad2] mx-auto flex items-center justify-center">
          <SparklesIcon className="size-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-[#f7f8f8]">
            Pronto para gerar a semana de posts
          </h3>
          <p className="text-xs text-[#8a8f98] max-w-md mx-auto">
            Selecione a empresa acima, defina a segunda-feira de início e clique em &quot;Gerar Semana (7 Posts)&quot; para criar 7 artes exclusivas com legendas e fotos curadas.
          </p>
        </div>
      </div>
    );
  }

  // 3. Grid dos 7 Posts
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {posts.map((post) => {
        const isCopied = copiedId === post.id;
        const imgUrl = post.signedUrl || post.imageUrl;

        return (
          <div
            key={post.id}
            className="group rounded-xl border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.02)] p-4 space-y-3 transition-all flex flex-col justify-between"
          >
            {/* Topo do Card: Dia e Tema */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#f7f8f8] bg-[#0f1011] px-2 py-0.5 rounded border border-[rgba(255,255,255,0.06)]">
                {post.day}
              </span>
              <span className="text-[11px] font-medium text-[#7170ff] bg-[#5e6ad2]/10 px-2 py-0.5 rounded">
                {post.theme}
              </span>
            </div>

            {/* Imagem do Post com Gatilho para Modal */}
            <button
              type="button"
              onClick={() => onSelectPost(post)}
              className="relative w-full aspect-square rounded-lg overflow-hidden bg-[#08090a] border border-[rgba(255,255,255,0.06)] group-hover:border-[#5e6ad2]/40 transition-all cursor-pointer block"
            >
              {imgUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imgUrl}
                  alt={post.headline}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-[#8a8f98]">
                  Sem prévia
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-xs font-medium text-white px-3 py-1.5 rounded-md bg-black/60 backdrop-blur-xs border border-white/20">
                  Ampliar Arte
                </span>
              </div>
            </button>

            {/* Headline Resumida */}
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-[#f7f8f8] line-clamp-1">
                {post.headline}
              </h4>
              <p className="text-[11px] text-[#8a8f98] line-clamp-2">
                {post.caption}
              </p>
            </div>

            {/* Ações Rápidas */}
            <div className="pt-2 border-t border-[rgba(255,255,255,0.06)] flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(post)}
                className="flex-1 h-8 rounded-md bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] text-[11px] font-medium text-[#d0d6e0] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                title="Copiar Legenda"
              >
                {isCopied ? <CheckIcon className="size-3 text-[#10b981]" /> : <CopyIcon className="size-3" />}
                <span>{isCopied ? "Copiado!" : "Legenda"}</span>
              </button>

              <button
                type="button"
                onClick={() => onDownloadPost(post)}
                className="flex-1 h-8 rounded-md bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-[11px] font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                title="Baixar PNG"
              >
                <DownloadIcon className="size-3" />
                <span>Baixar</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
