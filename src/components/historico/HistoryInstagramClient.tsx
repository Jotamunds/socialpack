"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { HistoryFilters } from "./HistoryFilters";
import { HistoryGrid } from "./HistoryGrid";
import { DeletePostModal } from "./DeletePostModal";
import { PostPreviewModal, type PreviewPostItem } from "@/components/geracao/PostPreviewModal";
import type { CompanyItem } from "@/components/geracao/CompanySelector";
import { PostsViewToggle, usePostsViewMode } from "@/components/posts";
import { deletePostOrchestratedAction, type HistoryPostItem } from "@/app/actions/history";
import { getSignedPostDownloadUrlAction } from "@/app/actions/posts";
import {
  hasActiveHistoryFilters,
  serializeHistoryFilters,
  type HistoryNicheOption,
  type HistoryPeriod,
  type HistoryPostsFilter,
} from "@/lib/history-filters";

interface HistoryInstagramClientProps {
  initialPosts: HistoryPostItem[];
  companies: CompanyItem[];
  niches: HistoryNicheOption[];
  filters: HistoryPostsFilter;
}

type FilterDraft = {
  empresa: string;
  nicho: string;
  periodo: "" | HistoryPeriod;
  busca: string;
};

function toHistoryFilters(draft: FilterDraft): HistoryPostsFilter {
  const next: HistoryPostsFilter = {};
  const busca = draft.busca.trim();
  if (draft.empresa) next.empresa = draft.empresa;
  if (draft.nicho) next.nicho = draft.nicho;
  if (draft.periodo) next.periodo = draft.periodo;
  if (busca) next.busca = busca;
  return next;
}

function draftMatchesFilters(draft: FilterDraft, filters: HistoryPostsFilter): boolean {
  return (
    draft.empresa === (filters.empresa ?? "") &&
    draft.nicho === (filters.nicho ?? "") &&
    draft.periodo === (filters.periodo ?? "") &&
    draft.busca === (filters.busca ?? "")
  );
}

