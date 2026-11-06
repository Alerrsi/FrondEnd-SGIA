import { AlertTriangle } from 'lucide-react';

import { formatCLP } from '@/features/compras/lib/format';
import { cn } from '@/lib/cn';

interface BudgetFreeAmountProps {
  amount: number;
  className?: string;
}

/** Monto libre (lo gastable); en rojo y con aviso si quedó negativo tras un exceso autorizado. */
export function BudgetFreeAmount({ amount, className }: BudgetFreeAmountProps) {
  const negative = amount < 0;
  return (
    <span
      className={cn(
        'font-mono tabular-nums',
        negative && 'text-rose-600 dark:text-rose-400',
        className,
      )}
    >
      {formatCLP(amount)}
      {negative && (
        <span className="ml-1.5 inline-flex items-center gap-1 font-sans text-[11px] font-normal">
          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
          Sobre el presupuesto (exceso autorizado)
        </span>
      )}
    </span>
  );
}
