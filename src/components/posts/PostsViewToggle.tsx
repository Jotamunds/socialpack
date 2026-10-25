"use client";

import { GridIcon, ListIcon } from "@/components/icons";
import type { PostsViewMode } from "./types";

interface PostsViewToggleProps {
  value: PostsViewMode;
  onChange: (mode: PostsViewMode) => void;
}

export function PostsViewToggle({ value, onChange }: PostsViewToggleProps) {
  return (
    <div
      className="inline-flex items-center rounded-md border border-[rgba(255,255,255,0.1)] bg-[#0f1011] p-0.5"
      role="group"
      aria-label="Modo de visualização"
    >
      <button
        type="button"
        onClick={() => onChange("gallery")}
        aria-pressed={value === "gallery"}
        title="Galeria"
        className={`h-8 px-2.5 rounded-[5px] text-[11px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
          value === "gallery"
            ? "bg-[rgba(255,255,255,0.08)] text-[#f7f8f8]"
            : "text-[#8a8f98] hover:text-[#d0d6e0]"
        }`}
      >
        <GridIcon className="size-3.5" />
        <span className="hidden sm:inline">Galeria</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-pressed={value === "list"}
        title="Lista"
        className={`h-8 px-2.5 rounded-[5px] text-[11px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
          value === "list"
            ? "bg-[rgba(255,255,255,0.08)] text-[#f7f8f8]"
            : "text-[#8a8f98] hover:text-[#d0d6e0]"
        }`}
      >
        <ListIcon className="size-3.5" />
        <span className="hidden sm:inline">Lista</span>
      </button>
    </div>
  );
}
