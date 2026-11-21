import type { IncidentStatus } from '@sgia/types';

import type { Tone } from '@/theme';

/** Mismos nombres y tonos que el web (`apps/web/src/features/novedades/lib/incident-labels.ts`). */
export const INCIDENT_STATUS_META: Record<IncidentStatus, { label: string; tone: Tone }> = {
  reportado: { label: 'Reportado', tone: 'neutral' },
  en_revision: { label: 'En revisión', tone: 'info' },
  en_reparacion: { label: 'En reparación', tone: 'warn' },
  resuelto: { label: 'Resuelto', tone: 'ok' },
  reparado: { label: 'Reparado', tone: 'ok' },
  descartado: { label: 'Descartado', tone: 'neutral' },
  dado_de_baja: { label: 'Dado de baja', tone: 'neutral' },
};
