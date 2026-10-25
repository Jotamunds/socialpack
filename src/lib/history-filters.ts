import { categories, findNiche } from "@/lib/catalog";
import {
  HistoryCompanyIdSchema,
  HistoryNicheIdSchema,
  HistoryPeriodSchema,
  HistoryPostsFilterSchema,
  HistorySearchSchema,
  type HistoryPeriod,
  type HistoryPostsFilter,
} from "@/lib/schemas";

export type { HistoryPeriod, HistoryPostsFilter };

/**
 * Filtros do histórico de posts, reutilizáveis pela página e por um download
 * futuro (ZIP) dos mesmos resultados.
 *
 * Query params:
 * - `empresa` — UUID da empresa. Ausente = todas as empresas do usuário.
 * - `nicho` — id de `companies.niche_id`, restrito ao catálogo. Ausente = todos.
 * - `periodo` — `7d` ou `30d`, aplicado em `posts.created_at` (UTC). Ausente = todo o histórico.
 * - `busca` — texto (máx. 80) em `headline`, `theme` e `caption`. Ausente = sem busca.
 *
 * Status não é parâmetro. O acervo lista somente `status = completed`.
 * Permissão não vem destes params: a consulta continua presa ao `user.id` da sessão.
 */
export const HISTORY_FILTER_QUERY_KEYS = ["empresa", "nicho", "periodo", "busca"] as const;

/** Select com inner join exigido pelo filtro `nicho`. */
export const HISTORY_POSTS_SELECT = "*, companies!inner(name, niche_id)";

const SEARCH_COLUMNS = ["headline", "theme", "caption"] as const;

const PERIOD_DAYS: Record<HistoryPeriod, number> = {
  "7d": 7,
  "30d": 30,
};

export type HistoryNicheOption = {
  id: string;
  label: string;
};

type FilterBuilder = {
  eq(column: string, value: string): FilterBuilder;
  gte(column: string, value: string): FilterBuilder;
  or(filters: string): FilterBuilder;
};

function toParamRecord(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object") return {};

  if (typeof URLSearchParams !== "undefined" && input instanceof URLSearchParams) {
    const record: Record<string, string> = {};
    for (const key of HISTORY_FILTER_QUERY_KEYS) {
      const value = input.get(key);
      if (value != null) record[key] = value;
    }
    return record;
  }

  return input as Record<string, unknown>;
}

function readParam(source: Record<string, unknown>, key: string): string | undefined {
  const value = source[key];
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === "string");
    return typeof first === "string" ? first : undefined;
  }
  return undefined;
}

function parseField<T>(schema: { safeParse(value: string): { success: true; data: T } | { success: false } }, value: string | undefined): T | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = schema.safeParse(trimmed);
  return parsed.success ? parsed.data : undefined;
}

/**
 * Lê query params (objeto do Next, URLSearchParams ou objeto já parseado)
 * e descarta campo inválido sem derrubar os demais.
 */
export function parseHistoryFilters(input: unknown): HistoryPostsFilter {
  const source = toParamRecord(input);
  const candidate: Record<string, string> = {};

  const empresa = parseField(HistoryCompanyIdSchema, readParam(source, "empresa"));
  const busca = parseField(HistorySearchSchema, readParam(source, "busca"));
  const periodo = parseField(HistoryPeriodSchema, readParam(source, "periodo"));
  const nicho = parseField(HistoryNicheIdSchema, readParam(source, "nicho"));

  if (empresa) candidate.empresa = empresa;
  if (busca) candidate.busca = busca;
  if (periodo) candidate.periodo = periodo;
  if (nicho) candidate.nicho = nicho;

  const parsed = HistoryPostsFilterSchema.safeParse(candidate);
  return parsed.success ? parsed.data : {};
}

export function serializeHistoryFilters(filters: HistoryPostsFilter): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.empresa) params.set("empresa", filters.empresa);
  if (filters.nicho) params.set("nicho", filters.nicho);
  if (filters.periodo) params.set("periodo", filters.periodo);
  if (filters.busca) params.set("busca", filters.busca);
  return params;
}

export function hasActiveHistoryFilters(filters: HistoryPostsFilter): boolean {
  return Boolean(filters.empresa || filters.busca || filters.periodo || filters.nicho);
}

export function historyPeriodStartIso(periodo: HistoryPeriod, now: Date = new Date()): string {
  const start = new Date(now.getTime());
  start.setUTCDate(start.getUTCDate() - PERIOD_DAYS[periodo]);
  return start.toISOString();
}

/** Escapa curingas do LIKE (`%`, `_` e `\`). */
export function escapeHistorySearchTerm(term: string): string {
  return term.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** Aspas exigidas pelo PostgREST quando o valor tem vírgula, ponto ou espaço. */
export function quotePostgrestFilterValue(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function buildHistorySearchOr(term: string): string {
  const pattern = quotePostgrestFilterValue(`%${escapeHistorySearchTerm(term)}%`);
  return SEARCH_COLUMNS.map((column) => `${column}.ilike.${pattern}`).join(",");
}

/**
 * Aplica somente os filtros opcionais. Quem chama continua responsável por
 * `user_id` da sessão e por `status = completed`.
 * O select precisa ser `HISTORY_POSTS_SELECT` para o `nicho` entrar no join.
 */
export function applyHistoryPostFilters<Q>(
  query: Q,
  filters: HistoryPostsFilter,
  now: Date = new Date()
): Q {
  let builder = query as unknown as FilterBuilder;

  if (filters.empresa) {
    builder = builder.eq("company_id", filters.empresa);
  }
  if (filters.nicho) {
    builder = builder.eq("companies.niche_id", filters.nicho);
  }
  if (filters.periodo) {
    builder = builder.gte("created_at", historyPeriodStartIso(filters.periodo, now));
  }
  if (filters.busca) {
    builder = builder.or(buildHistorySearchOr(filters.busca));
  }

  return builder as unknown as Q;
}

function historyNicheLabel(nicheId: string, categoryId?: string): string {
  if (categoryId) {
    const match = findNiche(categoryId, nicheId);
    if (match) return match.label;
  }
  for (const category of categories) {
    const niche = category.niches.find((item) => item.id === nicheId);
    if (niche) return niche.label;
  }
  return nicheId;
}

/** Nichos distintos das empresas do usuário, mais o nicho selecionado se for válido. */
export function historyNicheOptions(
  companies: { category_id: string; niche_id: string }[],
  selectedNicheId?: string
): HistoryNicheOption[] {
  const byId = new Map<string, HistoryNicheOption>();

  function add(nicheId: string, categoryId?: string) {
    if (byId.has(nicheId)) return;
    if (!HistoryNicheIdSchema.safeParse(nicheId).success) return;
    byId.set(nicheId, {
      id: nicheId,
      label: historyNicheLabel(nicheId, categoryId),
    });
  }

  for (const company of companies) {
    add(company.niche_id, company.category_id);
  }
  if (selectedNicheId) add(selectedNicheId);

  return [...byId.values()].sort((left, right) => left.label.localeCompare(right.label, "pt-BR"));
}
