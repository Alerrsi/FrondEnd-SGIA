import { getBlobResponse } from '../http';
import { buildQuery } from './shared';

// Reportes en Excel por módulo (BackEnd-SGIA/docs/reportes-excel.md): `GET /api/<recurso>/export`
// con los mismos filtros del listado. Sin filtros, el backend entrega el reporte completo.

export type ReportParamValue = string | number | boolean | undefined | null;
export type ReportParams = Record<string, ReportParamValue>;

export interface ExportReportOptions {
  /** Prefijo del nombre si el backend no envía `Content-Disposition` (se completa con fecha y hora). */
  fallbackName?: string;
}

export interface ExportedReport {
  blob: Blob;
  filename: string;
  /** `true` si el backend cortó el reporte en el tope de filas (`X-Report-Truncated: 1`). */
  truncated: boolean;
}

/** Lee el nombre de `Content-Disposition` (`filename*=UTF-8''…` tiene prioridad sobre `filename="…"`). */
export function filenameFromDisposition(header: string | null | undefined): string | null {
  if (!header) return null;
  const encoded = /filename\*\s*=\s*(?:UTF-8|utf-8)?''([^;]+)/.exec(header);
  if (encoded?.[1]) {
    try {
      const name = decodeURIComponent(encoded[1].trim().replace(/^"|"$/g, ''));
      if (name) return name;
    } catch {
      // Codificación inválida: se intenta con `filename=`.
    }
  }
  const plain = /filename\s*=\s*("([^"]*)"|[^;]+)/.exec(header);
  const name = (plain?.[2] ?? plain?.[1] ?? '').trim();
  return name || null;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** `<prefijo>-AAAAMMDD-HHMMSS.xlsx` con la hora local, igual al formato del backend. */
export function fallbackReportFilename(prefix: string, now: Date = new Date()): string {
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${prefix}-${date}-${time}.xlsx`;
}

/** `/products/export` → `products`; `/purchase-requests/export?x=1` → `purchase-requests`. */
function prefixFromPath(path: string): string {
  const segments = path.split('?')[0]?.split('/').filter((s) => s && s !== 'api' && s !== 'export') ?? [];
  return segments[segments.length - 1] ?? 'reporte';
}

/**
 * Descarga un reporte `.xlsx`. Omite los parámetros vacíos y envía los booleanos como `1`/`0`.
 * `path` puede traer parámetros fijos (`/loans/export?format=excel`); los filtros se agregan detrás.
 */
export async function exportReport(
  path: string,
  params?: ReportParams,
  options?: ExportReportOptions,
): Promise<ExportedReport> {
  const qs = buildQuery(params);
  const url = qs ? `${path}${path.includes('?') ? `&${qs.slice(1)}` : qs}` : path;
  const { blob, headers } = await getBlobResponse(url, {
    headers: {
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json',
    },
  });
  const filename =
    filenameFromDisposition(headers.get('Content-Disposition')) ??
    fallbackReportFilename(options?.fallbackName ?? prefixFromPath(path));
  return { blob, filename, truncated: headers.get('X-Report-Truncated') === '1' };
}

/** `true` si algún filtro tiene valor (el reporte sale filtrado y no completo). */
export function hasReportFilters(params?: ReportParams): boolean {
  return buildQuery(params) !== '';
}
