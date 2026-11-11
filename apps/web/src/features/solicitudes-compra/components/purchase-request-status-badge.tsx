import type { PurchaseRequestStatus } from '@sgia/types';

import { Badge } from '@/components/ui/badge';
import {
  PURCHASE_REQUEST_STATUS_LABEL,
  PURCHASE_REQUEST_STATUS_TONE,
} from '@/features/solicitudes-compra/lib/purchase-request-status';

export function PurchaseRequestStatusBadge({ status }: { status: PurchaseRequestStatus }) {
  return (
    <Badge tone={PURCHASE_REQUEST_STATUS_TONE[status] ?? 'neutral'} dot>
      {PURCHASE_REQUEST_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}
