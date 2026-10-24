"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, DownloadIcon } from "@/components/icons";
import type { HistoryPostItem } from "@/app/actions/history";

interface HistoryGridProps {
  posts: HistoryPostItem[];
  onSelectPost: (post: HistoryPostItem) => void;
  onDownloadPost: (post: HistoryPostItem) => void;
  onRequestDelete: (post: HistoryPostItem) => void;
  onClearFilters?: () => void;
}

export function HistoryGrid({
  posts,
  onSelectPost,
  onDownloadPost,
  onRequestDelete,
  onClearFilters,
}: HistoryGridProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleCopy(post: HistoryPostItem) {
    const text = `${post.caption}\n\n${(post.hashtags || []).join(" ")}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(post.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert("Falha ao copiar legenda.");
    }
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.01)] p-12 text-center space-y-4 max-w-lg mx-auto my-8">
        <div className="size-12 rounded-xl bg-[#0f1011] border border-[rgba(255,255,255,0.08)] text-[#8a8f98] mx-auto flex items-center justify-center text-lg">
          📂
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-[#f7f8f8]">
            Nenhuma criação encontrada
          </h3>
          <p className="text-xs text-[#8a8f98]">
            Não encontramos posts correspondentes aos filtros aplicados.
          </p>
        </div>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="h-8 px-3 rounded-md bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.08)] text-xs text-[#d0d6e0] transition-colors cursor-pointer"
          >
            Limpar Filtros
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="grid gap-5"
      style={{
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
      }}
    >
      {posts.map((post) => {
        const isCopied = copiedId === post.id;
        const formattedDate = post.created_at
          ? new Date(post.created_at).toLocaleDateString("pt-BR")
          : post.date || "";

        return (
          <div
            key={post.id}
            className="group rounded-xl border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.02)] p-4 space-y-3 transition-all flex flex-col justify-between"
          >
            {/* Topo do Card: Empresa, Data e Tema */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-[#8a8f98] truncate max-w-[140px]" title={post.company_name}>
                  {post.company_name}
                </span>
                <span className="font-mono text-[#62666d]">{formattedDate}</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-[#7170ff] bg-[#5e6ad2]/10 px-2 py-0.5 rounded truncate">
                  {post.theme}
                </span>
                <span className="text-[10px] font-medium text-[#10b981] bg-[#10b981]/10 px-1.5 py-0.5 rounded">
                  {post.day || "Instagram"}
                </span>
              </div>
            </div>

            {/* Thumbnail com Preview Modal */}
            <button
              type="button"
              onClick={() => onSelectPost(post)}
              className="relative w-full aspect-square rounded-lg overflow-hidden bg-[#08090a] border border-[rgba(255,255,255,0.06)] group-hover:border-[#5e6ad2]/40 transition-all cursor-pointer block"
            >
              {post.signedUrl || post.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.signedUrl || post.image_url || ""}
                  alt={post.headline}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-[#8a8f98]">
                  Sem miniatura
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-xs font-medium text-white px-3 py-1.5 rounded-md bg-black/60 backdrop-blur-xs border border-white/20">
                  Ampliar Arte
                </span>
              </div>
            </button>

            {/* Headline Resumida */}
            <h4 className="text-xs font-semibold text-[#f7f8f8] line-clamp-2 leading-snug">
              {post.headline}
            </h4>

            {/* Ações por Post */}
            <div className="pt-2 border-t border-[rgba(255,255,255,0.06)] flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(post)}
                className="h-8 px-2.5 rounded-md bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] text-[11px] font-medium text-[#d0d6e0] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                title="Copiar Legenda"
              >
                {isCopied ? <CheckIcon className="size-3 text-[#10b981]" /> : <CopyIcon className="size-3" />}
                <span>{isCopied ? "Copiado!" : "Legenda"}</span>
              </button>

              <button
                type="button"
                onClick={() => onDownloadPost(post)}
                className="flex-1 h-8 rounded-md bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-[11px] font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                title="Baixar PNG em Alta Resolução"
              >
                <DownloadIcon className="size-3" />
                <span>Baixar</span>
              </button>

              <button
                type="button"
                onClick={() => onRequestDelete(post)}
                className="size-8 rounded-md bg-[rgba(255,255,255,0.02)] hover:bg-red-500/10 border border-[rgba(255,255,255,0.08)] hover:border-red-500/20 text-[#8a8f98] hover:text-red-400 flex items-center justify-center cursor-pointer transition-colors"
                title="Excluir Post Permanentemente"
              >
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
