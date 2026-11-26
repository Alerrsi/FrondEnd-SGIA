import type { ReportCell, ReportColumnType } from '@sgia/api-client';

import { formatIsoDate } from './period';

/*
 * Formato de las celdas de la vista previa igual al del Excel (`XlsxWriter`): fechas `dd-mm-aaaa`,
 * fecha-hora en hora de Chile, montos `$ 1.990.000`, enteros con punto de miles y años sin separador.
 */

const CHILE_TZ = 'America/Santiago';

/** Punto de miles siempre (Intl en español no agrupa los números de 4 cifras: daría «1990»). */
export function groupThousands(value: number): string {
  const rounded = Math.round(Math.abs(value));
  const grouped = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return value < 0 && rounded !== 0 ? `-${grouped}` : grouped;
}

function toNumber(value: ReportCell): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  return null;
}

const dateTimeParts = new Intl.DateTimeFormat('es-CL', {
  timeZone: CHILE_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function chileParts(date: Date): Record<string, string> {
  const parts: Record<string, string> = {};
  for (const part of dateTimeParts.formatToParts(date)) parts[part.type] = part.value;
  return parts;
}

function formatDate(value: string): string {
  const day = value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(day) && value.length === 10) return formatIsoDate(day);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const p = chileParts(date);
  return `${p.day}-${p.month}-${p.year}`;
}

function formatDateTime(value: string): string {
  // Solo fecha: no hay hora que convertir.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return formatIsoDate(value);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const p = chileParts(date);
  return `${p.day}-${p.month}-${p.year} ${p.hour}:${p.minute}`;
}

/** Texto de una celda según el tipo de su columna. Vacío para `null`, como Excel. */
export function formatReportCell(value: ReportCell, type: ReportColumnType | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'boolean') return value ? 'sí' : 'no';

  switch (type) {
    case 'date':
      return typeof value === 'string' ? formatDate(value) : String(value);
    case 'datetime':
      return typeof value === 'string' ? formatDateTime(value) : String(value);
    case 'money': {
      const n = toNumber(value);
      if (n === null) return String(value);
      return n < 0 ? `-$ ${groupThousands(-n)}` : `$ ${groupThousands(n)}`;
    }
    case 'integer': {
      const n = toNumber(value);
      return n === null ? String(value) : groupThousands(n);
    }
    case 'year':
      return String(value);
    default:
      return String(value);
  }
}

/** Columnas numéricas: alineadas a la derecha con cifras tabulares. */
export function isNumericType(type: ReportColumnType | undefined): boolean {
  return type === 'money' || type === 'integer';
}
