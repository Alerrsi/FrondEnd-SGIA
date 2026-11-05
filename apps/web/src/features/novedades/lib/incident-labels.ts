import type { IncidentStatus } from '@sgia/types';

import type { Tone } from '@/components/ui/badge';

export const INCIDENT_STATUS_META: Record<IncidentStatus, { label: string; tone: Tone }> = {
  reportado: { label: 'Reportado', tone: 'neutral' },
  en_revision: { label: 'En revisión', tone: 'loaned' },
  en_reparacion: { label: 'En reparación', tone: 'warning' },
  resuelto: { label: 'Resuelto', tone: 'success' },
  descartado: { label: 'Descartado', tone: 'retired' },
  reparado: { label: 'Reparado', tone: 'success' },
  dado_de_baja: { label: 'Dado de baja', tone: 'retired' },
};

export const INCIDENT_STATUS_FILTERS: Array<{ value: IncidentStatus | ''; label: string }> = [
  { value: 'reportado', label: 'Reportados' },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'en_reparacion', label: 'En reparación' },
  { value: '', label: 'Todos' },
];

/** Etiqueta del botón que lleva al informe al estado indicado. */
export const INCIDENT_TRANSITION_LABELS: Partial<Record<IncidentStatus, string>> = {
  en_revision: 'Pasar a revisión',
  en_reparacion: 'Marcar en reparación',
  resuelto: 'Marcar resuelto',
  descartado: 'Descartar',
  reparado: 'Marcar reparado',
  dado_de_baja: 'Dar de baja',
};
