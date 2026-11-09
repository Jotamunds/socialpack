"use client";

import { useState } from "react";
import { categories, tones } from "@/lib/catalog";
import { citiesForUf } from "@/lib/brazil-cities";
import { createCompanyAction } from "@/app/actions/companies";
import { SpinnerIcon } from "@/components/icons";
import { t } from "@/i18n";

const BRAZIL_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const COLOR_PRESETS = [
  { name: "Linear Indigo", primary: "#5e6ad2", secondary: "#7170ff", accent: "#828fff" },
  { name: "Apple Minimal", primary: "#1d1d1f", secondary: "#86868b", accent: "#f5f5f7" },
  { name: "Classic Navy", primary: "#0a2540", secondary: "#635bff", accent: "#00d4ff" },
  { name: "Deep Emerald", primary: "#064e3b", secondary: "#10b981", accent: "#34d399" },
  { name: "Warm Amber", primary: "#78350f", secondary: "#f59e0b", accent: "#fbbf24" },
  { name: "Sunset Coral", primary: "#991b1b", secondary: "#ef4444", accent: "#f87171" },
];

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onQuotaExceeded: () => void;
}

export function CompanyModal({ isOpen, onClose, onSuccess, onQuotaExceeded }: CompanyModalProps) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "alimentacao");
  const [nicheId, setNicheId] = useState(categories[0]?.niches[0]?.id || "pizzaria");
  const [city, setCity] = useState("");
  const [state, setState] = useState("SP");
  const [instagram, setInstagram] = useState("");
  const [toneId, setToneId] = useState(tones[0]?.id || "profissional");

  const [primaryColor, setPrimaryColor] = useState("#5e6ad2");
  const [secondaryColor, setSecondaryColor] = useState("#7170ff");
  const [accentColor, setAccentColor] = useState("#828fff");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Atualizar nicho quando a categoria muda
  function handleCategoryChange(newCatId: string) {
    setCategoryId(newCatId);
    const cat = categories.find((c) => c.id === newCatId);
    if (cat && cat.niches.length > 0) {
      setNicheId(cat.niches[0].id);
    }
  }

  function applyColorPreset(preset: typeof COLOR_PRESETS[0]) {
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
    setAccentColor(preset.accent);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await createCompanyAction({
        name,
        categoryId,
        segment: categoryId,
        nicheId,
        niche: nicheId,
        city,
        state,
        instagram,
        instagram_handle: instagram,
        toneId,
        primary_style: toneId as "descontraido" | "profissional" | "elegante" | "colorido" | "acolhedor",
        brand_colors: [primaryColor, secondaryColor, accentColor],
        colors: {
          primary: primaryColor,
          secondary: secondaryColor,
          accent: accentColor,
        },
      });

      if (!response.ok) {
        if (response.code === "QUOTA_EXCEEDED") {
          onClose();
          onQuotaExceeded();
          return;
        }

        setErrorMessage(response.message || "Could not save the company. Please try again.");
        setIsLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setErrorMessage("Could not save the company. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const currentCategory = categories.find((c) => c.id === categoryId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-xl border border-[rgba(255,255,255,0.12)] bg-[#0f1011] p-6 sm:p-7 shadow-2xl space-y-6 my-8">
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t("profile.close")}
          className="absolute top-4 right-4 size-7 rounded-md bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] text-[#8a8f98] hover:text-[#f7f8f8] flex items-center justify-center transition-colors cursor-pointer"
        >
          ✕
        </button>

        {/* Cabeçalho */}
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-[#f7f8f8]">
            {t("profile.modalTitle")}
          </h2>
          <p className="text-xs text-[#8a8f98]">
            {t("profile.modalSubtitle")}
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs leading-relaxed">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome da Empresa */}
          <div className="space-y-1.5">
            <label htmlFor="companyName" className="block text-[12px] font-medium text-[#d0d6e0]">
              {t("profile.name")} *
            </label>
            <input
              id="companyName"
              type="text"
              required
              placeholder={t("profile.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-9 px-3 rounded-md bg-[#08090a] border border-[rgba(255,255,255,0.08)] text-[13px] text-[#f7f8f8] placeholder-[#62666d] outline-none focus:border-[#5e6ad2] transition-colors"
            />
          </div>

          {/* Seletores Encadeados: Segmento ➔ Nicho */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="category" className="block text-[12px] font-medium text-[#d0d6e0]">
                {t("profile.segment")} *
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-[#08090a] border border-[rgba(255,255,255,0.08)] text-[13px] text-[#f7f8f8] outline-none focus:border-[#5e6ad2] transition-colors"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0f1011]">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="niche" className="block text-[12px] font-medium text-[#d0d6e0]">
                {t("profile.niche")} *
              </label>
              <select
                id="niche"
                value={nicheId}
                onChange={(e) => setNicheId(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-[#08090a] border border-[rgba(255,255,255,0.08)] text-[13px] text-[#f7f8f8] outline-none focus:border-[#5e6ad2] transition-colors"
              >
                {currentCategory?.niches.map((n) => (
                  <option key={n.id} value={n.id} className="bg-[#0f1011]">
                    {n.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cidade e UF */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label htmlFor="city" className="block text-[12px] font-medium text-[#d0d6e0]">
                {t("profile.city")} *
              </label>
              <input
                id="city"
                type="text"
                list={`cities-${state}`}
                required
                minLength={2}
                maxLength={100}
                placeholder={t("profile.cityPlaceholder")}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-[#08090a] border border-[rgba(255,255,255,0.08)] text-[13px] text-[#f7f8f8] placeholder-[#62666d] outline-none focus:border-[#5e6ad2] transition-colors"
                autoComplete="address-level2"
              />
              <datalist id={`cities-${state}`}>
                {citiesForUf(state).map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="state" className="block text-[12px] font-medium text-[#d0d6e0]">
                {t("profile.state")} *
              </label>
              <select
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-[#08090a] border border-[rgba(255,255,255,0.08)] text-[13px] text-[#f7f8f8] outline-none focus:border-[#5e6ad2] transition-colors"
              >
                {BRAZIL_STATES.map((uf) => (
                  <option key={uf} value={uf} className="bg-[#0f1011]">
                    {uf}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Instagram e Tom de Voz */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="instagram" className="block text-[12px] font-medium text-[#d0d6e0]">
                {t("profile.instagram")}
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs text-[#8a8f98]">@</span>
                <input
                  id="instagram"
                  type="text"
                  placeholder="pizzaria.napoli"
                  value={instagram}
                  pattern="[A-Za-z0-9._]{0,30}"
                  maxLength={30}
                  title={t("profile.instagramHint")}
                  onChange={(e) =>
                    setInstagram(e.target.value.replace(/^@+/, "").replace(/[^A-Za-z0-9._]/g, "").slice(0, 30))
                  }
                  className="w-full h-9 pl-7 pr-3 rounded-md bg-[#08090a] border border-[rgba(255,255,255,0.08)] text-[13px] text-[#f7f8f8] placeholder-[#62666d] outline-none focus:border-[#5e6ad2] transition-colors font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="tone" className="block text-[12px] font-medium text-[#d0d6e0]">
                {t("profile.voice")} *
              </label>
              <select
                id="tone"
                value={toneId}
                onChange={(e) => setToneId(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-[#08090a] border border-[rgba(255,255,255,0.08)] text-[13px] text-[#f7f8f8] outline-none focus:border-[#5e6ad2] transition-colors"
              >
                {tones.map((tone) => (
                  <option key={tone.id} value={tone.id} className="bg-[#0f1011]">
                    {tone.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cores da Marca e Presets Rápidos */}
          <div className="space-y-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-[#d0d6e0]">
                {t("profile.colors")}
              </span>
              <span className="text-[10px] text-[#8a8f98]">{t("profile.hex")}</span>
            </div>

            {/* Presets Rápidos */}
            <div className="flex flex-wrap gap-1.5 pb-1">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => applyColorPreset(p)}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.06)] text-[#d0d6e0] inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span className="size-2 rounded-full" style={{ backgroundColor: p.primary }} />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <span className="text-[11px] text-[#8a8f98]">{t("profile.primary")}</span>
                <div className="flex items-center gap-1.5 h-8 px-2 rounded-md bg-[#08090a] border border-[rgba(255,255,255,0.08)]">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="size-4 bg-transparent border-none cursor-pointer rounded-sm"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full text-[11px] font-mono text-[#f7f8f8] bg-transparent outline-none uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-[#8a8f98]">{t("profile.secondary")}</span>
                <div className="flex items-center gap-1.5 h-8 px-2 rounded-md bg-[#08090a] border border-[rgba(255,255,255,0.08)]">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="size-4 bg-transparent border-none cursor-pointer rounded-sm"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-full text-[11px] font-mono text-[#f7f8f8] bg-transparent outline-none uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-[#8a8f98]">{t("profile.accent")}</span>
                <div className="flex items-center gap-1.5 h-8 px-2 rounded-md bg-[#08090a] border border-[rgba(255,255,255,0.08)]">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="size-4 bg-transparent border-none cursor-pointer rounded-sm"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-full text-[11px] font-mono text-[#f7f8f8] bg-transparent outline-none uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botões do Rodapé */}
          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-9 px-4 rounded-md bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[#d0d6e0] text-xs font-medium transition-colors cursor-pointer"
            >
              {t("profile.cancel")}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="h-9 px-5 rounded-md bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-xs font-medium transition-all shadow-[0_1px_2px_rgba(0,0,0,0.4)] active:scale-[0.98] inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <SpinnerIcon className="size-3.5 animate-spin" />
                  <span>{t("profile.saving")}</span>
                </>
              ) : (
                <span>{t("profile.save")}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
