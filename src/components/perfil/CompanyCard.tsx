"use client";

import Link from "next/link";
import { findNiche, findTone } from "@/lib/catalog";
import { MapPinIcon, SparklesIcon, SpinnerIcon } from "@/components/icons";

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
  created_at?: string;
}

interface CompanyCardProps {
  company: CompanyItem;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

export function CompanyCard({ company, onDelete, isDeleting = false }: CompanyCardProps) {
  const nicheLabel = findNiche(company.category_id, company.niche_id)?.label || company.niche_id;
  const toneLabel = findTone(company.tone_id)?.label || company.tone_id;

  const colors = [
    { label: "Primária", hex: company.colors?.primary || "#5e6ad2" },
    { label: "Secundária", hex: company.colors?.secondary || "#7170ff" },
    { label: "Destaque", hex: company.colors?.accent || "#828fff" },
  ];

  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-5 hover:border-[rgba(255,255,255,0.14)] hover:bg-[rgba(255,255,255,0.03)] transition-all flex flex-col justify-between space-y-5">
      {/* Topo do Card: Nome, Instagram e Badges */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[#f7f8f8] tracking-tight">
              {company.name}
            </h3>
            {company.instagram ? (
              <p className="text-xs font-mono text-[#8a8f98] mt-0.5">
                @{company.instagram.replace(/^@+/, "")}
              </p>
            ) : (
              <p className="text-xs text-[#62666d] mt-0.5">Sem Instagram cadastrado</p>
            )}
          </div>

          {/* Localização */}
          <div className="inline-flex items-center gap-1 text-[11px] text-[#8a8f98] bg-[#0f1011] px-2 py-0.5 rounded border border-[rgba(255,255,255,0.06)]">
            <MapPinIcon className="size-3" />
            <span>
              {company.city}, {company.state}
            </span>
          </div>
        </div>

        {/* Pílulas de Metadados */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[rgba(255,255,255,0.04)] text-[#d0d6e0] border border-[rgba(255,255,255,0.06)]">
            {nicheLabel}
          </span>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#5e6ad2]/10 text-[#7170ff] border border-[#5e6ad2]/20">
            Tom: {toneLabel}
          </span>
        </div>
      </div>

      {/* Paleta de Cores da Marca */}
      <div className="space-y-1.5 pt-3 border-t border-[rgba(255,255,255,0.06)]">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8a8f98]">
          Paleta da Empresa
        </span>
        <div className="flex items-center gap-2">
          {colors.map((c, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 bg-[#0f1011] px-2 py-1 rounded border border-[rgba(255,255,255,0.06)]"
              title={`${c.label}: ${c.hex}`}
            >
              <span
                className="size-3 rounded-full border border-black/40 shadow-xs"
                style={{ backgroundColor: c.hex }}
              />
              <span className="text-[10px] font-mono text-[#d0d6e0]">{c.hex}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rodapé do Card: Ações */}
      <div className="pt-2 flex items-center justify-between gap-2">
        <Link
          href={`/geracao/instagram/posts?empresa=${company.id}`}
          className="h-8 px-3.5 rounded-md bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-[12px] font-medium transition-all shadow-[0_1px_2px_rgba(0,0,0,0.4)] active:scale-[0.98] inline-flex items-center gap-1.5"
        >
          <SparklesIcon className="size-3.5" />
          <span>Gerar Artes</span>
        </Link>

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(company.id)}
            disabled={isDeleting}
            title="Excluir Empresa"
            className="size-8 rounded-md bg-[rgba(255,255,255,0.02)] hover:bg-red-500/10 border border-[rgba(255,255,255,0.08)] hover:border-red-500/20 text-[#8a8f98] hover:text-red-400 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <SpinnerIcon className="size-3.5 animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
