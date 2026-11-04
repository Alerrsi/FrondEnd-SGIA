import type {
  MaintenanceDocumentType,
  MaintenanceExecutionMode,
  MaintenanceResult,
  MaintenanceStatus,
  MaintenanceType,
} from '@sgia/types';

import type { Tone } from '@/components/ui/badge';

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  preventiva: 'Preventiva',
  correctiva: 'Correctiva',
  calibracion: 'Calibración',
};

export const EXECUTION_MODE_LABELS: Record<MaintenanceExecutionMode, string> = {
  medios_propios: 'Medios propios',
  externa: 'Externa',
};

export const MAINTENANCE_STATUS_META: Record<MaintenanceStatus, { label: string; tone: Tone }> = {
  en_curso: { label: 'En curso', tone: 'maintenance' },
  finalizada: { label: 'Finalizada', tone: 'success' },
  anulada: { label: 'Anulada', tone: 'retired' },
};

export const MAINTENANCE_RESULT_LABELS: Record<MaintenanceResult, string> = {
  operativo: 'Operativa',
  baja: 'Dada de baja',
};

export const DOCUMENT_TYPE_LABELS: Record<MaintenanceDocumentType, string> = {
  certificado_calibracion: 'Certificado de calibración',
  informe_tecnico: 'Informe técnico',
  manual: 'Manual',
  garantia: 'Garantía',
  otro: 'Otro',
};

export const DOCUMENT_TYPES = Object.keys(DOCUMENT_TYPE_LABELS) as MaintenanceDocumentType[];

export const PRIORITY_TONE: Record<'A' | 'B' | 'C', Tone> = {
  A: 'critical',
  B: 'warning',
  C: 'neutral',
};

/** Checklist mínimo para cerrar como operativa: REV-A, REV-B y PFG (y REV-C si no es "No aplica"). */
export function checklistMissing(record: {
  rev_a_approved: boolean | null;
  rev_b_approved: boolean | null;
  rev_c_approved: boolean | null;
  pfg_approved: boolean | null;
}): string[] {
  const missing: string[] = [];
  if (!record.rev_a_approved) missing.push('REV-A');
  if (!record.rev_b_approved) missing.push('REV-B');
  if (record.rev_c_approved === false) missing.push('REV-C');
  if (!record.pfg_approved) missing.push('PFG');
  return missing;
}
