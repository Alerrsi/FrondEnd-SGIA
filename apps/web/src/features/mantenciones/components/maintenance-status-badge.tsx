import type { MaintenanceStatus } from '@sgia/types';

import { Badge } from '@/components/ui/badge';
import { MAINTENANCE_STATUS_META } from '@/features/mantenciones/lib/maintenance-labels';

export function MaintenanceStatusBadge({ status }: { status: MaintenanceStatus }) {
  const meta = MAINTENANCE_STATUS_META[status] ?? { label: status, tone: 'neutral' as const };
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}
