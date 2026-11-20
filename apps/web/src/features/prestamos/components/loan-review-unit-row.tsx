import type { LoanReviewUnit } from '@sgia/types';
import { MapPin } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

interface LoanReviewUnitRowProps {
  unit: LoanReviewUnit;
  changed: boolean;
}

export function LoanReviewUnitRow({ unit, changed }: LoanReviewUnitRowProps) {
  return (
    <li
      data-testid={`unidad-${unit.code}`}
      className="rounded-md border border-zinc-200 bg-white px-2.5 py-2 text-[13px] dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-code text-xs text-zinc-900 dark:text-zinc-100">{unit.code}</span>
        {changed && <Badge tone="warning">Cambiada</Badge>}
      </div>
      <span className="block font-code text-xs text-zinc-500 dark:text-zinc-400">
        N/S: {unit.serial_number || '—'}
      </span>
      <span className="mt-0.5 flex items-center gap-1 text-xs text-zinc-700 dark:text-zinc-300">
        <MapPin aria-hidden="true" className="h-3 w-3 shrink-0 text-zinc-400" />
        <span>
          {unit.location?.nombre ?? 'Sala sin registrar'} ·{' '}
          <span className="font-code text-xs">{unit.cajon?.codigo ?? 'Cajón sin registrar'}</span>
          {unit.cajon?.descripcion ? ` (${unit.cajon.descripcion})` : ''}
        </span>
      </span>
    </li>
  );
}
