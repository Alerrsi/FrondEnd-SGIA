import type { EquipmentUnitStatus } from '@sgia/types';

import { Badge, type Tone } from '@/components/ui/badge';

const STATUS_META: Record<EquipmentUnitStatus, { label: string; tone: Tone }> = {
  disponible: { label: 'Disponible', tone: 'available' },
  prestado: { label: 'Prestado', tone: 'loaned' },
  en_reparacion: { label: 'En reparación', tone: 'maintenance' },
  dado_de_baja: { label: 'De baja', tone: 'retired' },
};

export const UNIT_STATUS_LABELS: Record<EquipmentUnitStatus, string> = {
  disponible: STATUS_META.disponible.label,
  prestado: STATUS_META.prestado.label,
  en_reparacion: STATUS_META.en_reparacion.label,
  dado_de_baja: STATUS_META.dado_de_baja.label,
};

export function UnidadStatusBadge({ status }: { status: EquipmentUnitStatus }) {
  const meta = STATUS_META[status] ?? { label: status, tone: 'neutral' as Tone };
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}
