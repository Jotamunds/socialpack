"use client";

import { useEffect, useSyncExternalStore } from "react";
import { MoonIcon, SunIcon, CheckIcon } from "@/components/icons";

type ThemeOption = "dark" | "light";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): ThemeOption {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem("socialpack_theme") as ThemeOption) || "dark";
}

function getServerSnapshot(): ThemeOption {
  return "dark";
}

export function AppearanceSelector() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Sincroniza classes no elemento raiz HTML sem acionar re-render de estado
  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
  }, [theme]);

  const handleSelectTheme = (newTheme: ThemeOption) => {
    document.documentElement.classList.add("theme-transition");

    try {
      localStorage.setItem("socialpack_theme", newTheme);
      document.cookie = `socialpack_theme=${newTheme}; path=/; max-age=31536000; SameSite=Lax`;
      window.dispatchEvent(new Event("storage"));
    } catch {
      // Ignora erro em ambientes restritos
    }

    setTimeout(() => {
      document.documentElement.classList.remove("theme-transition");
    }, 300);
  };

  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-6 sm:p-7 space-y-6">
      <div className="space-y-1 pb-4 border-b border-[rgba(255,255,255,0.06)]">
        <h2 className="text-xl font-semibold tracking-tight text-[#f7f8f8]">
          Aparência & Interface
        </h2>
        <p className="text-xs text-[#8a8f98]">
          Personalize a estética visual da plataforma de acordo com a sua preferência de uso.
        </p>
      </div>

      <div className="space-y-4">
        <span className="text-xs font-medium text-[#d0d6e0]">Tema do Sistema</span>

        {/* Grid com as Miniaturas dos 2 Temas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Opção 1: Tema Escuro (Padrão Oficial) */}
          <div
            onClick={() => handleSelectTheme("dark")}
            className={`group relative rounded-xl border p-4 sm:p-5 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
              theme === "dark"
                ? "border-[#5e6ad2] bg-[#5e6ad2]/5 ring-1 ring-[#5e6ad2]"
                : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.14)]"
            }`}
          >
            {/* Miniatura Gráfica Dark */}
            <div className="w-full h-28 rounded-lg bg-[#08090a] border border-white/10 p-3 flex flex-col justify-between shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-red-500/80" />
                  <div className="size-2 rounded-full bg-amber-500/80" />
                  <div className="size-2 rounded-full bg-emerald-500/80" />
                </div>
                <div className="h-2 w-12 rounded bg-white/10" />
              </div>

              <div className="space-y-1.5">
                <div className="h-2.5 w-3/4 rounded bg-white/20" />
                <div className="h-2 w-1/2 rounded bg-white/10" />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="h-4 w-14 rounded bg-[#5e6ad2] flex items-center justify-center">
                  <div className="h-1 w-8 rounded bg-white/80" />
                </div>
                <div className="h-3 w-8 rounded bg-white/10" />
              </div>
            </div>

            {/* Descrição e Rádio */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MoonIcon className="size-4 text-[#5e6ad2]" />
                  <h3 className="text-sm font-semibold text-[#f7f8f8]">Tema Escuro</h3>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#5e6ad2]/20 text-[#828fff] border border-[#5e6ad2]/30">
                    Oficial
                  </span>
                </div>
                <p className="text-xs text-[#8a8f98] leading-relaxed">
                  Design Linear e Apple Dark Mode com Luminance Stacking e menor fadiga ocular.
                </p>
              </div>

              <div
                className={`size-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  theme === "dark"
                    ? "border-[#5e6ad2] bg-[#5e6ad2] text-white"
                    : "border-[rgba(255,255,255,0.2)] bg-transparent"
                }`}
              >
                {theme === "dark" && <CheckIcon className="size-3" />}
              </div>
            </div>
          </div>

          {/* Opção 2: Tema Claro */}
          <div
            onClick={() => handleSelectTheme("light")}
            className={`group relative rounded-xl border p-4 sm:p-5 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
              theme === "light"
                ? "border-[#5e6ad2] bg-[#5e6ad2]/5 ring-1 ring-[#5e6ad2]"
                : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.14)]"
            }`}
          >
            {/* Miniatura Gráfica Light */}
            <div className="w-full h-28 rounded-lg bg-[#f8fafc] border border-slate-300 p-3 flex flex-col justify-between shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-red-400" />
                  <div className="size-2 rounded-full bg-amber-400" />
                  <div className="size-2 rounded-full bg-emerald-400" />
                </div>
                <div className="h-2 w-12 rounded bg-slate-300" />
              </div>

              <div className="space-y-1.5">
                <div className="h-2.5 w-3/4 rounded bg-slate-700" />
                <div className="h-2 w-1/2 rounded bg-slate-400" />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="h-4 w-14 rounded bg-[#4f5cd1] flex items-center justify-center">
                  <div className="h-1 w-8 rounded bg-white/90" />
                </div>
                <div className="h-3 w-8 rounded bg-slate-300" />
              </div>
            </div>

            {/* Descrição e Rádio */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <SunIcon className="size-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-[#f7f8f8]">Tema Claro</h3>
                </div>
                <p className="text-xs text-[#8a8f98] leading-relaxed">
                  Fundo limpo off-white com contrastes refinados para ambientes iluminados.
                </p>
              </div>

              <div
                className={`size-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  theme === "light"
                    ? "border-[#5e6ad2] bg-[#5e6ad2] text-white"
                    : "border-[rgba(255,255,255,0.2)] bg-transparent"
                }`}
              >
                {theme === "light" && <CheckIcon className="size-3" />}
              </div>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-[#62666d] pt-2">
          A alteração de tema é aplicada instantaneamente no seu navegador sem recarregamento de página.
        </p>
      </div>
    </div>
  );
}
