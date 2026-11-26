import type { ReportParams } from '@sgia/api-client';

import type { ReportDefinition } from '../catalog';
import { periodRange, type PeriodRange, type PeriodValue } from './period';

/** Valor de cada filtro por su `id` (texto del control; vacío = sin filtro). */
export type ReportFilterValues = Record<string, string>;

/** Valores iniciales del reporte: `defaultValue` de cada filtro y el año actual en `year`. */
export function defaultFilterValues(report: ReportDefinition, today: Date = new Date()): ReportFilterValues {
  const values: ReportFilterValues = {};
  for (const filter of report.filters) {
    if (filter.type === 'select' && filter.defaultValue) values[filter.id] = filter.defaultValue;
    if (filter.type === 'year') values[filter.id] = String(today.getFullYear());
  }
  return values;
}

export interface ReportRequest {
  params: ReportParams;
  /** Fechas del período si el reporte lo usa y es válido. */
  range: PeriodRange | null;
  /** Motivo por el que aún no se puede pedir (período obligatorio o rango inválido). */
  blocked: string | null;
}

/**
 * Parámetros del reporte con los nombres del backend, en el orden de sus filtros. La vista previa y la
 * descarga salen de aquí, así nunca difieren (decisión 4: lo que se ve es lo que se descarga).
 */
export function buildReportRequest(
  report: ReportDefinition,
  values: ReportFilterValues,
  period: PeriodValue,
  today: Date = new Date(),
): ReportRequest {
  const params: ReportParams = {};
  let range: PeriodRange | null = null;
  let blocked: string | null = null;

  for (const filter of report.filters) {
    const raw = (values[filter.id] ?? '').trim();
    switch (filter.type) {
      case 'period':
        range = periodRange(period, today);
        if (range) {
          params.from = range.from;
          params.to = range.to;
        } else {
          blocked = filter.required
            ? 'Este informe necesita un período: elige las dos fechas del rango.'
            : 'El rango está incompleto o la fecha «hasta» es anterior a «desde».';
        }
        break;
      case 'select': {
        if (!raw) break;
        const option = filter.options.find((o) => o.value === raw);
        if (option?.params) Object.assign(params, option.params);
        else params[filter.param] = raw;
        break;
      }
      case 'search':
        if (raw) params[filter.param] = raw;
        break;
      case 'career':
      case 'storeroom':
      case 'year':
        if (raw && Number.isFinite(Number(raw))) params[filter.param] = Number(raw);
        break;
    }
  }

  return { params, range, blocked };
}
