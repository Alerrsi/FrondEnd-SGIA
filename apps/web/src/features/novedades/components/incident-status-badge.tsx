import type { IncidentStatus } from '@sgia/types';

import { Badge } from '@/components/ui/badge';
import { INCIDENT_STATUS_META } from '@/features/novedades/lib/incident-labels';

export function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  const meta = INCIDENT_STATUS_META[status] ?? { label: status, tone: 'neutral' as const };
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}
