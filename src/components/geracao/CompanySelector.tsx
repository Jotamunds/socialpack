"use client";

import Link from "next/link";
import { findNiche } from "@/lib/catalog";
import { BuildingIcon } from "@/components/icons";

export interface CompanyItem {
  id: string;
  name: string;
  category_id: string;
  niche_id: string;
  city: string;
  state: string;
  instagram: string | null;
  tone_id: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

interface CompanySelectorProps {
  companies: CompanyItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export function CompanySelector({
  companies,
  selectedId,
  onSelect,
  disabled = false,
}: CompanySelectorProps) {
  if (companies.length === 0) {
    return (
      <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-md bg-[#5e6ad2]/15 text-[#7170ff] flex items-center justify-center shrink-0">
            <BuildingIcon className="size-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#f7f8f8]">
              Nenhuma empresa cadastrada
            </p>
            <p className="text-[11px] text-[#8a8f98]">
              Cadastre sua empresa primeiro para definir paleta de cores e nicho de atuação
            </p>
          </div>
        </div>
        <Link
          href="/perfil"
          className="h-8 px-3 rounded-md bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-xs font-medium transition-colors shrink-0 inline-flex items-center justify-center"
        >
          Cadastrar Empresa
        </Link>
      </div>
    );
  }

  const selectedCompany = companies.find((c) => c.id === selectedId) || companies[0];
  const nicheLabel = findNiche(selectedCompany.category_id, selectedCompany.niche_id)?.label || selectedCompany.niche_id;

  return (
    <div className="space-y-1.5">
      <label htmlFor="company-select" className="text-[11px] font-medium text-[#8a8f98] block">
        Empresa Selecionada
      </label>
      <div className="relative">
        <select
          id="company-select"
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
          disabled={disabled}
          className="w-full h-10 appearance-none rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.18)] focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2] text-[#f7f8f8] text-xs px-3.5 pr-8 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {companies.map((c) => (
            <option key={c.id} value={c.id} className="bg-[#0f1011] text-[#f7f8f8]">
              {c.name} ({c.city}, {c.state}) — {c.instagram ? `@${c.instagram.replace(/^@+/, "")}` : "Sem @"}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#8a8f98]">
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* Amostra rápida das cores e nicho da empresa ativa */}
      <div className="flex items-center gap-3 pt-1 text-[11px] text-[#8a8f98]">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ backgroundColor: selectedCompany.colors.primary }} />
          <span className="size-2 rounded-full" style={{ backgroundColor: selectedCompany.colors.secondary }} />
          <span className="size-2 rounded-full" style={{ backgroundColor: selectedCompany.colors.accent }} />
        </div>
        <span>•</span>
        <span>{nicheLabel}</span>
        <span>•</span>
        <span>{selectedCompany.city}, {selectedCompany.state}</span>
      </div>
    </div>
  );
}
