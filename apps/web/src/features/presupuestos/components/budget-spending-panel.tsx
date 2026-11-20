import { useState } from 'react';
import { useBudgetSpending } from '@sgia/api-client';
import type { BudgetSpendingGroupBy } from '@sgia/types';

import { SegmentedFilter } from '@/components/shared/segmented-filter';
import { formatCLP } from '@/features/compras/lib/format';
import { STATE_TEXT_CLASS, TABLE_HEAD_CLASS } from '@/components/ui/typography';
import { SkeletonRows } from '@/components/ui/skeleton-rows';

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
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedFilter label="Agrupar gasto por" options={GROUPS} value={groupBy} onChange={setGroupBy} />
        <span className="ml-auto font-mono text-[13px] text-zinc-600 dark:text-zinc-300">
          Total {formatCLP(data?.total ?? 0)}
        </span>
      </div>
      {groupBy === 'supplier' && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Solo incluye facturas ligadas a una orden de compra.
        </p>
      )}

      <div className="relative overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full border-collapse text-left text-[13px] text-zinc-700 dark:text-zinc-300">
          <thead className={TABLE_HEAD_CLASS}>
            <tr>
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
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {isLoading && (
              <SkeletonRows columns={4} rows={4} label="Cargando gasto…" cellClassName="px-3 py-2" />
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={4} className={`px-3 py-6 ${STATE_TEXT_CLASS}`}>
                  Aún no hay facturas confirmadas en este presupuesto.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={`${row.id ?? row.label}`}>
                <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">
                  {groupBy === 'product_type' ? (TYPE_LABELS[row.label] ?? row.label) : row.label}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">{row.quantity}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">
                  {formatCLP(row.amount)}
                </td>
                <td className="px-3 py-2">
                  <div className="h-1.5 w-full min-w-16 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
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
