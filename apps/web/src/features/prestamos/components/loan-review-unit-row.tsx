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
      className="rounded border border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 px-2.5 py-2 text-xs"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">{unit.code}</span>
        {changed && <Badge tone="warning">Cambiada</Badge>}
      </div>
      <span className="block font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
        N/S: {unit.serial_number || '—'}
      </span>
      <span className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-700 dark:text-zinc-300">
        <MapPin className="h-3 w-3 shrink-0 text-zinc-400" />
        <span>
          {unit.location?.nombre ?? 'Sala sin registrar'} ·{' '}
          <span className="font-mono">{unit.cajon?.codigo ?? 'Cajón sin registrar'}</span>
          {unit.cajon?.descripcion ? ` (${unit.cajon.descripcion})` : ''}
        </span>
      </span>
    </li>
  );
}
