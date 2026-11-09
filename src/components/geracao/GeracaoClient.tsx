"use client";

import { useState } from "react";
import JSZip from "jszip";
import { getMondayOfWeek } from "@/lib/date-utils";
import { DownloadIcon, SparklesIcon, SpinnerIcon } from "@/components/icons";
import { PostsViewToggle, usePostsViewMode } from "@/components/posts";
import { CompanySelector, type CompanyItem } from "./CompanySelector";
import { WeeklyGrid } from "./WeeklyGrid";
import { PostPreviewModal, type PreviewPostItem } from "./PostPreviewModal";
import { getSignedPostDownloadUrlAction } from "@/app/actions/posts";
import { t } from "@/i18n";

interface GeracaoClientProps {
  companies: CompanyItem[];
  initialPosts?: PreviewPostItem[];
}

export function GeracaoClient({ companies, initialPosts = [] }: GeracaoClientProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    companies[0]?.id || ""
  );
  const [startDate, setStartDate] = useState<string>(getMondayOfWeek());
  const [posts, setPosts] = useState<PreviewPostItem[]>(initialPosts);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [previewPost, setPreviewPost] = useState<PreviewPostItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { viewMode, setViewMode } = usePostsViewMode();

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
  const canGenerate = Boolean(selectedCompanyId && companies.length > 0 && !isGenerating);
  const canDownloadAll = posts.length > 0 && !isGenerating && !isZipping;

  async function handleGenerateWeek() {
    if (!selectedCompanyId) {
      setErrorMessage("Por favor, selecione uma empresa para gerar o pacote.");
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate/weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          startDate,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setErrorMessage(data.error || t("generate.generateFailed"));
        return;
      }

      setPosts(data.posts || []);
    } catch {
      setErrorMessage("Could not reach the server. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDownloadSingle(post: PreviewPostItem) {
    try {
      let downloadUrl = post.signedUrl;

      // Se não tiver signedUrl atualizada, solicita via Server Action
      if (!downloadUrl) {
        const res = await getSignedPostDownloadUrlAction(post.id);
        if (res.ok && res.signedUrl) {
          downloadUrl = res.signedUrl;
        }
      }

      if (!downloadUrl) {
        alert(t("generate.signedUrlFailed"));
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
      alert(t("generate.downloadFailed"));
    }
  }

  async function handleDownloadAllZip() {
    if (posts.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      let captionsDocument = `SOCIALPACK — WEEKLY CAPTIONS (${startDate})\n`;
      captionsDocument += `Company: ${selectedCompany?.name || t("generate.companyLabel")}\n`;
      captionsDocument += `Generated with SocialPack\n`;
      captionsDocument += `${"=".repeat(60)}\n\n`;

      // 1. Processar cada imagem e adicionar ao ZIP
      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        let imgUrl = post.signedUrl;

        if (!imgUrl) {
          const res = await getSignedPostDownloadUrlAction(post.id);
          if (res.ok && res.signedUrl) {
            imgUrl = res.signedUrl;
          }
        }

        if (imgUrl) {
          try {
            const imgRes = await fetch(imgUrl);
            const arrayBuffer = await imgRes.arrayBuffer();
            const fileName = `${i + 1}-${post.day.replace(/[^a-zA-Z0-9]/g, "_")}-${post.theme.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
            zip.file(fileName, arrayBuffer);
          } catch (fetchErr) {
            console.error("Erro ao baixar post para o ZIP:", fetchErr);
          }
        }

        // Acumular textos no arquivo de legendas
        captionsDocument += `DAY ${i + 1}: ${post.day.toUpperCase()} — ${post.theme}\n`;
        captionsDocument += `HEADLINE: ${post.headline}\n`;
        captionsDocument += `CAPTION:\n${post.caption}\n\n`;
        if (post.hashtags && post.hashtags.length > 0) {
          captionsDocument += `HASHTAGS:\n${post.hashtags.join(" ")}\n\n`;
        }
        captionsDocument += `${"-".repeat(60)}\n\n`;
      }

      // 2. Incluir arquivo com as 7 legendas
      zip.file("legendas-da-semana.txt", captionsDocument);

      // 3. Gerar arquivo ZIP e disparar download
      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `socialpack-semana-${startDate}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert(t("generate.zipFailed"));
    } finally {
      setIsZipping(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Topo da Página */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[rgba(255,255,255,0.06)]">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#f7f8f8]">
            {t("generate.title")}
          </h1>
          <p className="text-xs sm:text-sm text-[#8a8f98]">
            {t("generate.subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {(posts.length > 0 || isGenerating) && (
            <PostsViewToggle value={viewMode} onChange={setViewMode} />
          )}
          {canDownloadAll && (
            <button
              type="button"
              onClick={handleDownloadAllZip}
              disabled={isZipping}
              className="min-h-11 sm:h-9 px-4 rounded-md bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.1)] text-[#f7f8f8] text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isZipping ? (
                <SpinnerIcon className="size-3.5 animate-spin text-[#5e6ad2]" />
              ) : (
                <DownloadIcon className="size-3.5" />
              )}
              <span>{isZipping ? t("generate.zipping") : t("generate.downloadZip")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de Controles e Configuração de Geração */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-5 sm:p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
          {/* Seletor de Empresa */}
          <div className="md:col-span-6">
            <CompanySelector
              companies={companies}
              selectedId={selectedCompanyId}
              onSelect={setSelectedCompanyId}
              disabled={isGenerating}
            />
          </div>

          {/* Seletor de Segunda-Feira */}
          <div className="md:col-span-3 space-y-1.5">
            <label htmlFor="start-date" className="text-[11px] font-medium text-[#8a8f98] block">
              {t("generate.weekStart")}
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isGenerating}
              className="w-full min-w-0 min-h-11 sm:h-10 rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.18)] focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2] text-[#f7f8f8] text-xs px-3 transition-colors disabled:opacity-50"
            />
          </div>

          {/* Botão Primário: Gerar Semana */}
          <div className="md:col-span-3">
            <button
              type="button"
              onClick={handleGenerateWeek}
              disabled={!canGenerate}
              className="w-full min-h-11 sm:h-10 rounded-md bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-xs font-semibold transition-all shadow-[0_1px_3px_rgba(0,0,0,0.4)] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <SpinnerIcon className="size-4 animate-spin" />
                  <span>{t("generate.generating")}</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="size-4" />
                  <span>{t("generate.generate")}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Grid com os 7 Posts Semanais */}
      <WeeklyGrid
        posts={posts}
        isGenerating={isGenerating}
        viewMode={viewMode}
        onSelectPost={(post) => setPreviewPost(post)}
        onDownloadPost={handleDownloadSingle}
      />

      {/* Modal de Prévia Ampliada */}
      <PostPreviewModal
        post={previewPost}
        onClose={() => setPreviewPost(null)}
        onDownload={handleDownloadSingle}
      />
    </div>
  );
}
