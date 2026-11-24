import type { MaintenanceCareerSummary, MaintenanceRecordQueryParams } from '@sgia/types';

/** Carrera elegida para filtrar la bandeja: id, `'none'` (productos sin carrera) o `null` (todas). */
export type CareerFilter = number | 'none' | null;

export function careerFilterOf(career: Pick<MaintenanceCareerSummary, 'career_id'>): Exclude<CareerFilter, null> {
  return career.career_id ?? 'none';
}

/** Parámetros de `GET /api/maintenance-records` para el filtro (docs/mantenciones-por-carrera.md). */
export function careerFilterParams(filter: CareerFilter): Pick<MaintenanceRecordQueryParams, 'career_id' | 'sin_carrera'> {
  if (filter === null) return {};
  return filter === 'none' ? { sin_carrera: true } : { career_id: filter };
}

/** Valor del `<select>` de carrera y vuelta. */
export function careerFilterToValue(filter: CareerFilter): string {
  return filter === null ? '' : String(filter);
}

export function careerFilterFromValue(value: string): CareerFilter {
  if (value === '') return null;
  if (value === 'none') return 'none';
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** «AP · Analista Programador» o el nombre solo. */
export function careerLabel(career: Pick<MaintenanceCareerSummary, 'code' | 'name'>): string {
  return career.code ? `${career.code} · ${career.name}` : career.name;
}
