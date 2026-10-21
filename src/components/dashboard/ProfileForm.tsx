"use client";

import { useId, useMemo, useState } from "react";
import {
  BuildingIcon,
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
import type { BrandColors, CompanyProfile } from "@/lib/types";

const COLOR_PRESETS: { name: string; colors: BrandColors }[] = [
  {
    name: "Cyber Fuchsia",
    colors: { primary: "#7c3aed", secondary: "#db2777", accent: "#f59e0b" },
  },
  {
    name: "Midnight Emerald",
    colors: { primary: "#064e3b", secondary: "#0f766e", accent: "#fbbf24" },
  },
  {
    name: "Burgundy Velvet",
    colors: { primary: "#4a044e", secondary: "#831843", accent: "#f43f5e" },
  },
  {
    name: "Sunset Coral",
    colors: { primary: "#c2410c", secondary: "#be185d", accent: "#fbbf24" },
  },
  {
    name: "Deep Ocean",
    colors: { primary: "#0f172a", secondary: "#1e3a8a", accent: "#38bdf8" },
  },
  {
    name: "Coffee Gold",
    colors: { primary: "#3e2723", secondary: "#4e342e", accent: "#d97706" },
  },
];

type Props = {
  initialProfile: CompanyProfile | null;
  onProfileSaved: (profile: CompanyProfile) => void;
  onGenerate: () => Promise<void>;
  isGenerating: boolean;
};

export function ProfileForm({
  initialProfile,
  onProfileSaved,
  onGenerate,
  isGenerating,
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
        primary: "#8b5cf6",
        secondary: "#d946ef",
        accent: "#fbbf24",
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
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar perfil.");
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
      await onGenerate();
    }
  };

  return (
    <div className="glass relative rounded-3xl p-6 sm:p-7 space-y-6">
      {/* Header do Perfil */}
      <div className="flex items-start justify-between gap-4 border-b border-white/8 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-fuchsia">
            <BuildingIcon className="size-3.5" /> Identidade da Empresa
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
            Perfil do Negócio
          </h2>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            Personalize os dados e cores para alimentar a IA e os templates visuais.
          </p>
        </div>

        {/* Live Badge Preview */}
        <div className="hidden sm:flex flex-col items-end gap-1.5">
          <span className="text-[10px] uppercase font-semibold text-white/40 tracking-wider">
            Paleta Ativa
          </span>
          <div className="flex items-center -space-x-1.5 p-1 rounded-full bg-white/5 border border-white/10 shadow-inner">
            <div
              className="size-5 rounded-full ring-2 ring-black/40 transition-transform hover:scale-125"
              style={{ background: profile.colors.primary }}
              title={`Primária: ${profile.colors.primary}`}
            />
            <div
              className="size-5 rounded-full ring-2 ring-black/40 transition-transform hover:scale-125"
              style={{ background: profile.colors.secondary }}
              title={`Secundária: ${profile.colors.secondary}`}
            />
            <div
              className="size-5 rounded-full ring-2 ring-black/40 transition-transform hover:scale-125"
              style={{ background: profile.colors.accent }}
              title={`Destaque: ${profile.colors.accent}`}
            />
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          {errorMessage}
        </div>
      )}

      {/* Formulário */}
      <div className="space-y-5">
        {/* Nome & Cidade */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={nameId} className="field-label">
              <BuildingIcon className="size-3 text-white/50" /> Nome da Empresa
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
              <MapPinIcon className="size-3 text-white/50" /> Cidade e Estado
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={categorySelectId} className="field-label">
              <TagIcon className="size-3 text-white/50" /> Tipo / Segmento
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
              <TagIcon className="size-3 text-white/50" /> Nicho Específico
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={instaId} className="field-label">
              @ Instagram / Usuário
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35 font-mono text-sm">
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
                placeholder="suaempresa"
                className="field-input pl-8 font-mono text-xs sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor={toneSelectId} className="field-label">
              <MicIcon className="size-3 text-white/50" /> Tom de Voz da Marca
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
                  {tone.label} {tone.emojis ? "✨ (com emojis)" : "📄 (sóbrio)"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Descrição do Tom Selecionado */}
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-xs text-white/60 flex items-start gap-2.5">
          <span className="text-base select-none">💬</span>
          <div>
            <span className="font-semibold text-white/80 mr-1.5">
              {currentTone.label}:
            </span>
            {currentTone.description}
            <span className="block text-white/40 mt-0.5 italic">
              Assinatura padrão: &ldquo;{currentTone.signoff}&rdquo;
            </span>
          </div>
        </div>

        {/* Cores da Marca */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="field-label mb-0">
              <PaletteIcon className="size-3.5 text-white/50" /> Cores da Marca
            </span>
            <span className="text-[11px] text-white/40">
              Personalize ou escolha uma paleta rápida
            </span>
          </div>

          {/* Color pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Primária */}
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-white/10 bg-white/[0.03]">
              <input
                type="color"
                value={profile.colors.primary}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    colors: { ...p.colors, primary: e.target.value },
                  }))
                }
                className="size-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
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
                  className="font-mono text-xs text-white uppercase bg-transparent outline-none w-full"
                />
              </div>
            </div>

            {/* Secundária */}
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-white/10 bg-white/[0.03]">
              <input
                type="color"
                value={profile.colors.secondary}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    colors: { ...p.colors, secondary: e.target.value },
                  }))
                }
                className="size-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
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
                  className="font-mono text-xs text-white uppercase bg-transparent outline-none w-full"
                />
              </div>
            </div>

            {/* Destaque / Accent */}
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-white/10 bg-white/[0.03]">
              <input
                type="color"
                value={profile.colors.accent}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    colors: { ...p.colors, accent: e.target.value },
                  }))
                }
                className="size-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
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
                  className="font-mono text-xs text-white uppercase bg-transparent outline-none w-full"
                />
              </div>
            </div>
          </div>

          {/* Quick Palettes */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] text-white/40 mr-1">Paletas:</span>
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() =>
                  setProfile((p) => ({ ...p, colors: preset.colors }))
                }
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/8 bg-white/[0.03] text-[11px] text-white/70 hover:border-white/20 hover:text-white transition"
              >
                <span className="flex items-center -space-x-1">
                  <span
                    className="size-2.5 rounded-full ring-1 ring-black/40"
                    style={{ background: preset.colors.primary }}
                  />
                  <span
                    className="size-2.5 rounded-full ring-1 ring-black/40"
                    style={{ background: preset.colors.secondary }}
                  />
                  <span
                    className="size-2.5 rounded-full ring-1 ring-black/40"
                    style={{ background: preset.colors.accent }}
                  />
                </span>
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ações: Salvar e Gerar */}
      <div className="pt-4 border-t border-white/8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => handleSave(false)}
          disabled={saving || isGenerating}
          className="btn-ghost text-xs"
        >
          {saving ? (
            <SpinnerIcon />
          ) : saveSuccess ? (
            <CheckIcon className="text-emerald-400" />
          ) : (
            <SaveIcon />
          )}
          {saving
            ? "Salvando..."
            : saveSuccess
            ? "Perfil salvo!"
            : "Salvar Perfil"}
        </button>

        <button
          id="btn-generate-week"
          type="button"
          onClick={handleGenerateClick}
          disabled={isGenerating || saving}
          className="btn-primary text-sm sm:text-base py-3 px-6 shadow-xl"
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
