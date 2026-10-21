"use client";

import { useEffect, useRef, useState } from "react";
import { CANVAS_SIZE, LAYOUT_NAMES, PostCanvas } from "@/components/cards/PostCanvas";
import { CheckIcon, CopyIcon, DownloadIcon, SpinnerIcon } from "@/components/icons";
import { downloadNodeAsPng, slugify } from "@/lib/export-image";
import type { CompanyProfile, GeneratedPost } from "@/lib/types";

type Props = {
  post: GeneratedPost;
  index: number;
  profile: CompanyProfile;
  registerCanvas: (id: string, node: HTMLDivElement | null) => void;
};

export function fileNameFor(profile: CompanyProfile, post: GeneratedPost, index: number) {
  return `${slugify(profile.name)}-${index + 1}-${slugify(post.day)}.png`;
}

/** Mostra o canvas 1080x1080 reduzido para caber na largura disponível. */
function ScaledPreview({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / CANVAS_SIZE));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white/5">
      <div
        className="absolute top-0 left-0 origin-top-left transition-opacity duration-300"
        style={{ transform: `scale(${scale})`, opacity: scale ? 1 : 0 }}
      >
        {children}
      </div>
    </div>
  );
}

export function PostCard({ post, index, profile, registerCanvas }: Props) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const fullCaption = `${post.caption}\n\n${post.hashtags.join(" ")}`;

  async function handleDownload() {
    if (!canvasRef.current) return;
    setDownloading(true);
    setError("");
    try {
      await downloadNodeAsPng(canvasRef.current, fileNameFor(profile, post, index));
    } catch {
      setError("Não foi possível gerar a imagem. Tente novamente.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullCaption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Seu navegador bloqueou a cópia. Selecione o texto manualmente.");
    }
  }

  return (
    <article
      className="glass animate-fade-up grid gap-5 rounded-3xl p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
      style={{ animationDelay: `${index * 90}ms` }}
      aria-label={`Post de ${post.day}`}
    >
      <div className="group relative">
        <ScaledPreview>
          <PostCanvas
            ref={(node) => {
              canvasRef.current = node;
              registerCanvas(post.id, node);
            }}
            post={post}
            profile={profile}
            index={index}
            layout={post.layout}
          />
        </ScaledPreview>
        <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white/90 backdrop-blur">
          1080 × 1080 · {LAYOUT_NAMES[post.layout]}
        </span>
      </div>

      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-white/45 uppercase">{post.day}</p>
            <h3 className="font-display text-lg font-semibold text-white">{post.theme}</h3>
          </div>
          <span className="grid size-9 place-items-center rounded-full bg-white/5 font-display text-sm font-bold text-white/70">
            {String(index + 1).padStart(2, "0")}
          </span>
        </header>

        <div className="mt-4 max-h-72 flex-1 overflow-y-auto rounded-2xl border border-white/8 bg-black/25 p-4 text-sm leading-relaxed text-white/80 md:max-h-none">
          <p className="whitespace-pre-line">{post.caption}</p>
          <p className="mt-3 break-words text-brand-fuchsia/90">{post.hashtags.join(" ")}</p>
        </div>
        <p className="mt-2 text-right text-[11px] text-white/35">{fullCaption.length} / 2200 caracteres</p>

        {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <button id={`copy-caption-${index + 1}`} type="button" onClick={handleCopy} className="btn-ghost">
            {copied ? <CheckIcon className="text-emerald-400" /> : <CopyIcon />}
            {copied ? "Copiada!" : "Copiar legenda"}
          </button>
          <button id={`download-card-${index + 1}`} type="button" onClick={handleDownload} disabled={downloading} className="btn-primary py-2.5">
            {downloading ? <SpinnerIcon /> : <DownloadIcon />}
            {downloading ? "Gerando…" : "Baixar PNG"}
          </button>
        </div>
      </div>
    </article>
  );
}
