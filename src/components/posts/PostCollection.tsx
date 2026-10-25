"use client";

import { useState } from "react";
import { PostCard } from "./PostCard";
import { PostListRow } from "./PostListRow";
import type { DisplayPost, PostsViewMode } from "./types";

interface PostCollectionProps {
  posts: DisplayPost[];
  viewMode: PostsViewMode;
  onSelectPost: (post: DisplayPost) => void;
  onDownloadPost: (post: DisplayPost) => void;
  onDeletePost?: (post: DisplayPost) => void;
  showCompanyMeta?: boolean;
}

export function PostCollection({
  posts,
  viewMode,
  onSelectPost,
  onDownloadPost,
  onDeletePost,
  showCompanyMeta = false,
}: PostCollectionProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleCopy(post: DisplayPost) {
    const text = `${post.caption}\n\n${(post.hashtags || []).join(" ")}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(post.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert("Falha ao copiar legenda.");
    }
  }

  if (viewMode === "list") {
    return (
      <div className="flex flex-col gap-2.5">
        {posts.map((post) => (
          <PostListRow
            key={post.id}
            post={post}
            isCopied={copiedId === post.id}
            showCompanyMeta={showCompanyMeta}
            onSelect={() => onSelectPost(post)}
            onCopy={() => handleCopy(post)}
            onDownload={() => onDownloadPost(post)}
            onDelete={onDeletePost ? () => onDeletePost(post) : undefined}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          isCopied={copiedId === post.id}
          showCompanyMeta={showCompanyMeta}
          onSelect={() => onSelectPost(post)}
          onCopy={() => handleCopy(post)}
          onDownload={() => onDownloadPost(post)}
          onDelete={onDeletePost ? () => onDeletePost(post) : undefined}
        />
      ))}
    </div>
  );
}
