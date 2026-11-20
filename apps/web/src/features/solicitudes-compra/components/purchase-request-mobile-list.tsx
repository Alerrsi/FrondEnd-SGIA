import type { PurchaseRequest } from '@sgia/types';

import { MobileRow } from '@/components/ui/mobile-row';
import { formatDate } from '@/features/compras/lib/format';
import { careerLabel } from '@/features/presupuestos/lib/budget-label';
import { PurchaseRequestStatusBadge } from '@/features/solicitudes-compra/components/purchase-request-status-badge';

interface PurchaseRequestMobileListProps {
  rows: PurchaseRequest[];
  onOpen: (request: PurchaseRequest) => void;
}

/** Solicitudes de compra como filas apiladas, para teléfonos (va en `TableFrame mobile`). */
export function PurchaseRequestMobileList({ rows, onOpen }: PurchaseRequestMobileListProps) {
  return (
    <ul>
      {rows.map((r) => (
        <MobileRow
          key={r.id}
          title={<span className="font-code text-[13px]">{r.code}</span>}
          meta={`${r.annual_budget ? `${careerLabel(r.annual_budget)} · ${r.annual_budget.year}` : `#${r.annual_budget_id}`} · ${formatDate(r.created_at)}`}
          trailing={<PurchaseRequestStatusBadge status={r.status} />}
          onClick={() => onOpen(r)}
        />
      ))}
    </ul>
  );
}
