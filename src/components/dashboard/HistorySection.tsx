"use client";

import { useEffect, useRef, useState } from "react";
import { PostCanvas } from "@/components/cards/PostCanvas";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  ImagesIcon,
  SpinnerIcon,
} from "@/components/icons";
import { downloadNodeAsPng } from "@/lib/export-image";
import { formatWeekRange } from "@/lib/date-utils";
import type { CompanyProfile, GeneratedPost, SavedPack } from "@/lib/types";
import { fileNameFor, ScaledPreview } from "./PostCard";

type Props = {
  currentEmail: string;
};

export function HistorySection({ currentEmail }: Props) {
  const [packs, setPacks] = useState<SavedPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCloud, setIsCloud] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [downloadingPackId, setDownloadingPackId] = useState<string | null>(null);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  const canvasMapRef = useRef<Map<string, HTMLDivElement>>(new Map());

  const fetchPacks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (dateFilter) params.set("startDate", `${dateFilter}T00:00:00.000Z`);

      const res = await fetch(`/api/packs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPacks(data.packs || []);
        setIsCloud(Boolean(data.isCloud));
        // Auto-select first pack if none selected
        if (!selectedPackId && data.packs?.length > 0) {
          setSelectedPackId(data.packs[0].id);
        }
      }
    } catch (err) {
      console.warn("Erro ao buscar histórico:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPacks();
  }, [search, dateFilter]);

  const handleDeletePack = async (packId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja remover este pack do histórico?")) return;

    try {
      const res = await fetch(`/api/packs?id=${packId}`, { method: "DELETE" });
      if (res.ok) {
        setPacks((prev) => prev.filter((p) => p.id !== packId));
        if (selectedPackId === packId) {
          setSelectedPackId(null);
        }
      }
    } catch {
      alert("Erro ao excluir pack.");
    }
  };

  const handleDownloadAllFromPack = async (pack: SavedPack, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDownloadingPackId(pack.id);

    const profile: CompanyProfile = {
      name: pack.clientName,
      categoryId: pack.categoryId,
      nicheId: pack.nicheId,
      city: pack.city,
      instagram: pack.instagram,
      toneId: pack.toneId,
      colors: pack.brandColors,
    };

    try {
      for (let i = 0; i < pack.posts.length; i++) {
        const post = pack.posts[i];
        const node = canvasMapRef.current.get(`${pack.id}-${post.id}`);
        if (node) {
          await downloadNodeAsPng(node, fileNameFor(profile, post, i));
          await new Promise((r) => setTimeout(r, 350));
        }
      }
    } finally {
      setDownloadingPackId(null);
    }
  };

  const handleCopyCaption = async (post: GeneratedPost) => {
    const text = `${post.caption}\n\n${post.hashtags.join(" ")}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPostId(post.id);
      setTimeout(() => setCopiedPostId(null), 2000);
    } catch {
      alert("Erro ao copiar.");
    }
  };

  const handleDownloadSingle = async (pack: SavedPack, post: GeneratedPost, index: number) => {
    const profile: CompanyProfile = {
      name: pack.clientName,
      categoryId: pack.categoryId,
      nicheId: pack.nicheId,
      city: pack.city,
      instagram: pack.instagram,
      toneId: pack.toneId,
      colors: pack.brandColors,
    };
    const node = canvasMapRef.current.get(`${pack.id}-${post.id}`);
    if (node) {
      await downloadNodeAsPng(node, fileNameFor(profile, post, index));
    }
  };

  const selectedPack = packs.find((p) => p.id === selectedPackId) || packs[0];

  return (
    <div className="space-y-6">
      {/* Barra de Filtros e Status Apple */}
      <div className="apple-card p-5 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[#1d1d1f] tracking-tight">
              Histórico de Packs e Artes
            </h2>
            <p className="text-xs sm:text-sm text-[#6e6e73]">
              Consulte e baixe novamente as artes organizadas por cliente e data.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                isCloud
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-[#d2d2d7] bg-[#f5f5f7] text-[#6e6e73]"
              }`}
            >
              <span
                className={`size-2 rounded-full ${
                  isCloud ? "bg-emerald-500" : "bg-blue-500"
                }`}
              />
              {isCloud ? "Supabase Cloud Conectado" : "Armazenamento Local Ativo"}
            </span>
          </div>
        </div>

        {/* Inputs de busca e data */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1 border-t border-[#e5e5ea]">
          <div className="sm:col-span-8">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome do cliente, nicho ou cidade..."
              className="field-input text-xs sm:text-sm"
            />
          </div>
          <div className="sm:col-span-4 flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="field-input text-xs sm:text-sm"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter("")}
                className="btn-ghost text-xs py-2 px-3 text-[#6e6e73]"
                title="Limpar filtro de data"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {loading && packs.length === 0 ? (
        <div className="apple-card p-12 text-center space-y-3 bg-white">
          <SpinnerIcon className="size-6 text-[#0071e3] mx-auto" />
          <p className="text-sm text-[#6e6e73]">Carregando histórico de packs...</p>
        </div>
      ) : packs.length === 0 ? (
        <div className="apple-card p-12 text-center space-y-3 bg-white">
          <div className="mx-auto size-12 rounded-full bg-[#f5f5f7] border border-[#d2d2d7] grid place-items-center text-[#86868b]">
            <ImagesIcon className="size-5" />
          </div>
          <h3 className="text-lg font-semibold text-[#1d1d1f]">Nenhum pack encontrado</h3>
          <p className="text-xs sm:text-sm text-[#6e6e73] max-w-sm mx-auto">
            {search || dateFilter
              ? "Nenhum resultado corresponde aos filtros aplicados."
              : "Assim que você gerar seu primeiro pack de posts, ele será salvo automaticamente aqui para consulta e download futuro."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Lista Lateral de Packs */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-semibold text-[#86868b] uppercase tracking-wider px-1">
              Packs Salvos ({packs.length})
            </div>

            <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              {packs.map((pack) => {
                const isSelected = selectedPack?.id === pack.id;
                const formattedDate = new Date(pack.createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={pack.id}
                    onClick={() => setSelectedPackId(pack.id)}
                    className={`p-4 rounded-xl cursor-pointer border transition-all text-left ${
                      isSelected
                        ? "bg-white border-[#0071e3] shadow-md ring-2 ring-[#0071e3]/10"
                        : "bg-white border-[#d2d2d7] hover:border-[#86868b] hover:bg-[#fafafc]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-[#1d1d1f] truncate">
                          {pack.clientName}
                        </h4>
                        <p className="text-xs text-[#6e6e73] truncate">
                          {pack.nicheLabel} · {pack.city}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDeletePack(pack.id, e)}
                        className="text-[#86868b] hover:text-rose-600 text-xs p-1 transition"
                        title="Remover pack"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-[#86868b] border-t border-[#f0f0f2] pt-2">
                      <span>{formattedDate}</span>
                      <span className="font-semibold text-[#0071e3]">
                        {pack.posts?.length || 7} artes
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detalhes do Pack Selecionado (Cards e Downloads) */}
          <div className="lg:col-span-8 space-y-5">
            {selectedPack && (
              <>
                <div className="apple-card p-5 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-[#1d1d1f]">
                        {selectedPack.clientName}
                      </h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#f5f5f7] border border-[#d2d2d7] text-[#6e6e73]">
                        {selectedPack.nicheLabel}
                      </span>
                      {selectedPack.startDate && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20 font-medium">
                          {formatWeekRange(selectedPack.startDate)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6e6e73] mt-0.5">
                      Gerado em{" "}
                      {new Date(selectedPack.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {selectedPack.instagram && ` · @${selectedPack.instagram}`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownloadAllFromPack(selectedPack)}
                    disabled={downloadingPackId === selectedPack.id}
                    className="btn-primary text-xs py-2 px-4"
                  >
                    {downloadingPackId === selectedPack.id ? (
                      <>
                        <SpinnerIcon className="size-3.5" /> Baixando...
                      </>
                    ) : (
                      <>
                        <DownloadIcon className="size-3.5" /> Baixar Todos os {selectedPack.posts.length} PNGs
                      </>
                    )}
                  </button>
                </div>

                {/* Cards do Pack */}
                <div className="space-y-4">
                  {selectedPack.posts.map((post, idx) => {
                    const profile: CompanyProfile = {
                      name: selectedPack.clientName,
                      categoryId: selectedPack.categoryId,
                      nicheId: selectedPack.nicheId,
                      city: selectedPack.city,
                      instagram: selectedPack.instagram,
                      toneId: selectedPack.toneId,
                      colors: selectedPack.brandColors,
                    };

                    return (
                      <article
                        key={post.id}
                        className="apple-card p-4 sm:p-5 bg-white grid gap-4 md:grid-cols-[200px_minmax(0,1fr)] items-start"
                      >
                        {/* Miniatura do Canvas 1080x1080 */}
                        <div className="w-full max-w-[200px] mx-auto">
                          <ScaledPreview>
                            <PostCanvas
                              ref={(node) => {
                                if (node) {
                                  canvasMapRef.current.set(`${selectedPack.id}-${post.id}`, node);
                                } else {
                                  canvasMapRef.current.delete(`${selectedPack.id}-${post.id}`);
                                }
                              }}
                              post={post}
                              profile={profile}
                              index={idx}
                              layout={post.layout}
                            />
                          </ScaledPreview>
                        </div>

                        {/* Conteúdo e Ações */}
                        <div className="flex flex-col justify-between h-full space-y-3">
                          <div>
                            <div className="flex items-center justify-between text-xs text-[#86868b]">
                              <span className="font-semibold uppercase tracking-wider">
                                {post.day}
                              </span>
                              <span>Post {idx + 1} de 5</span>
                            </div>
                            <h4 className="text-base font-semibold text-[#1d1d1f] mt-0.5">
                              {post.headline}
                            </h4>
                            <p className="text-xs text-[#6e6e73] mt-1 line-clamp-3">
                              {post.caption}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#f0f0f2]">
                            <button
                              type="button"
                              onClick={() => handleCopyCaption(post)}
                              className="btn-ghost text-xs py-1.5 px-3"
                            >
                              {copiedPostId === post.id ? (
                                <CheckIcon className="size-3.5 text-emerald-600" />
                              ) : (
                                <CopyIcon className="size-3.5 text-[#6e6e73]" />
                              )}
                              {copiedPostId === post.id ? "Copiada" : "Copiar Legenda"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownloadSingle(selectedPack, post, idx)}
                              className="btn-primary text-xs py-1.5 px-3"
                            >
                              <DownloadIcon className="size-3.5" /> Baixar PNG
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
