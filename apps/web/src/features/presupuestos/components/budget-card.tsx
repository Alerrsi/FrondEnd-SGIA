import type { BudgetSummaryRow } from '@sgia/types';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCLP } from '@/features/compras/lib/format';
import { BudgetFreeAmount } from '@/features/presupuestos/components/budget-free-amount';
import { BudgetExecutionBar } from '@/features/presupuestos/components/budget-execution-bar';
import { careerLabel } from '@/features/presupuestos/lib/budget-label';

interface BudgetCardProps {
  budget: BudgetSummaryRow;
  canManage: boolean;
  onOpen: (row: BudgetSummaryRow) => void;
  onEdit: (row: BudgetSummaryRow) => void;
  onDelete: (row: BudgetSummaryRow) => void;
}

/** Tarjeta de un presupuesto anual: disponible destacado, ejecución y desglose. Clic → detalle. */
export function BudgetCard({ budget, canManage, onOpen, onEdit, onDelete }: BudgetCardProps) {
  const label = careerLabel(budget);
  const code = budget.career?.code;
  const name = budget.career?.name ?? label;

  return (
    <article
      tabIndex={0}
      aria-label={`Presupuesto ${budget.year} de ${label}`}
      onClick={() => onOpen(budget)}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onOpen(budget);
        }
      }}
      className="group flex cursor-pointer flex-col gap-3 rounded-md border border-border bg-surface p-3.5 shadow-xs transition-colors hover:border-zinc-300 dark:hover:border-zinc-700 focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600"
    >
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {code && (
              <span className="rounded border border-border bg-surface-raised px-1.5 py-0.5 font-mono text-xs text-text">
                {code}
              </span>
            )}
            <span className="font-mono text-xs text-text-muted">
              {budget.year}
            </span>
          </div>
          <h3 className="mt-1 truncate text-sm font-semibold text-text" title={name}>
            {name}
          </h3>
        </div>

        {canManage && (
          <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`Acciones de ${label} ${budget.year}`}
                  className="rounded p-1 text-text-muted hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onEdit(budget)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Editar monto inicial
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => onDelete(budget)}
                  className="text-danger"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </header>

      <div>
        <div className="text-xs font-mono uppercase tracking-wider text-text-muted">
          Libre (gastable)
        </div>
        <BudgetFreeAmount
          amount={budget.free_amount}
          className="block text-lg font-semibold text-text"
        />
      </div>

      <BudgetExecutionBar
        initial={budget.initial_amount}
        consumed={budget.consumed_amount}
        reserved={budget.reserved_amount}
        percent={budget.execution_percent}
        barClassName="flex-1"
      />

      <dl className="grid grid-cols-3 gap-2 border-t border-zinc-100 dark:border-zinc-800/60 pt-2.5 text-xs">
        {(
          [
            ['Inicial', budget.initial_amount],
            ['Reservado (OC pend.)', budget.reserved_amount],
            ['Consumido (facturado)', budget.consumed_amount],
          ] as const
        ).map(([term, value]) => (
          <div key={term} className="min-w-0">
            <dt className="text-xs text-text-muted">{term}</dt>
            <dd className="truncate font-mono tabular-nums text-text">
              {formatCLP(value)}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
