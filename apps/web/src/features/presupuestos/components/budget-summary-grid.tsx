import { useMemo } from 'react';
import type { BudgetSummaryRow } from '@sgia/types';

import { BudgetCard } from '@/features/presupuestos/components/budget-card';
import { careerLabel } from '@/features/presupuestos/lib/budget-label';

interface BudgetSummaryGridProps {
  rows: BudgetSummaryRow[];
  canManage: boolean;
  onOpen: (row: BudgetSummaryRow) => void;
  onEdit: (row: BudgetSummaryRow) => void;
  onDelete: (row: BudgetSummaryRow) => void;
}

/** Presupuestos del año en tarjetas: 1 columna en móvil, 2 en tablet y hasta 3 en escritorio. */
export function BudgetSummaryGrid({ rows, ...handlers }: BudgetSummaryGridProps) {
  const sorted = useMemo(
    () => [...rows].sort((a, b) => careerLabel(a).localeCompare(careerLabel(b), 'es')),
    [rows],
  );

  if (sorted.length === 0) {
    return (
      <div className="py-10 text-center text-xs text-zinc-400">
        No hay presupuestos para el año seleccionado.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((row) => (
        <BudgetCard key={row.id} budget={row} {...handlers} />
      ))}
    </div>
  );
}
