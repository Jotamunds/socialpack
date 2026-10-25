"use client";

import { useEffect, useState, useTransition } from "react";
import { MoonIcon, SunIcon, CheckIcon, SpinnerIcon } from "@/components/icons";
import { updateThemePreferenceAction } from "@/app/actions/settings";

type ThemeOption = "dark" | "light";

interface AppearanceSelectorProps {
  initialTheme?: ThemeOption;
}

function applyThemeClass(theme: ThemeOption) {
  if (theme === "light") {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
  } else {
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
  }
  try {
    localStorage.setItem("socialpack_theme", theme);
    document.cookie = `socialpack_theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    // ambientes restritos
  }
}

export function AppearanceSelector({ initialTheme = "dark" }: AppearanceSelectorProps) {
  const [theme, setTheme] = useState<ThemeOption>(initialTheme);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    applyThemeClass(initialTheme);
    setTheme(initialTheme);
  }, [initialTheme]);

  const handleSelectTheme = (newTheme: ThemeOption) => {
    document.documentElement.classList.add("theme-transition");
    applyThemeClass(newTheme);
    setTheme(newTheme);
    setFeedback(null);

    startTransition(async () => {
      const res = await updateThemePreferenceAction(newTheme);
      if (!res.ok) {
        setFeedback(res.error || "Não foi possível salvar o tema.");
      }
      setTimeout(() => {
        document.documentElement.classList.remove("theme-transition");
      }, 300);
    });
  };

  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-6 sm:p-7 space-y-6">
      <div className="space-y-1 pb-4 border-b border-[rgba(255,255,255,0.06)]">
        <h2 className="text-xl font-semibold tracking-tight text-[#f7f8f8]">
          Aparência & Interface
        </h2>
        <p className="text-xs text-[#8a8f98]">
          Personalize a estética visual da plataforma. A preferência é salva na sua conta.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-[#d0d6e0]">Tema do Sistema</span>
          {isPending && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-[#8a8f98]">
              <SpinnerIcon className="size-3" />
              Salvando...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => handleSelectTheme("dark")}
            className={`group relative rounded-xl border p-4 sm:p-5 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
              theme === "dark"
                ? "border-[#5e6ad2] bg-[#5e6ad2]/5 ring-1 ring-[#5e6ad2]"
                : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.14)]"
            }`}
          >
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
                <div className="h-4 w-14 rounded bg-[#5e6ad2]" />
                <div className="h-3 w-8 rounded bg-white/10" />
              </div>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MoonIcon className="size-4 text-[#5e6ad2]" />
                  <h3 className="text-sm font-semibold text-[#f7f8f8]">Tema Escuro</h3>
                </div>
                <p className="text-xs text-[#8a8f98] leading-relaxed">
                  Design Linear/Apple Dark com menor fadiga ocular.
                </p>
              </div>
              <div
                className={`size-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  theme === "dark"
                    ? "border-[#5e6ad2] bg-[#5e6ad2] text-white"
                    : "border-[rgba(255,255,255,0.2)]"
                }`}
              >
                {theme === "dark" && <CheckIcon className="size-3" />}
              </div>
            </div>
          </div>

          <div
            onClick={() => handleSelectTheme("light")}
            className={`group relative rounded-xl border p-4 sm:p-5 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
              theme === "light"
                ? "border-[#5e6ad2] bg-[#5e6ad2]/5 ring-1 ring-[#5e6ad2]"
                : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.14)]"
            }`}
          >
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
                <div className="h-4 w-14 rounded bg-[#4f5cd1]" />
                <div className="h-3 w-8 rounded bg-slate-300" />
              </div>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <SunIcon className="size-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-[#f7f8f8]">Tema Claro</h3>
                </div>
                <p className="text-xs text-[#8a8f98] leading-relaxed">
                  Fundo limpo off-white para ambientes iluminados.
                </p>
              </div>
              <div
                className={`size-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  theme === "light"
                    ? "border-[#5e6ad2] bg-[#5e6ad2] text-white"
                    : "border-[rgba(255,255,255,0.2)]"
                }`}
              >
                {theme === "light" && <CheckIcon className="size-3" />}
              </div>
            </div>
          </div>
        </div>

        {feedback && (
          <p className="text-xs text-red-400">{feedback}</p>
        )}
        <p className="text-[11px] text-[#62666d] pt-2">
          A alteração é aplicada na interface e gravada em public.profiles.theme_preference.
        </p>
      </div>
    </div>
  );
}
