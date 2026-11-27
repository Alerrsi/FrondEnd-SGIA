import type { ReportParams } from '@sgia/api-client';
import type { ReportSubscription, ReportSubscriptionFrequency } from '@sgia/types';

import type { ReportDefinition } from '../catalog';
import type { ReportFilterValues } from './report-params';

export const FREQUENCY_LABEL: Record<ReportSubscriptionFrequency, string> = {
  weekly: 'semanal',
  monthly: 'mensual',
  semester: 'semestral',
};

const WHEN: Record<ReportSubscriptionFrequency, { title: string; day: string; period: string }> = {
  weekly: { title: 'Semanal', day: 'Cada lunes', period: 'la semana anterior' },
  monthly: { title: 'Mensual', day: 'El día 1 de cada mes', period: 'el mes anterior' },
  semester: { title: 'Semestral', day: 'El 1 de enero y el 1 de julio', period: 'el semestre que terminó' },
};

export const FREQUENCIES = Object.keys(WHEN) as ReportSubscriptionFrequency[];

/** Qué manda cada frecuencia según el tipo de reporte («foto», por período o por año). */
export function frequencyOption(report: ReportDefinition, frequency: ReportSubscriptionFrequency) {
  const { title, day, period } = WHEN[frequency];
  const what =
    report.kind === 'snapshot'
      ? 'el estado de ese momento'
      : report.filters.some((f) => f.type === 'year')
        ? 'el año del período'
        : period;
  return { title, description: `${day}, ${what}.` };
}

/** Los filtros que se guardan: los de la vista previa sin el período, que se calcula en cada envío. */
export function subscriptionParams(report: ReportDefinition, params: ReportParams): Record<string, string | number | boolean> {
  const skip = new Set(['from', 'to', 'preview', ...new URLSearchParams(report.path.split('?')[1] ?? '').keys()]);
  if (report.filters.some((f) => f.type === 'year')) skip.add('year');

  const saved: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (skip.has(key) || value === undefined || value === null || value === '') continue;
    saved[key] = value;
  }
  return saved;
}

function paramsKey(params: ReportParams): string {
  return JSON.stringify(
    Object.entries(params)
      .map(([key, value]) => [key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value)])
      .sort(([a], [b]) => a!.localeCompare(b!)),
  );
}

/** Las suscripciones al mismo reporte con los mismos filtros, de cualquier frecuencia. */
export function matchingSubscriptions(
  subscriptions: ReportSubscription[],
  reportId: string,
  params: Record<string, string | number | boolean>,
): ReportSubscription[] {
  const key = paramsKey(params);
  return subscriptions.filter((s) => s.report_id === reportId && paramsKey(s.params) === key);
}

export interface NamedRecord {
  id: number | string;
  name?: string;
}

/** Los filtros elegidos en texto («Estado: Atrasados»), sin período ni año. */
export function describeFilters(
  report: ReportDefinition,
  values: ReportFilterValues,
  names: { careers: NamedRecord[]; storerooms: NamedRecord[] },
): Array<{ label: string; text: string }> {
  const described: Array<{ label: string; text: string }> = [];
  for (const filter of report.filters) {
    const raw = (values[filter.id] ?? '').trim();
    if (!raw || filter.type === 'period' || filter.type === 'year') continue;
    let text = raw;
    if (filter.type === 'select') text = filter.options.find((o) => o.value === raw)?.label ?? raw;
    if (filter.type === 'career' || filter.type === 'storeroom') {
      const list = filter.type === 'career' ? names.careers : names.storerooms;
      text = list.find((item) => String(item.id) === raw)?.name ?? raw;
    }
    described.push({ label: filter.label, text });
  }
  return described;
}
