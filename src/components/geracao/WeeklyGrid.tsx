"use client";

import { SparklesIcon, SpinnerIcon } from "@/components/icons";
import { PostCollection, type DisplayPost, type PostsViewMode } from "@/components/posts";
import type { PreviewPostItem } from "./PostPreviewModal";

interface WeeklyGridProps {
  posts: PreviewPostItem[];
  isGenerating: boolean;
  viewMode: PostsViewMode;
  onSelectPost: (post: PreviewPostItem) => void;
  onDownloadPost: (post: PreviewPostItem) => void;
}

function toDisplayPost(post: PreviewPostItem): DisplayPost {
  return {
    id: post.id,
    day: post.day,
    date: post.date,
    theme: post.theme,
    headline: post.headline,
    subheadline: post.subheadline,
    cta: post.cta,
    caption: post.caption,
    hashtags: post.hashtags,
    layout: post.layout,
    imageSrc: post.signedUrl || post.imageUrl || null,
  };
}

export function WeeklyGrid({
  posts,
  isGenerating,
  viewMode,
  onSelectPost,
  onDownloadPost,
}: WeeklyGridProps) {
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
              className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.01)] overflow-hidden animate-pulse"
            >
              <div className="w-full aspect-square bg-[rgba(255,255,255,0.03)] flex items-center justify-center">
                <SpinnerIcon className="size-6 text-[#5e6ad2]/40 animate-spin" />
              </div>
              <div className="p-3 space-y-2">
                <div className="h-4 w-3/4 bg-[rgba(255,255,255,0.06)] rounded" />
                <div className="h-8 w-full bg-[rgba(255,255,255,0.04)] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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

  const byId = new Map(posts.map((p) => [p.id, p]));

  return (
    <PostCollection
      posts={posts.map(toDisplayPost)}
      viewMode={viewMode}
      onSelectPost={(display) => {
        const original = byId.get(display.id);
        if (original) onSelectPost(original);
      }}
      onDownloadPost={(display) => {
        const original = byId.get(display.id);
        if (original) onDownloadPost(original);
      }}
    />
  );
}
