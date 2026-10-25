"use client";

import { useState } from "react";
import { HistoryFilters } from "./HistoryFilters";
import { HistoryGrid } from "./HistoryGrid";
import { DeletePostModal } from "./DeletePostModal";
import { PostPreviewModal, type PreviewPostItem } from "@/components/geracao/PostPreviewModal";
import type { CompanyItem } from "@/components/geracao/CompanySelector";
import { PostsViewToggle, usePostsViewMode } from "@/components/posts";
import { deletePostOrchestratedAction, type HistoryPostItem } from "@/app/actions/history";
import { getSignedPostDownloadUrlAction } from "@/app/actions/posts";

interface HistoryInstagramClientProps {
  initialPosts: HistoryPostItem[];
  companies: CompanyItem[];
}

export function HistoryInstagramClient({
  initialPosts,
  companies,
}: HistoryInstagramClientProps) {
  const [posts, setPosts] = useState<HistoryPostItem[]>(initialPosts);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");

  const [previewPost, setPreviewPost] = useState<PreviewPostItem | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<HistoryPostItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { viewMode, setViewMode } = usePostsViewMode();

  // Filtragem reativa no cliente
  const filteredPosts = posts.filter((post) => {
    // 1. Filtro por empresa
    if (selectedCompanyId !== "all" && post.company_id !== selectedCompanyId) {
      return false;
    }

    // 2. Filtro por busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchHeadline = post.headline?.toLowerCase().includes(term);
      const matchTheme = post.theme?.toLowerCase().includes(term);
      const matchCaption = post.caption?.toLowerCase().includes(term);
      if (!matchHeadline && !matchTheme && !matchCaption) {
        return false;
      }
    }

    // 3. Filtro por período
    if (selectedPeriod === "7days" && post.created_at) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      if (new Date(post.created_at) < sevenDaysAgo) return false;
    } else if (selectedPeriod === "30days" && post.created_at) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (new Date(post.created_at) < thirtyDaysAgo) return false;
    }

    return true;
  });

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
        setPosts((prev) => prev.filter((p) => p.id !== deleteCandidate.id));
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

  function handleClearFilters() {
    setSelectedCompanyId("all");
    setSearchTerm("");
    setSelectedPeriod("all");
  }

  return (
    <div className="space-y-6">
      {/* Barra de Filtros */}
      <HistoryFilters
        companies={companies}
        selectedCompanyId={selectedCompanyId}
        onCompanyChange={setSelectedCompanyId}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
      />

      {/* Contador de Resultados + toggle de visualização */}
      <div className="flex items-center justify-between gap-3 text-xs text-[#8a8f98] px-1">
        <span>
          Mostrando <strong>{filteredPosts.length}</strong>{" "}
          {filteredPosts.length === 1 ? "arte salva" : "artes salvas"}
        </span>
        <PostsViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      {/* Grid de Postagens */}
      <HistoryGrid
        posts={filteredPosts}
        viewMode={viewMode}
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

      {/* Modal de Prévia Ampliada */}
      <PostPreviewModal
        post={previewPost}
        onClose={() => setPreviewPost(null)}
        onDownload={(p) => handleDownload(p)}
      />

      {/* Modal de Confirmação de Exclusão Destrutiva */}
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
