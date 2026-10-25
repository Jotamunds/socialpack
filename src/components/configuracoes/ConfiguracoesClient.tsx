"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SettingsTabs, type SettingsTabKey } from "./SettingsTabs";
import { SubscriptionPlanCard } from "./SubscriptionPlanCard";
import { AccountForm } from "./AccountForm";
import { AppearanceSelector } from "./AppearanceSelector";

interface ConfiguracoesClientProps {
  profile: {
    fullName: string;
    phone: string;
    email: string;
  };
  subscription: {
    plan: string;
    status: string;
    company_quota: number;
    current_period_end?: string | null;
    cancel_at_period_end?: boolean;
  };
  companyCount: number;
  initialTab?: SettingsTabKey;
}

const VALID_TABS: SettingsTabKey[] = ["plano", "conta", "aparencia"];

export function ConfiguracoesClient({
  profile,
  subscription,
  companyCount,
  initialTab = "plano",
}: ConfiguracoesClientProps) {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") as SettingsTabKey | null;

  const [activeTab, setActiveTab] = useState<SettingsTabKey>(() => {
    if (urlTab && VALID_TABS.includes(urlTab)) return urlTab;
    return initialTab;
  });

  // Sincroniza quando o usuário clica em Voltar/Avançar no navegador
  useEffect(() => {
    const handlePopState = () => {
      const currentParams = new URLSearchParams(window.location.search);
      const tabParam = currentParams.get("tab") as SettingsTabKey | null;
      if (tabParam && VALID_TABS.includes(tabParam)) {
        setActiveTab(tabParam);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleTabChange = (tab: SettingsTabKey) => {
    setActiveTab(tab);
    // Atualiza a URL com shallow replace sem recarregamento de página
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    }
  };

  return (
    <div className="space-y-8">
      {/* Abas de Navegação Horizontal */}
      <SettingsTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Conteúdo Dinâmico com Transição Suave */}
      <div className="transition-opacity duration-200">
        {activeTab === "plano" && (
          <div className="animate-in fade-in duration-150">
            <SubscriptionPlanCard
              subscription={subscription}
              companyCount={companyCount}
            />
          </div>
        )}

        {activeTab === "conta" && (
          <div className="animate-in fade-in duration-150">
            <AccountForm initialProfile={profile} />
          </div>
        )}

        {activeTab === "aparencia" && (
          <div className="animate-in fade-in duration-150">
            <AppearanceSelector />
          </div>
        )}
      </div>
    </div>
  );
}
