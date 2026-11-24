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

/** «AP · Analista Programador» o el nombre solo. */
export function careerLabel(career: Pick<MaintenanceCareerSummary, 'code' | 'name'>): string {
  return career.code ? `${career.code} · ${career.name}` : career.name;
}
