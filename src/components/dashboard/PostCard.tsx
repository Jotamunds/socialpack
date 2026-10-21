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
  viewMode?: "timeline" | "grid";
  onUpdatePost?: (updatedPost: GeneratedPost) => void;
};

export function fileNameFor(profile: CompanyProfile, post: GeneratedPost, index: number) {
  return `${slugify(profile.name)}-${index + 1}-${slugify(post.day)}.png`;
}

/** Mostra o canvas 1080x1080 reduzido para caber na largura disponível. */
export function ScaledPreview({ children }: { children: React.ReactNode }) {
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
    <div ref={wrapperRef} className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#f5f5f7] border border-[#d2d2d7]">
      <div
        className="absolute top-0 left-0 origin-top-left transition-opacity duration-300"
        style={{ transform: `scale(${scale})`, opacity: scale ? 1 : 0 }}
      >
        {children}
      </div>
    </div>
  );
}

export function PostCard({
  post,
  index,
  profile,
  registerCanvas,
  viewMode = "timeline",
  onUpdatePost,
}: Props) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [isEditingText, setIsEditingText] = useState(false);

  // Estados locais para o formulário de edição de conteúdo
  const [editHeadline, setEditHeadline] = useState(post.customHeadline || post.headline);
  const [editSubheadline, setEditSubheadline] = useState(post.customSubheadline || post.subheadline);
  const [editCta, setEditCta] = useState(post.customCta || post.cta);
  const [editHandle, setEditHandle] = useState(post.customHandle || (profile.instagram ? `@${profile.instagram}` : profile.name));
  const [editCaption, setEditCaption] = useState(post.caption);

  useEffect(() => {
    setEditHeadline(post.customHeadline || post.headline);
    setEditSubheadline(post.customSubheadline || post.subheadline);
    setEditCta(post.customCta || post.cta);
    setEditHandle(post.customHandle || (profile.instagram ? `@${profile.instagram}` : profile.name));
    setEditCaption(post.caption);
  }, [post, profile]);

  const fullCaption = `${post.caption}\n\n${post.hashtags.join(" ")}`;
  const isGrid = viewMode === "grid";

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

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Por favor selecione um arquivo de imagem (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 5MB.");
      return;
    }

    // 1. Preview imediato no canvas para UX instantânea
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl && onUpdatePost) {
        onUpdatePost({
          ...post,
          imageUrl: dataUrl,
          isCustomized: true,
        });
      }
    };
    reader.readAsDataURL(file);

    // 2. Upload seguro para o Supabase Storage ou storage local /api/upload
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url && onUpdatePost) {
          onUpdatePost({
            ...post,
            imageUrl: data.url,
            isCustomized: true,
          });
        }
      }
    } catch {
      // mantém o preview local se o upload falhar
    }

    e.target.value = "";
  };

  const handleRemovePhoto = () => {
    if (onUpdatePost) {
      onUpdatePost({
        ...post,
        imageUrl: undefined,
      });
    }
  };

  const handleSaveText = () => {
    if (onUpdatePost) {
      onUpdatePost({
        ...post,
        customHeadline: editHeadline.trim() || post.headline,
        customSubheadline: editSubheadline.trim() || post.subheadline,
        customCta: editCta.trim() || post.cta,
        customHandle: editHandle.trim() || undefined,
        caption: editCaption.trim() || post.caption,
        isCustomized: true,
      });
    }
    setIsEditingText(false);
  };

  const handleResetCustomizations = () => {
    if (onUpdatePost) {
      onUpdatePost({
        ...post,
        customHeadline: undefined,
        customSubheadline: undefined,
        customCta: undefined,
        customHandle: undefined,
        imageUrl: undefined,
        isCustomized: false,
      });
    }
    setEditHeadline(post.headline);
    setEditSubheadline(post.subheadline);
    setEditCta(post.cta);
    setEditHandle(profile.instagram ? `@${profile.instagram}` : profile.name);
    setEditCaption(post.caption);
    setIsEditingText(false);
  };

  const hasCustomization = Boolean(post.isCustomized || post.imageUrl || post.customHeadline);

  // Renderização 1: Modo Grade (Cards verticais em estilo feed / galeria visual)
  if (isGrid) {
    return (
      <>
        <article
          id={`post-card-${post.id}`}
          className="apple-card animate-fade-up bg-white p-4 sm:p-5 flex flex-col justify-between h-full space-y-4 hover:border-[#86868b] transition-all scroll-mt-24 relative"
          style={{ animationDelay: `${index * 45}ms` }}
          aria-label={`Post de ${post.day}`}
        >
          {/* Arte 1080x1080 em destaque total no topo */}
          <div className="group relative w-full">
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
            <div className="pointer-events-none absolute top-2.5 left-2.5 flex items-center gap-1.5">
              <span className="rounded-full bg-white/90 border border-[#d2d2d7] px-2 py-0.5 text-[10px] font-semibold text-[#1d1d1f] shadow-xs backdrop-blur">
                {LAYOUT_NAMES[post.layout % LAYOUT_NAMES.length]}
              </span>
              {hasCustomization && (
                <span className="rounded-full bg-[#0071e3] text-white px-2 py-0.5 text-[10px] font-semibold shadow-xs">
                  Editado
                </span>
              )}
            </div>
          </div>

          {/* Mini-painel discreto de customização */}
          <div className="flex items-center justify-between gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setIsEditingText(true)}
              className="btn-ghost py-1 px-2.5 text-[11px] flex-1 text-[#1d1d1f]"
              title="Personalizar títulos e textos"
            >
              ✏️ Editar Texto
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-ghost py-1 px-2.5 text-[11px] flex-1 text-[#1d1d1f]"
              title="Fazer upload de foto do cliente"
            >
              📷 Foto
            </button>
            {post.imageUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-[11px] text-[#86868b] hover:text-rose-600 px-1"
                title="Remover foto personalizada"
              >
                ✕
              </button>
            )}
          </div>

          {/* Metadados e Prévia da Legenda */}
          <div className="flex flex-col justify-between flex-1 space-y-3">
            <header className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20">
                  {post.day}
                </span>
                <h3 className="text-sm sm:text-base font-semibold text-[#1d1d1f] mt-1.5 truncate tracking-tight" title={post.customHeadline || post.headline}>
                  {post.customHeadline || post.headline}
                </h3>
              </div>
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#f5f5f7] border border-[#d2d2d7] text-xs font-bold text-[#6e6e73]">
                {String(index + 1).padStart(2, "0")}
              </span>
            </header>

            <div className="rounded-xl border border-[#e5e5ea] bg-[#f5f5f7] p-2.5 sm:p-3 text-xs leading-relaxed text-[#1d1d1f]">
              <p className="line-clamp-3 whitespace-pre-line text-[#424245]">
                {post.caption}
              </p>
              <p className="mt-1.5 truncate text-[#0071e3] font-medium text-[11px]">
                {post.hashtags.slice(0, 3).join(" ")}
                {post.hashtags.length > 3 && ` +${post.hashtags.length - 3}`}
              </p>
            </div>

            {error && <p className="text-[11px] text-rose-600">{error}</p>}

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#f0f0f2]">
              <button
                id={`copy-caption-${index + 1}`}
                type="button"
                onClick={handleCopy}
                className="btn-ghost py-1.5 px-2 text-xs"
                title="Copiar legenda completa com hashtags"
              >
                {copied ? <CheckIcon className="text-emerald-600 size-3.5" /> : <CopyIcon className="size-3.5 text-[#6e6e73]" />}
                {copied ? "Copiada" : "Copiar"}
              </button>
              <button
                id={`download-card-${index + 1}`}
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="btn-primary py-1.5 px-2 text-xs"
                title="Baixar arte em PNG 1080x1080"
              >
                {downloading ? <SpinnerIcon className="size-3.5" /> : <DownloadIcon className="size-3.5" />}
                {downloading ? "Gerando…" : "Baixar"}
              </button>
            </div>
          </div>
        </article>

        {/* Input invisível para upload de imagem */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handlePhotoSelect}
        />

        {/* Modal de Customização de Conteúdo */}
        {isEditingText && renderEditModal()}
      </>
    );
  }

  // Renderização 2: Modo Linha do Tempo (Card horizontal detalhado com espaço completo)
  return (
    <>
      <article
        id={`post-card-${post.id}`}
        className="apple-card animate-fade-up grid gap-5 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] bg-white scroll-mt-24 relative"
        style={{ animationDelay: `${index * 60}ms` }}
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
          <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-2">
            <span className="rounded-full bg-white/90 border border-[#d2d2d7] px-2.5 py-0.5 text-[11px] font-semibold text-[#1d1d1f] shadow-sm backdrop-blur">
              1080 × 1080 · {LAYOUT_NAMES[post.layout % LAYOUT_NAMES.length]}
            </span>
            {hasCustomization && (
              <span className="rounded-full bg-[#0071e3] text-white px-2 py-0.5 text-[10px] font-semibold shadow-xs">
                Editado
              </span>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-between">
          <header className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20">
                  {post.day}
                </span>
                <span className="text-xs text-[#86868b]">• Post {index + 1} de 7</span>
              </div>
              <h3 className="text-lg font-semibold text-[#1d1d1f] mt-1 tracking-tight">
                {post.customHeadline || post.headline}
              </h3>
            </div>
            <span className="grid size-8 place-items-center rounded-full bg-[#f5f5f7] border border-[#d2d2d7] text-xs font-bold text-[#6e6e73]">
              {String(index + 1).padStart(2, "0")}
            </span>
          </header>

          {/* Mini-painel discreto de customização na timeline */}
          <div className="flex items-center gap-2 my-2.5">
            <button
              type="button"
              onClick={() => setIsEditingText(true)}
              className="btn-ghost py-1 px-3 text-xs text-[#1d1d1f]"
            >
              ✏️ Editar Texto
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-ghost py-1 px-3 text-xs text-[#1d1d1f]"
            >
              📷 Trocar Foto
            </button>
            {post.imageUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-xs text-[#86868b] hover:text-rose-600 px-1.5"
              >
                Remover foto personalizada
              </button>
            )}
          </div>

          <div className="mt-1 max-h-72 flex-1 overflow-y-auto rounded-xl border border-[#e5e5ea] bg-[#f5f5f7] p-3.5 text-xs sm:text-sm leading-relaxed text-[#1d1d1f] md:max-h-none">
            <p className="whitespace-pre-line">{post.caption}</p>
            <p className="mt-3 break-words text-[#0071e3] font-medium">{post.hashtags.join(" ")}</p>
          </div>
          <p className="mt-1.5 text-right text-[11px] text-[#86868b]">{fullCaption.length} / 2200 caracteres</p>

          {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}

          <div className="mt-3.5 grid grid-cols-2 gap-2.5">
            <button id={`copy-caption-${index + 1}`} type="button" onClick={handleCopy} className="btn-ghost py-2">
              {copied ? <CheckIcon className="text-emerald-600 size-4" /> : <CopyIcon className="size-4 text-[#6e6e73]" />}
              {copied ? "Copiada!" : "Copiar legenda"}
            </button>
            <button id={`download-card-${index + 1}`} type="button" onClick={handleDownload} disabled={downloading} className="btn-primary py-2">
              {downloading ? <SpinnerIcon className="size-4" /> : <DownloadIcon className="size-4" />}
              {downloading ? "Gerando…" : "Baixar PNG"}
            </button>
          </div>
        </div>
      </article>

      {/* Input invisível para upload de imagem */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handlePhotoSelect}
      />

      {/* Modal de Customização de Conteúdo */}
      {isEditingText && renderEditModal()}
    </>
  );

  function renderEditModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
        <div className="apple-card bg-white p-6 sm:p-7 max-w-lg w-full space-y-4 shadow-2xl border border-[#d2d2d7] animate-scale-up">
          <div className="flex items-center justify-between border-b border-[#e5e5ea] pb-3">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0071e3]">
                {post.day} · Template: {LAYOUT_NAMES[post.layout % LAYOUT_NAMES.length]}
              </span>
              <h3 className="text-lg font-semibold text-[#1d1d1f]">Editar Conteúdo da Arte</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingText(false)}
              className="text-[#86868b] hover:text-[#1d1d1f] text-sm p-1"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <label className="field-label">Título da Arte (Headline)</label>
              <input
                type="text"
                value={editHeadline}
                onChange={(e) => setEditHeadline(e.target.value)}
                className="field-input text-xs sm:text-sm"
                placeholder="Ex: Título chamativo..."
              />
            </div>

            <div>
              <label className="field-label">Frase de Apoio (Subheadline)</label>
              <textarea
                rows={2}
                value={editSubheadline}
                onChange={(e) => setEditSubheadline(e.target.value)}
                className="field-input text-xs sm:text-sm"
                placeholder="Ex: Frase de suporte ao título..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Chamada (CTA)</label>
                <input
                  type="text"
                  value={editCta}
                  onChange={(e) => setEditCta(e.target.value)}
                  className="field-input text-xs sm:text-sm"
                  placeholder="Ex: Saiba mais"
                />
              </div>
              <div>
                <label className="field-label">Assinatura (@Handle)</label>
                <input
                  type="text"
                  value={editHandle}
                  onChange={(e) => setEditHandle(e.target.value)}
                  className="field-input text-xs sm:text-sm"
                  placeholder="Ex: @suaempresa"
                />
              </div>
            </div>

            <div>
              <label className="field-label">Legenda Completa do Instagram</label>
              <textarea
                rows={4}
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                className="field-input text-xs sm:text-sm"
                placeholder="Texto que acompanhará o post no Instagram..."
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#e5e5ea]">
            <button
              type="button"
              onClick={handleResetCustomizations}
              className="btn-ghost text-xs py-1.5 px-3 text-[#86868b] hover:text-rose-600"
            >
              Restaurar Original
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditingText(false)}
                className="btn-ghost text-xs py-1.5 px-4"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveText}
                className="btn-primary text-xs py-1.5 px-4"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
