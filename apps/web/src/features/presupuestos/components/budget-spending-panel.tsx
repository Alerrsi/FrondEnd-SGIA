import { useState } from 'react';
import { useBudgetSpending } from '@sgia/api-client';
import type { BudgetSpendingGroupBy } from '@sgia/types';

import { Button } from '@/components/ui/button';
import { formatCLP } from '@/features/compras/lib/format';

const GROUPS: Array<{ value: BudgetSpendingGroupBy; label: string }> = [
  { value: 'product', label: 'Producto' },
  { value: 'product_type', label: 'Tipo' },
  { value: 'supplier', label: 'Proveedor' },
];

const TYPE_LABELS: Record<string, string> = {
  insumo: 'Insumo',
  equipo: 'Equipo',
  maqueta: 'Maqueta',
};

/** Gasto confirmado agrupado; barra proporcional al mayor monto (una sola magnitud, un solo tono). */
export function BudgetSpendingPanel({ budgetId }: { budgetId: number }) {
  const [groupBy, setGroupBy] = useState<BudgetSpendingGroupBy>('product');
  const { data, isLoading } = useBudgetSpending(budgetId, groupBy);
  const rows = data?.data ?? [];
  const max = Math.max(1, ...rows.map((r) => r.amount));

  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex flex-wrap items-center gap-1"
        role="group"
        aria-label="Agrupar gasto por"
      >
        {GROUPS.map((g) => (
          <Button
            key={g.value}
            size="sm"
            variant={groupBy === g.value ? 'primary' : 'outline'}
            aria-pressed={groupBy === g.value}
            onClick={() => setGroupBy(g.value)}
          >
            {g.label}
          </Button>
        ))}
        <span className="ml-auto font-mono text-xs text-text-muted">
          Total {formatCLP(data?.total ?? 0)}
        </span>
      </div>
      {groupBy === 'supplier' && (
        <p className="text-xs text-text-muted">
          Solo incluye facturas ligadas a una orden de compra.
        </p>
      )}

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-background font-mono text-xs uppercase tracking-wider text-text-muted">
              <th className="px-3 py-2 font-medium">
                {GROUPS.find((g) => g.value === groupBy)?.label}
              </th>
              <th className="px-3 py-2 text-right font-medium">Cant.</th>
              <th className="px-3 py-2 text-right font-medium">Monto</th>
              <th className="w-32 px-3 py-2 font-medium">
                <span className="sr-only">Proporción</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-text-muted">
                  Cargando gasto…
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-text-muted">
                  Aún no hay facturas confirmadas en este presupuesto.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={`${row.id ?? row.label}`}>
                <td className="px-3 py-2 text-text">
                  {groupBy === 'product_type' ? (TYPE_LABELS[row.label] ?? row.label) : row.label}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">{row.quantity}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">
                  {formatCLP(row.amount)}
                </td>
                <td className="px-3 py-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
                    <div
                      className="h-full rounded-full bg-zinc-700 dark:bg-zinc-300"
                      style={{ width: `${(row.amount / max) * 100}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
