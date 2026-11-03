"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SettingsTabs, type SettingsTabKey } from "./SettingsTabs";
import { AccountForm } from "./AccountForm";
import { AppearanceSelector } from "./AppearanceSelector";

interface ConfiguracoesClientProps {
  profile: {
    fullName: string;
    phone: string;
    email: string;
  };
  initialTab?: SettingsTabKey;
  initialTheme?: "dark" | "light";
}

const VALID_TABS: SettingsTabKey[] = ["conta", "aparencia"];

export function ConfiguracoesClient({
  profile,
  initialTab = "conta",
  initialTheme = "dark",
}: ConfiguracoesClientProps) {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") as SettingsTabKey | null;

  const [activeTab, setActiveTab] = useState<SettingsTabKey>(() => {
    if (urlTab && VALID_TABS.includes(urlTab)) return urlTab;
    return initialTab;
  });

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
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    }
  };

  return (
    <div className="space-y-8">
      <SettingsTabs activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="transition-opacity duration-200">
        {activeTab === "conta" && (
          <div className="animate-in fade-in duration-150">
            <AccountForm initialProfile={profile} />
          </div>
        )}

        {activeTab === "aparencia" && (
          <div className="animate-in fade-in duration-150">
            <AppearanceSelector initialTheme={initialTheme} />
          </div>
        )}
      </div>
    </div>
  );
}
