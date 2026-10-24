"use client";

import type { CompanyItem } from "@/components/geracao/CompanySelector";

interface HistoryFiltersProps {
  companies: CompanyItem[];
  selectedCompanyId: string;
  onCompanyChange: (id: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}

export function HistoryFilters({
  companies,
  selectedCompanyId,
  onCompanyChange,
  searchTerm,
  onSearchChange,
  selectedPeriod,
  onPeriodChange,
}: HistoryFiltersProps) {
  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-4 sm:p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* Filtro por Empresa */}
        <div className="sm:col-span-4 space-y-1.5">
          <label htmlFor="company-filter" className="text-[11px] font-medium text-[#8a8f98] block">
            Filtrar por Empresa
          </label>
          <div className="relative">
            <select
              id="company-filter"
              value={selectedCompanyId}
              onChange={(e) => onCompanyChange(e.target.value)}
              className="w-full h-9 appearance-none rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.18)] focus:border-[#5e6ad2] text-[#f7f8f8] text-xs px-3 pr-8 transition-colors cursor-pointer"
            >
              <option value="all" className="bg-[#0f1011] text-[#f7f8f8]">
                Todas as empresas ({companies.length})
              </option>
              {companies.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0f1011] text-[#f7f8f8]">
                  {c.name} ({c.city})
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#8a8f98]">
              <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Busca Textual */}
        <div className="sm:col-span-5 space-y-1.5">
          <label htmlFor="search-input" className="text-[11px] font-medium text-[#8a8f98] block">
            Buscar por tema ou texto
          </label>
          <div className="relative">
            <input
              id="search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Ex: Pizza artesanal, promoção, dica..."
              className="w-full h-9 rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.18)] focus:border-[#5e6ad2] text-[#f7f8f8] text-xs px-3 pl-8 placeholder-[#62666d] transition-colors"
            />
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#8a8f98]">
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
          </div>
        </div>

        {/* Período */}
        <div className="sm:col-span-3 space-y-1.5">
          <label htmlFor="period-filter" className="text-[11px] font-medium text-[#8a8f98] block">
            Período
          </label>
          <div className="relative">
            <select
              id="period-filter"
              value={selectedPeriod}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="w-full h-9 appearance-none rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.18)] focus:border-[#5e6ad2] text-[#f7f8f8] text-xs px-3 pr-8 transition-colors cursor-pointer"
            >
              <option value="all" className="bg-[#0f1011] text-[#f7f8f8]">
                Todo o histórico
              </option>
              <option value="7days" className="bg-[#0f1011] text-[#f7f8f8]">
                Últimos 7 dias
              </option>
              <option value="30days" className="bg-[#0f1011] text-[#f7f8f8]">
                Últimos 30 dias
              </option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#8a8f98]">
              <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
