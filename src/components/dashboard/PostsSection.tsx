"use client";

import { useRef, useState } from "react";
import {
  CalendarIcon,
  DownloadIcon,
  GridIcon,
  ImagesIcon,
  SparklesIcon,
  SpinnerIcon,
  TimelineIcon,
} from "@/components/icons";
import { formatWeekRange, getNextMonday } from "@/lib/date-utils";
import { downloadNodeAsPng } from "@/lib/export-image";
import type { CompanyProfile, GenerateResponse, GeneratedPost } from "@/lib/types";
import { fileNameFor, PostCard } from "./PostCard";

type Props = {
  profile: CompanyProfile;
  result: GenerateResponse | null;
  isGenerating: boolean;
  onRegenerate: (date?: string) => Promise<void>;
  startDate: string;
  onStartDateChange: (date: string) => void;
  onUpdatePost?: (updatedPost: GeneratedPost) => void;
};

export function PostsSection({
  profile,
  result,
  isGenerating,
  onRegenerate,
  startDate,
  onStartDateChange,
  onUpdatePost,
}: Props) {
  const canvasMapRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState("");
  const [viewMode, setViewMode] = useState<"timeline" | "grid">("timeline");
  const [activeDayId, setActiveDayId] = useState<string | null>(null);

  const registerCanvas = (id: string, node: HTMLDivElement | null) => {
    if (node) {
      canvasMapRef.current.set(id, node);
    } else {
      canvasMapRef.current.delete(id);
    }
  };

  const handleDownloadAll = async () => {
    if (!result || result.posts.length === 0) return;
    setDownloadingAll(true);
    try {
      for (let i = 0; i < result.posts.length; i++) {
        const post = result.posts[i];
        const node = canvasMapRef.current.get(post.id);
        if (node) {
          setDownloadProgress(`Baixando ${i + 1} de ${result.posts.length}...`);
          await downloadNodeAsPng(node, fileNameFor(profile, post, i));
          // Pequena pausa entre downloads para o navegador não bloquear
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    } catch {
      // Ignora erro geral
    } finally {
      setDownloadingAll(false);
      setDownloadProgress("");
    }
  };

  const scrollToPost = (id: string) => {
    setActiveDayId(id);
    const el = document.getElementById(`post-card-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleNextWeek = () => {
    const nextMon = getNextMonday(startDate);
    onStartDateChange(nextMon);
    onRegenerate(nextMon);
  };

  if (isGenerating) {
    return (
      <div className="apple-card p-12 text-center space-y-5 animate-fade-up bg-white">
        <div className="mx-auto size-14 grid place-items-center rounded-full bg-[#f5f5f7] border border-[#d2d2d7]">
          <SpinnerIcon className="size-6 text-[#0071e3]" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="text-xl font-semibold text-[#1d1d1f] tracking-tight">
            Gerando calendário editorial semanal...
          </h3>
          <p className="text-xs sm:text-sm text-[#6e6e73] leading-relaxed">
            Formatando os textos para <span className="font-semibold text-[#1d1d1f]">{profile.name}</span>, calculando as 7 datas de Segunda a Domingo e renderizando as 7 artes 1080x1080.
          </p>
        </div>

        {/* Skeleton cards preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto pt-2">
          <div className="h-60 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] animate-pulse" />
          <div className="h-60 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] animate-pulse hidden md:block" />
        </div>
      </div>
    );
  }

  if (!result || result.posts.length === 0) {
    return (
      <div className="apple-card p-10 sm:p-14 text-center space-y-4 animate-fade-up bg-white">
        <div className="mx-auto size-14 rounded-full bg-[#f5f5f7] border border-[#d2d2d7] grid place-items-center text-[#86868b]">
          <CalendarIcon className="size-6" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h3 className="text-xl font-semibold text-[#1d1d1f] tracking-tight">
            Nenhum calendário gerado ainda
          </h3>
          <p className="text-xs sm:text-sm text-[#6e6e73] leading-relaxed">
            Selecione a semana e ajuste o perfil da empresa ao lado e clique em{" "}
            <span className="font-semibold text-[#1d1d1f]">“Gerar Semana de Posts”</span> para criar o cronograma editorial completo com as 7 artes e legendas para os 7 dias da semana.
          </p>
        </div>
      </div>
    );
  }

  const rangeLabel = result.weekRangeLabel || formatWeekRange(startDate);

  return (
    <section className="space-y-5" aria-label="Calendário editorial gerado">
      {/* Barra de Ações Superior Apple */}
      <div className="apple-card p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#0071e3] bg-[#0071e3]/10 border border-[#0071e3]/20 px-2.5 py-0.5 rounded-full">
              7 Artes Prontas (Segunda a Domingo)
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#1d1d1f] bg-[#f5f5f7] border border-[#d2d2d7] px-2.5 py-0.5 rounded-full">
              <CalendarIcon className="size-3 text-[#6e6e73]" />
              Semana de {rangeLabel}
            </span>
            <span className="text-xs text-[#86868b]">
              Nicho: <strong className="text-[#1d1d1f]">{result.nicheLabel}</strong>
            </span>
          </div>
          <p className="text-xs text-[#86868b]">
            Formato 1080x1080px otimizado para o feed do Instagram com datas reais programadas.
          </p>
        </div>

        {/* Controles de visualização e downloads */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Segmented Control de visualização */}
          <div className="inline-flex p-1 rounded-full bg-[#f5f5f7] border border-[#d2d2d7] text-xs">
            <button
              type="button"
              onClick={() => setViewMode("timeline")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                viewMode === "timeline"
                  ? "bg-white text-[#1d1d1f] shadow-xs font-semibold"
                  : "text-[#6e6e73] hover:text-[#1d1d1f]"
              }`}
              title="Visualizar em Linha do Tempo contínua"
            >
              <TimelineIcon className="size-3.5" />
              Linha do Tempo
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                viewMode === "grid"
                  ? "bg-white text-[#1d1d1f] shadow-xs font-semibold"
                  : "text-[#6e6e73] hover:text-[#1d1d1f]"
              }`}
              title="Visualizar em Grade de Cards"
            >
              <GridIcon className="size-3.5" />
              Grade
            </button>
          </div>

          <button
            type="button"
            onClick={handleNextWeek}
            disabled={isGenerating || downloadingAll}
            className="btn-ghost text-xs py-1.5 px-3"
            title="Avançar para a próxima semana"
          >
            Próxima Semana &rarr;
          </button>

          <button
            id="btn-download-all"
            type="button"
            onClick={handleDownloadAll}
            disabled={downloadingAll || isGenerating}
            className="btn-primary text-xs py-2 px-4"
          >
            {downloadingAll ? (
              <>
                <SpinnerIcon className="size-3.5" /> {downloadProgress || "Baixando..."}
              </>
            ) : (
              <>
                <DownloadIcon className="size-3.5" /> Baixar Todos os 7 PNGs
              </>
            )}
          </button>
        </div>
      </div>

      {/* Faixa / Ribbon de Seleção Rápida de Dias (Padrão Apple) */}
      <div className="apple-card p-3 bg-white">
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
            Navegação da Semana (7 Dias)
          </span>
          <span className="text-[11px] text-[#86868b]">Clique em um dia para rolar</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {result.posts.map((post, idx) => {
            const isSelected = activeDayId === post.id;
            const parts = post.day.split(",");
            const dayName = parts[0]?.trim();
            const dateStr = parts[1]?.trim() || "";

            return (
              <button
                key={post.id}
                type="button"
                onClick={() => scrollToPost(post.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 border ${
                  isSelected
                    ? "bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-xs"
                    : "bg-[#f5f5f7] text-[#1d1d1f] border-[#d2d2d7] hover:border-[#86868b] hover:bg-white"
                }`}
              >
                <span className="font-semibold">{dayName}</span>
                {dateStr && <span className="opacity-75 ml-1 text-[11px]">{dateStr}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Visualização 1: Linha do Tempo (Timeline Apple com Spine e Nós Conectados) */}
      {viewMode === "timeline" ? (
        <div className="relative border-l-2 border-[#d2d2d7] ml-3 sm:ml-5 pl-4 sm:pl-7 space-y-7 pt-2 pb-4">
          {result.posts.map((post, idx) => (
            <div key={post.id} className="relative">
              {/* Nó do dia conectado na linha */}
              <div
                className="absolute -left-[27px] sm:-left-[39px] top-4 size-6 sm:size-7 rounded-full bg-white border-2 border-[#0071e3] grid place-items-center shadow-xs text-[11px] font-bold text-[#0071e3] select-none"
                title={post.day}
              >
                {idx + 1}
              </div>

              {/* Card do dia */}
              <PostCard
                post={post}
                index={idx}
                profile={profile}
                registerCanvas={registerCanvas}
                viewMode="timeline"
                onUpdatePost={onUpdatePost}
              />
            </div>
          ))}
        </div>
      ) : (
        /* Visualização 2: Grade Semanal de 7 Cards (Mural / Feed Instagram em Múltiplas Colunas) */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
          {result.posts.map((post, idx) => (
            <PostCard
              key={post.id}
              post={post}
              index={idx}
              profile={profile}
              registerCanvas={registerCanvas}
              viewMode="grid"
              onUpdatePost={onUpdatePost}
            />
          ))}
        </div>
      )}
    </section>
  );
}
