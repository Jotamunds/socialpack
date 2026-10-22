"use client";

import { useId, useMemo, useState } from "react";
import {
  BuildingIcon,
  CalendarIcon,
  CheckIcon,
  MapPinIcon,
  MicIcon,
  PaletteIcon,
  SaveIcon,
  SparklesIcon,
  SpinnerIcon,
  TagIcon,
} from "@/components/icons";
import { categories, tones } from "@/lib/catalog";
import {
  formatWeekRange,
  getMondayOfWeek,
  getNextMonday,
} from "@/lib/date-utils";
import type { BrandColors, CompanyProfile } from "@/lib/types";

const COLOR_PRESETS: { name: string; colors: BrandColors }[] = [
  {
    name: "Apple Neutral",
    colors: { primary: "#1d1d1f", secondary: "#6e6e73", accent: "#0071e3" },
  },
  {
    name: "Midnight Teal",
    colors: { primary: "#064e3b", secondary: "#0f766e", accent: "#0071e3" },
  },
  {
    name: "Classic Navy",
    colors: { primary: "#0f172a", secondary: "#1e3a8a", accent: "#0284c7" },
  },
  {
    name: "Warm Terracotta",
    colors: { primary: "#7c2d12", secondary: "#9a3412", accent: "#d97706" },
  },
  {
    name: "Deep Emerald",
    colors: { primary: "#14532d", secondary: "#166534", accent: "#eab308" },
  },
  {
    name: "Rich Plum",
    colors: { primary: "#4c0519", secondary: "#881337", accent: "#0071e3" },
  },
];

type Props = {
  initialProfile: CompanyProfile | null;
  onProfileSaved: (profile: CompanyProfile) => void;
  onGenerate: (startDate?: string) => Promise<void>;
  isGenerating: boolean;
  startDate: string;
  onStartDateChange: (date: string) => void;
};

