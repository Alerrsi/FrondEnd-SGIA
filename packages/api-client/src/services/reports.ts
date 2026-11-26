import { get, getBlobResponse } from '../http';
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

/** `path` + filtros: respeta los parámetros fijos de la ruta (`/loans/export?format=excel` → `&career_id=3`). */
export function reportUrl(path: string, params?: ReportParams): string {
  const qs = buildQuery(params);
  if (!qs) return path;
  return `${path}${path.includes('?') ? `&${qs.slice(1)}` : qs}`;
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
  const url = reportUrl(path, params);
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

// ── Centro de reportes (BackEnd-SGIA/docs/centro-reportes.md) ──────────────────────────────────────────

/** Tipo de cada columna, con los nombres de `XlsxWriter`. */
export type ReportColumnType = 'text' | 'date' | 'datetime' | 'money' | 'integer' | 'year';
export type ReportCell = string | number | boolean | null;

export interface ReportPreviewSheet {
  name: string;
  headers: string[];
  types: ReportColumnType[];
  /** Hasta 20 filas; fechas en ISO, números como número. */
  rows: ReportCell[][];
  total_rows: number;
  /** Fila de totales al pie (`null` si la hoja no tiene). */
  totals: ReportCell[] | null;
  truncated: boolean;
}

/** `GET /api/<recurso>/export?…&preview=1`: las mismas hojas que el `.xlsx`, con sus primeras filas. */
export interface ReportPreview {
  title: string;
  filename: string;
  truncated: boolean;
  sheets: ReportPreviewSheet[];
  /** Hoja «Info» como pares etiqueta · valor. */
  info: Array<[string, string]>;
}

/** Parámetros que nunca forman parte de los filtros (los pone el cliente). */
const RESERVED_PARAMS = new Set(['preview']);

/**
 * Vista previa en JSON de un reporte: la misma ruta y filtros que la descarga, más `preview=1`.
 * No se audita ni cuenta como descarga.
 */
export async function fetchReportPreview(path: string, params?: ReportParams): Promise<ReportPreview> {
  const res = await get<Partial<ReportPreview> | null>(reportUrl(path, { ...params, preview: 1 }));
  return {
    title: res?.title ?? '',
    filename: res?.filename ?? '',
    truncated: Boolean(res?.truncated),
    sheets: (res?.sheets ?? []).map((sheet) => ({
      name: sheet.name,
      headers: sheet.headers ?? [],
      types: sheet.types ?? [],
      rows: sheet.rows ?? [],
      total_rows: sheet.total_rows ?? sheet.rows?.length ?? 0,
      totals: sheet.totals ?? null,
      truncated: Boolean(sheet.truncated),
    })),
    info: res?.info ?? [],
  };
}

/** Una descarga del usuario (`GET /api/me/report-downloads`), para «Repetir». */
export interface ReportDownload {
  id: number;
  /** Clave del reporte en el backend (`loans`, `products`, …). */
  report: string;
  title: string;
  /** Filtros en texto legible: `{ "Desde": "01-01-2026" }`. */
  filters: Record<string, string>;
  /** Ruta del export (`/loans/export`). */
  path: string;
  /** Parámetros originales de la descarga. */
  query: Record<string, string | number | boolean | null>;
  rows: number | null;
  created_at: string;
}

/** Las últimas 20 descargas de reportes del usuario. */
export async function fetchMyReportDownloads(): Promise<ReportDownload[]> {
  const res = await get<{ data?: ReportDownload[] } | null>('/me/report-downloads');
  return (res?.data ?? []).map((d) => ({
    ...d,
    filters: d.filters && typeof d.filters === 'object' && !Array.isArray(d.filters) ? d.filters : {},
    query: d.query && typeof d.query === 'object' && !Array.isArray(d.query) ? d.query : {},
    rows: d.rows ?? null,
  }));
}

/**
 * Ruta y parámetros para repetir una descarga: quita `/api` del inicio (el cliente lo agrega), `preview`
 * y los parámetros que ya trae la ruta (`/loans/export?format=excel`), para no duplicarlos.
 */
export function reportDownloadRequest(download: Pick<ReportDownload, 'path' | 'query'>): {
  path: string;
  params: ReportParams;
} {
  const path = download.path.replace(/^\/?api(?=\/)/, '') || download.path;
  const fixed = new URLSearchParams(path.split('?')[1] ?? '');
  const params: ReportParams = {};
  for (const [key, value] of Object.entries(download.query ?? {})) {
    if (RESERVED_PARAMS.has(key) || fixed.has(key)) continue;
    params[key] = value;
  }
  return { path, params };
}