export function HistoryInstagramClient({
  initialPosts,
  companies,
  niches,
  filters,
}: HistoryInstagramClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [posts, setPosts] = useState<HistoryPostItem[]>(initialPosts);
  const [syncedPosts, setSyncedPosts] = useState(initialPosts);
  const [draft, setDraft] = useState<FilterDraft | null>(null);

  const [previewPost, setPreviewPost] = useState<PreviewPostItem | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<HistoryPostItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { viewMode, setViewMode } = usePostsViewMode();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (syncedPosts !== initialPosts) {
    setSyncedPosts(initialPosts);
    setPosts(initialPosts);
    setPreviewPost((current) =>
      current && initialPosts.some((post) => post.id === current.id) ? current : null
    );
    if (!isDeleting) {
      setDeleteCandidate((current) =>
        current && initialPosts.some((post) => post.id === current.id) ? current : null
      );
    }
  }

  if (draft && draftMatchesFilters(draft, filters)) {
    setDraft(null);
  }

  const empresa = draft?.empresa ?? filters.empresa ?? "";
  const nicho = draft?.nicho ?? filters.nicho ?? "";
  const periodo = draft?.periodo ?? filters.periodo ?? "";
  const busca = draft?.busca ?? filters.busca ?? "";

  const navigate = useCallback(
    (next: HistoryPostsFilter, mode: "push" | "replace") => {
      const qs = serializeHistoryFilters(next).toString();
      const href = qs ? `${pathname}?${qs}` : pathname;
      if (mode === "replace") router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    },
    [pathname, router]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function cancelBuscaTimer() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function publish(nextDraft: FilterDraft, mode: "push" | "replace") {
    cancelBuscaTimer();
    const next = toHistoryFilters(nextDraft);
    if (serializeHistoryFilters(next).toString() === serializeHistoryFilters(filters).toString()) {
      setDraft(null);
      return;
    }
    setDraft(nextDraft);
    navigate(next, mode);
  }

  function handleEmpresaChange(value: string) {
    publish({ empresa: value, nicho, periodo, busca }, "push");
  }

  function handleNichoChange(value: string) {
    publish({ empresa, nicho: value, periodo, busca }, "push");
  }

  function handlePeriodoChange(value: string) {
    const nextPeriodo: "" | HistoryPeriod = value === "7d" || value === "30d" ? value : "";
    publish({ empresa, nicho, periodo: nextPeriodo, busca }, "push");
  }

  function handleBuscaChange(value: string) {
    const nextDraft: FilterDraft = { empresa, nicho, periodo, busca: value };
    setDraft(nextDraft);
    cancelBuscaTimer();
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      publish(nextDraft, "replace");
    }, 400);
  }

  function handleBuscaCommit() {
    publish({ empresa, nicho, periodo, busca: busca.trim() }, "push");
  }

  function handleClearFilters() {
    publish({ empresa: "", nicho: "", periodo: "", busca: "" }, "push");
  }

  async function handleDownload(post: { id: string; day: string; signedUrl?: string | null }) {
    try {
      let downloadUrl = post.signedUrl;

      if (!downloadUrl) {
        const res = await getSignedPostDownloadUrlAction(post.id);
        if (res.ok && res.signedUrl) {
          downloadUrl = res.signedUrl;
        }
      }

      if (!downloadUrl) {
        alert("Não foi possível gerar a URL de download para esta arte.");
        return;
      }

      const res = await fetch(downloadUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `socialpack-${post.day.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert("Erro ao realizar o download da imagem.");
    }
  }

  async function handleConfirmDelete() {
    if (!deleteCandidate) return;

    setIsDeleting(true);
    try {
      const result = await deletePostOrchestratedAction(deleteCandidate.id);
      if (result.ok) {
        setPosts((prev) => prev.filter((post) => post.id !== deleteCandidate.id));
        setDeleteCandidate(null);
      } else {
        alert(result.message || "Falha ao excluir o post.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro inesperado ao excluir.";
      alert(msg);
    } finally {
      setIsDeleting(false);
    }
  }

  const canClear = draft !== null || hasActiveHistoryFilters(filters);

  return (
    <div className="space-y-6">
      <HistoryFilters
        companies={companies}
        niches={niches}
        empresa={empresa}
        nicho={nicho}
        periodo={periodo}
        busca={busca}
        canClear={canClear}
        onEmpresaChange={handleEmpresaChange}
        onNichoChange={handleNichoChange}
        onPeriodoChange={handlePeriodoChange}
        onBuscaChange={handleBuscaChange}
        onBuscaCommit={handleBuscaCommit}
        onClear={handleClearFilters}
      />

      <div className="flex items-center justify-between gap-3 text-xs text-[#8a8f98] px-1">
        <span>
          Mostrando <strong>{posts.length}</strong>{" "}
          {posts.length === 1 ? "arte salva" : "artes salvas"}
        </span>
        <PostsViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      <HistoryGrid
        posts={posts}
        viewMode={viewMode}
        filtersActive={hasActiveHistoryFilters(filters)}
        onSelectPost={(post) =>
          setPreviewPost({
            id: post.id,
            day: post.day,
            date: post.date || undefined,
            theme: post.theme,
            headline: post.headline,
            subheadline: post.subheadline || undefined,
            cta: post.cta,
            caption: post.caption,
            hashtags: post.hashtags,
            signedUrl: post.signedUrl,
            imageUrl: post.image_url,
          })
        }
        onDownloadPost={(post) => handleDownload(post)}
        onRequestDelete={(post) => setDeleteCandidate(post)}
        onClearFilters={handleClearFilters}
      />

      <PostPreviewModal
        post={previewPost}
        onClose={() => setPreviewPost(null)}
        onDownload={(post) => handleDownload(post)}
      />

      <DeletePostModal
        isOpen={Boolean(deleteCandidate)}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        postTitle={deleteCandidate?.headline}
      />
    </div>
  );
}
