"use client";

import type { HistoryPostItem } from "@/app/actions/history";
import { PostCollection, type DisplayPost, type PostsViewMode } from "@/components/posts";

interface HistoryGridProps {
  posts: HistoryPostItem[];
  viewMode: PostsViewMode;
  onSelectPost: (post: HistoryPostItem) => void;
  onDownloadPost: (post: HistoryPostItem) => void;
  onRequestDelete: (post: HistoryPostItem) => void;
  onClearFilters?: () => void;
  filtersActive?: boolean;
}

function toDisplayPost(post: HistoryPostItem): DisplayPost {
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
    imageSrc: post.signedUrl || post.image_url || null,
    companyName: post.company_name,
    createdAt: post.created_at,
  };
}

export function HistoryGrid({
  posts,
  viewMode,
  onSelectPost,
  onDownloadPost,
  onRequestDelete,
  onClearFilters,
  filtersActive = false,
}: HistoryGridProps) {
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
            {filtersActive
              ? "Não encontramos posts correspondentes aos filtros aplicados."
              : "Você ainda não tem artes salvas no Instagram."}
          </p>
        </div>
        {filtersActive && onClearFilters && (
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

  const byId = new Map(posts.map((p) => [p.id, p]));

  return (
    <PostCollection
      posts={posts.map(toDisplayPost)}
      viewMode={viewMode}
      showCompanyMeta
      onSelectPost={(display) => {
        const original = byId.get(display.id);
        if (original) onSelectPost(original);
      }}
      onDownloadPost={(display) => {
        const original = byId.get(display.id);
        if (original) onDownloadPost(original);
      }}
      onDeletePost={(display) => {
        const original = byId.get(display.id);
        if (original) onRequestDelete(original);
      }}
    />
  );
}
