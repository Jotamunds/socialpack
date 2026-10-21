export const WEEK_DAYS = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
] as const;

export type WeekDayName = (typeof WEEK_DAYS)[number];

export type DaySchedule = {
  dayIndex: number; // 0..6
  dayOfWeek: WeekDayName; // "Segunda".."Domingo"
  shortDay: string; // "SEG".."DOM"
  formattedDate: string; // "26/10"
  fullDayLabel: string; // "Segunda, 26/10"
  isoDate: string; // "2026-10-26"
};

const SHORT_DAYS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * Converte string "YYYY-MM-DD" em Date local segura (sem deslocamentos UTC de fuso horário).
 */
export function parseLocalIsoDate(iso: string): Date {
  const parts = iso.split("-").map(Number);
  if (parts.length === 3 && !parts.some(Number.isNaN)) {
    return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  }
  return new Date();
}

/**
 * Encontra a Segunda-feira da semana de uma data de referência (ou da data atual).
 */
export function getMondayOfWeek(referenceDate?: string | Date): string {
  const base = typeof referenceDate === "string"
    ? parseLocalIsoDate(referenceDate)
    : referenceDate || new Date();

  const currentDay = base.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

  const monday = new Date(base.getFullYear(), base.getMonth(), base.getDate() + diffToMonday);
  return formatIsoDate(monday);
}

/**
 * Retorna a Segunda-feira da próxima semana.
 */
export function getNextMonday(referenceDate?: string | Date): string {
  const mondayIso = getMondayOfWeek(referenceDate);
  const mon = parseLocalIsoDate(mondayIso);
  mon.setDate(mon.getDate() + 7);
  return formatIsoDate(mon);
}

/**
 * Calcula o cronograma dos 7 dias da semana (Segunda a Domingo) a partir de uma data de início.
 * Se a data fornecida não for Segunda, alinha automaticamente para a Segunda-feira daquela semana.
 */
export function calculateWeekSchedule(startDateInput?: string): DaySchedule[] {
  const mondayIso = getMondayOfWeek(startDateInput);
  const monday = parseLocalIsoDate(mondayIso);

  return WEEK_DAYS.map((dayName, idx) => {
    const current = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + idx);
    const formattedDate = `${pad2(current.getDate())}/${pad2(current.getMonth() + 1)}`;
    const fullDayLabel = `${dayName}, ${formattedDate}`;
    const isoDate = formatIsoDate(current);

    return {
      dayIndex: idx,
      dayOfWeek: dayName,
      shortDay: SHORT_DAYS[idx],
      formattedDate,
      fullDayLabel,
      isoDate,
    };
  });
}

/**
 * Formata um resumo da semana legível para o usuário (ex: "26/10 a 01/11/2026").
 */
export function formatWeekRange(startDateInput?: string): string {
  const schedule = calculateWeekSchedule(startDateInput);
  const first = schedule[0];
  const last = schedule[6];
  const year = last.isoDate.split("-")[0];
  return `${first.formattedDate} a ${last.formattedDate}/${year}`;
}
