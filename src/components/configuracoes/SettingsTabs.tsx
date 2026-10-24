"use client";

import { CreditCardIcon, UserIcon, PaletteIcon } from "@/components/icons";

export type SettingsTabKey = "plano" | "conta" | "aparencia";

interface SettingsTabsProps {
  activeTab: SettingsTabKey;
  onTabChange: (tab: SettingsTabKey) => void;
}

const TABS: { id: SettingsTabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "plano", label: "Plano & Assinatura", icon: CreditCardIcon },
  { id: "conta", label: "Dados da Conta", icon: UserIcon },
  { id: "aparencia", label: "Aparência & Tema", icon: PaletteIcon },
];

export function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
  return (
    <div className="w-full border-b border-[rgba(255,255,255,0.08)]">
      <nav className="flex space-x-2 sm:space-x-4" aria-label="Abas de Configurações">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`group relative flex items-center gap-2 py-3 px-3 sm:px-4 text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                isActive
                  ? "text-[#f7f8f8]"
                  : "text-[#8a8f98] hover:text-[#d0d6e0]"
              }`}
            >
              <Icon
                className={`size-4 transition-colors ${
                  isActive ? "text-[#5e6ad2]" : "text-[#8a8f98] group-hover:text-[#d0d6e0]"
                }`}
              />
              <span>{tab.label}</span>

              {/* Indicador de borda ativa inferior em #5e6ad2 */}
              {isActive ? (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#5e6ad2] rounded-full" />
              ) : (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-transparent group-hover:bg-[rgba(255,255,255,0.06)] rounded-full transition-colors" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
