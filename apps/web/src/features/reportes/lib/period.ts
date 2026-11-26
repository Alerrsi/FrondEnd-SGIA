/*
 * Selector de período del centro de reportes (BackEnd-SGIA/docs/centro-reportes.md, decisión 7): año,
 * semestre (`2026-1` = 1 ene–30 jun, `2026-2` = 1 jul–31 dic, la regla de `DashboardPeriod`), mes, rango y
 * «últimos 30 días». Siempre con fecha local (`toISOString` daría la de UTC: el día siguiente en la noche).
 */

export type PeriodMode = 'year' | 'semester' | 'month' | 'range' | 'last30';

export interface PeriodValue {
  mode: PeriodMode;
  year: number;
  semester: 1 | 2;
  /** 1–12. */
  month: number;
  /** Solo en `range` (`YYYY-MM-DD`). */
  from: string;
  to: string;
}

export interface PeriodRange {
  from: string;
  to: string;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** `YYYY-MM-DD` con la fecha local. */
export function toLocalIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** `2026-06-30` → `30-06-2026`; otro texto queda igual. */
export function formatIsoDate(iso: string): string {
  const match = ISO_DATE.exec(iso);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : iso;
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Por defecto, el semestre en curso. */
export function defaultPeriod(today: Date = new Date()): PeriodValue {
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const semester: 1 | 2 = month <= 6 ? 1 : 2;
  const range = semesterRange(year, semester);
  return { mode: 'semester', year, semester, month, from: range.from, to: range.to };
}

export function semesterRange(year: number, semester: 1 | 2): PeriodRange {
  return semester === 1 ? { from: `${year}-01-01`, to: `${year}-06-30` } : { from: `${year}-07-01`, to: `${year}-12-31` };
}

/** Fechas exactas del período, o `null` si el rango manual está incompleto o al revés. */
export function periodRange(value: PeriodValue, today: Date = new Date()): PeriodRange | null {
  switch (value.mode) {
    case 'year':
      return { from: `${value.year}-01-01`, to: `${value.year}-12-31` };
    case 'semester':
      return semesterRange(value.year, value.semester);
    case 'month':
      return {
        from: `${value.year}-${pad(value.month)}-01`,
        to: `${value.year}-${pad(value.month)}-${pad(lastDayOfMonth(value.year, value.month))}`,
      };
    case 'last30': {
      // Hoy y los 29 días anteriores: 30 días contando hoy.
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);
      return { from: toLocalIsoDate(start), to: toLocalIsoDate(today) };
    }
    case 'range':
      if (!ISO_DATE.test(value.from) || !ISO_DATE.test(value.to) || value.from > value.to) return null;
      return { from: value.from, to: value.to };
  }
}

/** «01-01-2026 a 30-06-2026». */
export function formatPeriodRange(range: PeriodRange): string {
  return `${formatIsoDate(range.from)} a ${formatIsoDate(range.to)}`;
}

export const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;
