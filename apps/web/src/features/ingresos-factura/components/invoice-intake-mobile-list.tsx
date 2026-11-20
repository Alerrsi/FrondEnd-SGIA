import type { InvoiceIntake } from '@sgia/types';

import { MobileRow } from '@/components/ui/mobile-row';
import { formatCLP, formatDate } from '@/features/compras/lib/format';
import { InvoiceIntakeStatusBadge } from '@/features/ingresos-factura/components/invoice-intake-status-badge';

interface InvoiceIntakeMobileListProps {
  rows: InvoiceIntake[];
  onOpen: (intake: InvoiceIntake) => void;
}

/** Ingresos de factura como filas apiladas, para teléfonos (va en `TableFrame mobile`). */
export function InvoiceIntakeMobileList({ rows, onOpen }: InvoiceIntakeMobileListProps) {
  return (
    <ul>
      {rows.map((intake) => (
        <MobileRow
          key={intake.id}
          title={<span className="font-code text-[13px]">{intake.document_number ?? `#${intake.id}`}</span>}
          meta={`${intake.total_deducted ? formatCLP(intake.total_deducted) : '—'} · ${formatDate(intake.received_at ?? intake.created_at ?? null)}`}
          trailing={<InvoiceIntakeStatusBadge status={intake.status} />}
          onClick={() => onOpen(intake)}
        />
      ))}
    </ul>
  );
}
