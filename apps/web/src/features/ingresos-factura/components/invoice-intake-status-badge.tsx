import { InvoiceIntakeStatus } from '@sgia/types';

import { Badge, type Tone } from '@/components/ui/badge';

const META: Record<InvoiceIntakeStatus, { label: string; tone: Tone }> = {
  [InvoiceIntakeStatus.BORRADOR]: { label: 'Borrador', tone: 'warning' },
  [InvoiceIntakeStatus.CONFIRMADO]: { label: 'Confirmado', tone: 'success' },
  [InvoiceIntakeStatus.ANULADO]: { label: 'Anulado', tone: 'retired' },
};

export function InvoiceIntakeStatusBadge({ status }: { status: InvoiceIntakeStatus }) {
  const meta = META[status] ?? { label: status, tone: 'neutral' as const };
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}
