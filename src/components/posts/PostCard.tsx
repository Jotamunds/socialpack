"use client";

import { CheckIcon, CopyIcon, DownloadIcon } from "@/components/icons";
import type { DisplayPost } from "./types";

interface PostCardProps {
  post: DisplayPost;
  isCopied: boolean;
  onSelect: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onDelete?: () => void;
  showCompanyMeta?: boolean;
}

export function PostCard({
  post,
  isCopied,
  onSelect,
  onCopy,
  onDownload,
  onDelete,
  showCompanyMeta = false,
}: PostCardProps) {
  const formattedDate = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString("pt-BR")
    : post.date || "";

  return (
    <div className="group rounded-xl border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.02)] overflow-hidden transition-all flex flex-col">
      <button
        type="button"
        onClick={onSelect}
        className="relative w-full aspect-square overflow-hidden bg-[#08090a] cursor-pointer block"
      >
        {post.imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.imageSrc}
            alt={post.headline}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
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
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2 pointer-events-none">
          <span className="text-[10px] font-semibold text-[#f7f8f8] bg-black/55 backdrop-blur-xs px-2 py-0.5 rounded border border-white/10 truncate max-w-[55%]">
            {showCompanyMeta ? post.companyName || post.day : post.day}
          </span>
          <span className="text-[10px] font-medium text-[#7170ff] bg-[#0f1011]/85 px-2 py-0.5 rounded truncate max-w-[40%]">
            {post.theme}
          </span>
        </div>
      </button>

      <div className="p-3 space-y-2.5 flex flex-col flex-1">
        {showCompanyMeta && (
          <div className="flex items-center justify-between text-[10px] text-[#8a8f98]">
            <span className="truncate">{post.day || "Instagram"}</span>
            <span className="font-mono text-[#62666d]">{formattedDate}</span>
          </div>
        )}
        <h4 className="text-xs font-semibold text-[#f7f8f8] line-clamp-2 leading-snug">
          {post.headline}
        </h4>
        <div className="pt-1 mt-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="h-8 px-2.5 rounded-md bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] text-[11px] font-medium text-[#d0d6e0] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            title="Copiar Legenda"
          >
            {isCopied ? <CheckIcon className="size-3 text-[#10b981]" /> : <CopyIcon className="size-3" />}
            <span>{isCopied ? "Copiado!" : "Legenda"}</span>
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="flex-1 h-8 rounded-md bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-[11px] font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            title="Baixar PNG"
          >
            <DownloadIcon className="size-3" />
            <span>Baixar</span>
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="size-8 rounded-md bg-[rgba(255,255,255,0.02)] hover:bg-red-500/10 border border-[rgba(255,255,255,0.08)] hover:border-red-500/20 text-[#8a8f98] hover:text-red-400 flex items-center justify-center cursor-pointer transition-colors"
              title="Excluir Post"
            >
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
