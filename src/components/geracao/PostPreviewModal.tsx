"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, DownloadIcon } from "@/components/icons";

export interface PreviewPostItem {
  id: string;
  day: string;
  date?: string;
  theme: string;
  headline: string;
  subheadline?: string;
  cta: string;
  caption: string;
  hashtags?: string[];
  layout?: number;
  imageUrl?: string | null;
  signedUrl?: string | null;
}

interface PostPreviewModalProps {
  post: PreviewPostItem | null;
  onClose: () => void;
  onDownload: (post: PreviewPostItem) => void;
}

export function PostPreviewModal({ post, onClose, onDownload }: PostPreviewModalProps) {
  const [copied, setCopied] = useState(false);

  if (!post) return null;

  const fullCaption = `${post.caption}\n\n${(post.hashtags || []).join(" ")}`;

  async function handleCopyCaption() {
    try {
      await navigator.clipboard.writeText(fullCaption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Falha ao copiar legenda.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-xl border border-[rgba(255,255,255,0.12)] bg-[#0f1011] shadow-2xl flex flex-col md:flex-row overflow-hidden my-6">
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 z-10 size-8 rounded-full bg-black/60 hover:bg-black/90 text-[#8a8f98] hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
        >
          ✕
        </button>

        {/* Lado Esquerdo: Imagem Renderizada em Alta Resolução */}
        <div className="md:w-1/2 bg-[#08090a] p-6 flex items-center justify-center border-b md:border-b-0 md:border-r border-[rgba(255,255,255,0.08)]">
          {post.signedUrl || post.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.signedUrl || post.imageUrl || ""}
              alt={post.headline}
              className="max-h-[380px] md:max-h-[500px] w-auto aspect-square object-contain rounded-lg border border-[rgba(255,255,255,0.08)] shadow-lg"
            />
          ) : (
            <div className="w-full aspect-square rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-xs text-[#8a8f98]">
              Arte em processamento
            </div>
          )}
        </div>

        {/* Lado Direito: Metadados, Legenda e Ações */}
        <div className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto space-y-5">
          <div className="space-y-4">
            {/* Badges de Topo */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#5e6ad2]/15 text-[#7170ff] border border-[#5e6ad2]/30">
                {post.day}
              </span>
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[rgba(255,255,255,0.05)] text-[#d0d6e0] border border-[rgba(255,255,255,0.08)]">
                Tema: {post.theme}
              </span>
            </div>

            {/* Headline & Subheadline */}
            <div>
              <h3 className="text-lg font-bold text-[#f7f8f8] leading-snug">
                {post.headline}
              </h3>
              {post.subheadline && (
                <p className="text-xs text-[#8a8f98] mt-1">{post.subheadline}</p>
              )}
            </div>

            {/* Caixa da Legenda Formatada */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8a8f98]">
                  Legenda Pronta para o Instagram
                </span>
                <button
                  type="button"
                  onClick={handleCopyCaption}
                  className="text-[11px] text-[#7170ff] hover:text-[#828fff] flex items-center gap-1 font-medium cursor-pointer"
                >
                  {copied ? (
                    <>
                      <CheckIcon className="size-3 text-[#10b981]" />
                      <span className="text-[#10b981]">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon className="size-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3.5 rounded-lg bg-[#08090a] border border-[rgba(255,255,255,0.08)] text-xs text-[#d0d6e0] leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto font-sans select-all">
                {post.caption}
              </div>
            </div>

            {/* Hashtags */}
            {post.hashtags && post.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.hashtags.map((h, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono text-[#7170ff] bg-[#5e6ad2]/10 px-2 py-0.5 rounded"
                  >
                    {h}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Rodapé de Ações */}
          <div className="pt-4 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleCopyCaption}
              className="flex-1 h-9 rounded-md bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] text-xs font-medium text-[#f7f8f8] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              {copied ? <CheckIcon className="size-3.5 text-[#10b981]" /> : <CopyIcon className="size-3.5" />}
              <span>{copied ? "Legenda Copiada!" : "Copiar Legenda"}</span>
            </button>

            <button
              type="button"
              onClick={() => onDownload(post)}
              className="flex-1 h-9 rounded-md bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            >
              <DownloadIcon className="size-3.5" />
              <span>Baixar PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
