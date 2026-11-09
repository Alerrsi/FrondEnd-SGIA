import type { IncidentStatus } from '@sgia/types';

export const INCIDENT_STATUS_META: Record<
  IncidentStatus,
  { label: string; background: string; color: string }
> = {
  reportado: { label: 'Reportado', background: '#fef3c7', color: '#b45309' },
  en_revision: { label: 'En revisión', background: '#dbeafe', color: '#1d4ed8' },
  en_reparacion: { label: 'En reparación', background: '#dbeafe', color: '#1d4ed8' },
  resuelto: { label: 'Resuelto', background: '#d1fae5', color: '#047857' },
  reparado: { label: 'Reparado', background: '#d1fae5', color: '#047857' },
  descartado: { label: 'Descartado', background: '#f3f4f6', color: '#4b5563' },
  dado_de_baja: { label: 'Dado de baja', background: '#f3f4f6', color: '#4b5563' },
};
