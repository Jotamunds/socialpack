"use client";

import { useEffect, useState } from "react";
import {
  POSTS_VIEW_STORAGE_KEY,
  parsePostsViewMode,
  type PostsViewMode,
} from "./types";

export function usePostsViewMode(defaultMode: PostsViewMode = "gallery") {
  const [viewMode, setViewModeState] = useState<PostsViewMode>(defaultMode);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(POSTS_VIEW_STORAGE_KEY);
      setViewModeState(parsePostsViewMode(stored) || defaultMode);
    } catch {
      // ambientes restritos
    }
    setHydrated(true);
  }, [defaultMode]);

  function setViewMode(mode: PostsViewMode) {
    setViewModeState(mode);
    try {
      window.localStorage.setItem(POSTS_VIEW_STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  }

  return { viewMode, setViewMode, hydrated };
}
