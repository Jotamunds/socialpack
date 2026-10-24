"use client";

import { useState } from "react";
import { categories, tones } from "@/lib/catalog";
import { createCompanyAction } from "@/app/actions/companies";
import { SpinnerIcon } from "@/components/icons";

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

        setErrorMessage(response.message || "Erro ao cadastrar empresa.");
        setIsLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro inesperado ao cadastrar.";
      setErrorMessage(msg);
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
          aria-label="Fechar"
          className="absolute top-4 right-4 size-7 rounded-md bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] text-[#8a8f98] hover:text-[#f7f8f8] flex items-center justify-center transition-colors cursor-pointer"
        >
          ✕
        </button>

        {/* Cabeçalho */}
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-[#f7f8f8]">
            Cadastrar Nova Empresa
          </h2>
          <p className="text-xs text-[#8a8f98]">
            Configure o perfil para gerar o calendário semanal de posts
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
              Nome da Empresa / Marca *
            </label>
            <input
              id="companyName"
              type="text"
              required
              placeholder="Ex: Forneria Bella Napoli"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-9 px-3 rounded-md bg-[#08090a] border border-[rgba(255,255,255,0.08)] text-[13px] text-[#f7f8f8] placeholder-[#62666d] outline-none focus:border-[#5e6ad2] transition-colors"
            />
          </div>

          {/* Seletores Encadeados: Segmento ➔ Nicho */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="category" className="block text-[12px] font-medium text-[#d0d6e0]">
                Segmento *
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
                Nicho de Atuação *
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
                Cidade *
              </label>
              <input
                id="city"
                type="text"
                required
                placeholder="São Paulo"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-[#08090a] border border-[rgba(255,255,255,0.08)] text-[13px] text-[#f7f8f8] placeholder-[#62666d] outline-none focus:border-[#5e6ad2] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="state" className="block text-[12px] font-medium text-[#d0d6e0]">
                UF *
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
                Instagram (@perfil)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs text-[#8a8f98]">@</span>
                <input
                  id="instagram"
                  type="text"
                  placeholder="pizzaria.napoli"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value.replace(/^@+/, ""))}
                  className="w-full h-9 pl-7 pr-3 rounded-md bg-[#08090a] border border-[rgba(255,255,255,0.08)] text-[13px] text-[#f7f8f8] placeholder-[#62666d] outline-none focus:border-[#5e6ad2] transition-colors font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="tone" className="block text-[12px] font-medium text-[#d0d6e0]">
                Tom de Voz das Legendas *
              </label>
              <select
                id="tone"
                value={toneId}
                onChange={(e) => setToneId(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-[#08090a] border border-[rgba(255,255,255,0.08)] text-[13px] text-[#f7f8f8] outline-none focus:border-[#5e6ad2] transition-colors"
              >
                {tones.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#0f1011]">
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cores da Marca e Presets Rápidos */}
          <div className="space-y-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-[#d0d6e0]">
                Cores da Identidade Visual
              </span>
              <span className="text-[10px] text-[#8a8f98]">Hexadecimais (#RRGGBB)</span>
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
                <span className="text-[11px] text-[#8a8f98]">Primária</span>
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
                <span className="text-[11px] text-[#8a8f98]">Secundária</span>
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
                <span className="text-[11px] text-[#8a8f98]">Destaque</span>
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
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="h-9 px-5 rounded-md bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-xs font-medium transition-all shadow-[0_1px_2px_rgba(0,0,0,0.4)] active:scale-[0.98] inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <SpinnerIcon className="size-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Salvar Empresa</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
