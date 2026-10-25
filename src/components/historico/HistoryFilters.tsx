"use client";

import type { CompanyItem } from "@/components/geracao/CompanySelector";
import type { HistoryNicheOption, HistoryPeriod } from "@/lib/history-filters";

interface HistoryFiltersProps {
  companies: CompanyItem[];
  niches: HistoryNicheOption[];
  empresa: string;
  nicho: string;
  periodo: "" | HistoryPeriod;
  busca: string;
  canClear: boolean;
  onEmpresaChange: (value: string) => void;
  onNichoChange: (value: string) => void;
  onPeriodoChange: (value: string) => void;
  onBuscaChange: (value: string) => void;
  onBuscaCommit: () => void;
  onClear: () => void;
}

export function HistoryFilters({
  companies,
  niches,
  empresa,
  nicho,
  periodo,
  busca,
  canClear,
  onEmpresaChange,
  onNichoChange,
  onPeriodoChange,
  onBuscaChange,
  onBuscaCommit,
  onClear,
}: HistoryFiltersProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onBuscaCommit();
      }}
      className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-4 sm:p-5 space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
        <div className="sm:col-span-4 space-y-1.5">
          <label htmlFor="company-filter" className="text-[11px] font-medium text-[#8a8f98] block">
            Filtrar por Empresa
          </label>
          <div className="relative">
            <select
              id="company-filter"
              name="empresa"
              value={empresa}
              onChange={(event) => onEmpresaChange(event.target.value)}
              className="w-full h-9 appearance-none rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.18)] focus:border-[#5e6ad2] text-[#f7f8f8] text-xs px-3 pr-8 transition-colors cursor-pointer"
            >
              <option value="" className="bg-[#0f1011] text-[#f7f8f8]">
                Todas as empresas ({companies.length})
              </option>
              {companies.map((company) => (
                <option key={company.id} value={company.id} className="bg-[#0f1011] text-[#f7f8f8]">
                  {company.name} ({company.city})
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

        <div className="sm:col-span-5 space-y-1.5">
          <label htmlFor="search-input" className="text-[11px] font-medium text-[#8a8f98] block">
            Buscar por tema ou texto
          </label>
          <div className="relative">
            <input
              id="search-input"
              name="busca"
              type="text"
              value={busca}
              onChange={(event) => onBuscaChange(event.target.value)}
              placeholder="Ex: Pizza artesanal, promoção, dica..."
              maxLength={80}
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

        <div className="sm:col-span-3 space-y-1.5">
          <label htmlFor="period-filter" className="text-[11px] font-medium text-[#8a8f98] block">
            Período
          </label>
          <div className="relative">
            <select
              id="period-filter"
              name="periodo"
              value={periodo}
              onChange={(event) => onPeriodoChange(event.target.value)}
              className="w-full h-9 appearance-none rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.18)] focus:border-[#5e6ad2] text-[#f7f8f8] text-xs px-3 pr-8 transition-colors cursor-pointer"
            >
              <option value="" className="bg-[#0f1011] text-[#f7f8f8]">
                Todo o histórico
              </option>
              <option value="7d" className="bg-[#0f1011] text-[#f7f8f8]">
                Últimos 7 dias
              </option>
              <option value="30d" className="bg-[#0f1011] text-[#f7f8f8]">
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

        <div className="sm:col-span-4 space-y-1.5">
          <label htmlFor="niche-filter" className="text-[11px] font-medium text-[#8a8f98] block">
            Nicho
          </label>
          <div className="relative">
            <select
              id="niche-filter"
              name="nicho"
              value={nicho}
              onChange={(event) => onNichoChange(event.target.value)}
              className="w-full h-9 appearance-none rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.18)] focus:border-[#5e6ad2] text-[#f7f8f8] text-xs px-3 pr-8 transition-colors cursor-pointer"
            >
              <option value="" className="bg-[#0f1011] text-[#f7f8f8]">
                Todos os nichos
              </option>
              {niches.map((option) => (
                <option key={option.id} value={option.id} className="bg-[#0f1011] text-[#f7f8f8]">
                  {option.label}
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

        <div className="sm:col-span-8 flex items-end sm:justify-end">
          <button
            type="button"
            onClick={onClear}
            disabled={!canClear}
            className="h-9 px-3 rounded-md bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.08)] text-xs text-[#d0d6e0] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[rgba(255,255,255,0.04)]"
          >
            Limpar Filtros
          </button>
        </div>
      </div>
    </form>
  );
}