export function ProfileForm({
  initialProfile,
  onProfileSaved,
  onGenerate,
  isGenerating,
  startDate,
  onStartDateChange,
}: Props) {
  const [profile, setProfile] = useState<CompanyProfile>(() => {
    if (initialProfile) return initialProfile;
    return {
      name: "Bella Cucina",
      categoryId: "alimentacao",
      nicheId: "pizzaria",
      city: "Curitiba, PR",
      instagram: "bellacucina.cwb",
      toneId: "descontraido",
      colors: {
        primary: "#1d1d1f",
        secondary: "#6e6e73",
        accent: "#0071e3",
      },
    };
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const currentCategory = useMemo(() => {
    return categories.find((c) => c.id === profile.categoryId) || categories[0];
  }, [profile.categoryId]);

  const currentTone = useMemo(() => {
    return tones.find((t) => t.id === profile.toneId) || tones[0];
  }, [profile.toneId]);

  const nameId = useId();
  const categorySelectId = useId();
  const nicheSelectId = useId();
  const cityId = useId();
  const instaId = useId();
  const toneSelectId = useId();
  const dateInputId = useId();

  const handleCategoryChange = (newCatId: string) => {
    const cat = categories.find((c) => c.id === newCatId);
    const firstNiche = cat?.niches[0]?.id || "";
    setProfile((prev) => ({
      ...prev,
      categoryId: newCatId,
      nicheId: firstNiche,
    }));
  };

  const handleSave = async (silent = false): Promise<boolean> => {
    setSaving(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || `Erro ao salvar perfil (código ${res.status}).`);
      }
      onProfileSaved(data.profile);
      if (!silent) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar perfil.";
      setErrorMessage(msg);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateClick = async () => {
    const ok = await handleSave(true);
    if (ok) {
      await onGenerate(startDate);
    }
  };

  return (
    <div className="apple-card p-6 sm:p-7 space-y-6 bg-white mb-2">
      {/* Header do Perfil */}
      <div className="flex items-start justify-between gap-4 border-b border-[#e5e5ea] pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#0071e3]">
            <BuildingIcon className="size-3.5" /> Identidade do Cliente
          </span>
          <h2 className="text-xl sm:text-2xl font-semibold text-[#1d1d1f] tracking-tight mt-1">
            Perfil da Empresa
          </h2>
          <p className="text-xs sm:text-sm text-[#6e6e73] mt-1">
            Personalize os dados e a paleta para guiar os templates visuais e copies.
          </p>
        </div>

        {/* Live Palette Badge */}
        <div className="hidden sm:flex flex-col items-end gap-1.5">
          <span className="text-[10px] uppercase font-semibold text-[#86868b] tracking-wider">
            Paleta Ativa
          </span>
          <div className="flex items-center -space-x-1.5 p-1 rounded-full bg-[#f5f5f7] border border-[#d2d2d7]">
            <div
              className="size-5 rounded-full ring-2 ring-white shadow-sm transition-transform hover:scale-125"
              style={{ background: profile.colors.primary }}
              title={`Primária: ${profile.colors.primary}`}
            />
            <div
              className="size-5 rounded-full ring-2 ring-white shadow-sm transition-transform hover:scale-125"
              style={{ background: profile.colors.secondary }}
              title={`Secundária: ${profile.colors.secondary}`}
            />
            <div
              className="size-5 rounded-full ring-2 ring-white shadow-sm transition-transform hover:scale-125"
              style={{ background: profile.colors.accent }}
              title={`Destaque: ${profile.colors.accent}`}
            />
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {errorMessage}
        </div>
      )}

      {/* Formulário */}
      <div className="space-y-4">
        {/* Nome & Cidade */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor={nameId} className="field-label">
              <BuildingIcon className="size-3 text-[#6e6e73]" /> Nome da Empresa
            </label>
            <input
              id={nameId}
              type="text"
              value={profile.name}
              onChange={(e) =>
                setProfile((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="Ex: Bella Cucina"
              className="field-input"
            />
          </div>

          <div>
            <label htmlFor={cityId} className="field-label">
              <MapPinIcon className="size-3 text-[#6e6e73]" /> Cidade e Estado
            </label>
            <input
              id={cityId}
              type="text"
              value={profile.city}
              onChange={(e) =>
                setProfile((p) => ({ ...p, city: e.target.value }))
              }
              placeholder="Ex: Curitiba, PR"
              className="field-input"
            />
          </div>
        </div>

        {/* Tipo de Empresa & Nicho */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor={categorySelectId} className="field-label">
              <TagIcon className="size-3 text-[#6e6e73]" /> Segmento
            </label>
            <select
              id={categorySelectId}
              value={profile.categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="field-input"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={nicheSelectId} className="field-label">
              <TagIcon className="size-3 text-[#6e6e73]" /> Nicho Específico
            </label>
            <select
              id={nicheSelectId}
              value={profile.nicheId}
              onChange={(e) =>
                setProfile((p) => ({ ...p, nicheId: e.target.value }))
              }
              className="field-input"
            >
              {currentCategory.niches.map((niche) => (
                <option key={niche.id} value={niche.id}>
                  {niche.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Instagram & Tom de Voz */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor={instaId} className="field-label">
              Instagram do Cliente
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b] font-mono text-xs">
                @
              </span>
              <input
                id={instaId}
                type="text"
                value={profile.instagram}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    instagram: e.target.value.replace(/^@+/, ""),
                  }))
                }
                placeholder="nomecliente"
                className="field-input pl-8 text-xs sm:text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label htmlFor={toneSelectId} className="field-label">
              <MicIcon className="size-3 text-[#6e6e73]" /> Tom de Voz
            </label>
            <select
              id={toneSelectId}
              value={profile.toneId}
              onChange={(e) =>
                setProfile((p) => ({ ...p, toneId: e.target.value }))
              }
              className="field-input"
            >
              {tones.map((tone) => (
                <option key={tone.id} value={tone.id}>
                  {tone.label} {tone.emojis ? "(com emojis)" : "(sóbrio)"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Descrição do Tom Selecionado */}
        <div className="rounded-xl border border-[#d2d2d7] bg-[#f5f5f7] p-3 text-xs text-[#6e6e73] flex items-start gap-2.5">
          <span className="text-sm select-none">💬</span>
          <div className="space-y-0.5">
            <div>
              <span className="font-semibold text-[#1d1d1f] mr-1.5">
                {currentTone.label}:
              </span>
              {currentTone.description}
            </div>
            <div className="text-[#86868b] italic">
              Assinatura: &ldquo;{currentTone.signoff}&rdquo;
            </div>
          </div>
        </div>

        {/* Cores da Marca */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="field-label mb-0">
              <PaletteIcon className="size-3.5 text-[#6e6e73]" /> Cores da Marca
            </span>
            <span className="text-[11px] text-[#86868b]">
              Personalize ou escolha um preset
            </span>
          </div>

          {/* Color pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Primária */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl border border-[#d2d2d7] bg-[#f5f5f7]">
              <label
                className="relative size-7 rounded-lg shrink-0 cursor-pointer overflow-hidden border border-[#d2d2d7] shadow-2xs hover:scale-105 transition-transform"
                style={{ backgroundColor: profile.colors.primary }}
                title={`Alterar cor primária (${profile.colors.primary})`}
              >
                <input
                  type="color"
                  value={profile.colors.primary}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      colors: { ...p.colors, primary: e.target.value },
                    }))
                  }
                  className="absolute inset-0 size-full opacity-0 cursor-pointer p-0 m-0"
                />
              </label>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase font-semibold text-[#86868b]">
                  Primária
                </p>
                <input
                  type="text"
                  maxLength={7}
                  value={profile.colors.primary}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      colors: { ...p.colors, primary: e.target.value },
                    }))
                  }
                  className="font-mono text-xs text-[#1d1d1f] uppercase bg-transparent outline-none w-full"
                />
              </div>
            </div>

            {/* Secundária */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl border border-[#d2d2d7] bg-[#f5f5f7]">
              <label
                className="relative size-7 rounded-lg shrink-0 cursor-pointer overflow-hidden border border-[#d2d2d7] shadow-2xs hover:scale-105 transition-transform"
                style={{ backgroundColor: profile.colors.secondary }}
                title={`Alterar cor secundária (${profile.colors.secondary})`}
              >
                <input
                  type="color"
                  value={profile.colors.secondary}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      colors: { ...p.colors, secondary: e.target.value },
                    }))
                  }
                  className="absolute inset-0 size-full opacity-0 cursor-pointer p-0 m-0"
                />
              </label>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase font-semibold text-[#86868b]">
                  Secundária
                </p>
                <input
                  type="text"
                  maxLength={7}
                  value={profile.colors.secondary}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      colors: { ...p.colors, secondary: e.target.value },
                    }))
                  }
                  className="font-mono text-xs text-[#1d1d1f] uppercase bg-transparent outline-none w-full"
                />
              </div>
            </div>

            {/* Destaque / Accent */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl border border-[#d2d2d7] bg-[#f5f5f7]">
              <label
                className="relative size-7 rounded-lg shrink-0 cursor-pointer overflow-hidden border border-[#d2d2d7] shadow-2xs hover:scale-105 transition-transform"
                style={{ backgroundColor: profile.colors.accent }}
                title={`Alterar cor de destaque (${profile.colors.accent})`}
              >
                <input
                  type="color"
                  value={profile.colors.accent}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      colors: { ...p.colors, accent: e.target.value },
                    }))
                  }
                  className="absolute inset-0 size-full opacity-0 cursor-pointer p-0 m-0"
                />
              </label>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase font-semibold text-[#86868b]">
                  Destaque (CTA)
                </p>
                <input
                  type="text"
                  maxLength={7}
                  value={profile.colors.accent}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      colors: { ...p.colors, accent: e.target.value },
                    }))
                  }
                  className="font-mono text-xs text-[#1d1d1f] uppercase bg-transparent outline-none w-full"
                />
              </div>
            </div>
          </div>

          {/* Quick Palettes */}
          <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-1.5 pt-1 scrollbar-thin">
            <span className="text-[11px] text-[#86868b] shrink-0 mr-1 select-none">Presets:</span>
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() =>
                  setProfile((p) => ({ ...p, colors: preset.colors }))
                }
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#d2d2d7] bg-white text-[11px] text-[#1d1d1f] hover:border-[#86868b] hover:bg-[#f5f5f7] transition shrink-0 whitespace-nowrap min-h-[32px]"
              >
                <span className="flex items-center -space-x-1 shrink-0">
                  <span
                    className="size-2 rounded-full ring-1 ring-white"
                    style={{ background: preset.colors.primary }}
                  />
                  <span
                    className="size-2 rounded-full ring-1 ring-white"
                    style={{ background: preset.colors.secondary }}
                  />
                  <span
                    className="size-2 rounded-full ring-1 ring-white"
                    style={{ background: preset.colors.accent }}
                  />
                </span>
                <span className="shrink-0">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendário Editorial da Semana (7 Dias com Datas Reais) */}
      <div className="pt-4 border-t border-[#e5e5ea] space-y-3">
        <div className="flex items-center justify-between">
          <label
            htmlFor={dateInputId}
            className="field-label mb-0 flex items-center gap-1.5 text-xs font-semibold text-[#1d1d1f]"
          >
            <CalendarIcon className="size-3.5 text-[#0071e3]" /> Início da Semana (7 Dias)
          </label>
          <span className="text-[11px] font-medium text-[#0071e3] bg-[#0071e3]/10 px-2.5 py-0.5 rounded-full shrink-0">
            {formatWeekRange(startDate)}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            id={dateInputId}
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="field-input text-xs sm:text-sm py-2 flex-1 min-h-[40px]"
          />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onStartDateChange(getMondayOfWeek())}
              className="btn-ghost text-xs py-2 px-3 flex-1 sm:flex-initial min-h-[40px] whitespace-nowrap"
              title="Ajustar para Segunda-feira desta semana"
            >
              Semana Atual
            </button>
            <button
              type="button"
              onClick={() => onStartDateChange(getNextMonday())}
              className="btn-ghost text-xs py-2 px-3 flex-1 sm:flex-initial min-h-[40px] whitespace-nowrap"
              title="Ajustar para a próxima Segunda-feira"
            >
              Próxima Semana
            </button>
          </div>
        </div>

        <p className="text-[11px] text-[#86868b]">
          Gera 7 posts de Segunda a Domingo com datas reais e tags correspondentes.
        </p>
      </div>

      {/* Ações: Salvar e Gerar (Mobile First) */}
      <div className="pt-4 border-t border-[#e5e5ea] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => handleSave(false)}
          disabled={saving || isGenerating}
          className="btn-ghost text-xs py-2.5 px-4 min-h-[44px] justify-center"
        >
          {saving ? (
            <SpinnerIcon />
          ) : saveSuccess ? (
            <CheckIcon className="text-emerald-600" />
          ) : (
            <SaveIcon />
          )}
          {saving
            ? "Salvando..."
            : saveSuccess
            ? "Salvo com sucesso"
            : "Salvar Perfil"}
        </button>

        <button
          id="btn-generate-week"
          type="button"
          onClick={handleGenerateClick}
          disabled={isGenerating || saving}
          className="btn-primary text-sm py-3 px-6 min-h-[44px] justify-center shadow-sm hover:shadow transition-all font-semibold"
        >
          {isGenerating ? (
            <>
              <SpinnerIcon /> Gerando Semana de Posts...
            </>
          ) : (
            <>
              <SparklesIcon /> Gerar Semana de Posts
            </>
          )}
        </button>
      </div>
    </div>
  );
}
