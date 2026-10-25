"use client";

import { CheckIcon, CopyIcon, DownloadIcon } from "@/components/icons";
import type { DisplayPost } from "./types";

interface PostListRowProps {
  post: DisplayPost;
  isCopied: boolean;
  onSelect: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onDelete?: () => void;
  showCompanyMeta?: boolean;
}

export function PostListRow({
  post,
  isCopied,
  onSelect,
  onCopy,
  onDownload,
  onDelete,
  showCompanyMeta = false,
}: PostListRowProps) {
  const formattedDate = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString("pt-BR")
    : post.date || "";

  return (
    <div className="group flex items-center gap-3 sm:gap-4 rounded-xl border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.02)] p-2.5 sm:p-3 transition-colors">
      <button
        type="button"
        onClick={onSelect}
        className="relative shrink-0 size-[72px] sm:size-20 rounded-lg overflow-hidden bg-[#08090a] border border-[rgba(255,255,255,0.06)] cursor-pointer"
        title="Ampliar Arte"
      >
        {post.imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.imageSrc} alt={post.headline} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-[#8a8f98]">
            —
          </div>
        )}
      </button>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          {showCompanyMeta && post.companyName && (
            <span className="text-[#8a8f98] truncate max-w-[120px]" title={post.companyName}>
              {post.companyName}
            </span>
          )}
          <span className="font-semibold text-[#f7f8f8] bg-[#0f1011] px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.06)]">
            {post.day}
          </span>
          <span className="font-medium text-[#7170ff] bg-[#5e6ad2]/10 px-1.5 py-0.5 rounded truncate max-w-[140px]">
            {post.theme}
          </span>
          {formattedDate && (
            <span className="font-mono text-[#62666d] hidden sm:inline">{formattedDate}</span>
          )}
        </div>
        <h4 className="text-xs sm:text-sm font-semibold text-[#f7f8f8] line-clamp-1">
          {post.headline}
        </h4>
        {!showCompanyMeta && post.caption && (
          <p className="text-[11px] text-[#8a8f98] line-clamp-1 hidden sm:block">{post.caption}</p>
        )}
      </div>

      <div className="shrink-0 flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={onCopy}
          className="size-8 sm:h-8 sm:w-auto sm:px-2.5 rounded-md bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] text-[11px] font-medium text-[#d0d6e0] inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          title="Copiar Legenda"
        >
          {isCopied ? <CheckIcon className="size-3 text-[#10b981]" /> : <CopyIcon className="size-3" />}
          <span className="hidden sm:inline">{isCopied ? "Copiado!" : "Legenda"}</span>
        </button>
        <button
          type="button"
          onClick={onDownload}
          className="size-8 sm:h-8 sm:w-auto sm:px-3 rounded-md bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-[11px] font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          title="Baixar PNG"
        >
          <DownloadIcon className="size-3" />
          <span className="hidden sm:inline">Baixar</span>
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
  );
}
