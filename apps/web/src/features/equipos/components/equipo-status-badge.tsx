import type { Equipo, EquipmentStatus } from '@sgia/types';

import { Badge, type Tone } from '@/components/ui/badge';

const STATUS_TONE: Record<EquipmentStatus, Tone> = {
  operativo: 'available',
  en_mantencion: 'maintenance',
  critico: 'critical',
  baja: 'retired',
  en_prestamo: 'loaned',
};
const STATUS_LABEL: Record<EquipmentStatus, string> = {
  operativo: 'Operativo',
  en_mantencion: 'En mantención',
  critico: 'Falla crítica',
  baja: 'De baja',
  en_prestamo: 'En préstamo',
};

/** Estado operativo de un equipo (tabla y filas del teléfono). */
export function EquipoStatusBadge({ equipo }: { equipo: Equipo }) {
  const raw = (equipo.estado ?? equipo.status ?? 'operativo') as EquipmentStatus;
  return (
    <Badge tone={STATUS_TONE[raw] || 'neutral'} dot>
      {STATUS_LABEL[raw] || raw}
    </Badge>
  );
}
