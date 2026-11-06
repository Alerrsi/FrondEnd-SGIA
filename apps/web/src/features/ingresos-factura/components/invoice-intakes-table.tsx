import { useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useBudgets } from '@sgia/api-client';
import type { InvoiceIntake } from '@sgia/types';

import { formatCLP, formatDate } from '@/features/compras/lib/format';
import { InvoiceIntakeStatusBadge } from '@/components/ui/badge';
import { careerLabel } from '@/features/presupuestos/lib/budget-label';
import { cn } from '@/lib/cn';

const columnHelper = createColumnHelper<InvoiceIntake>();

interface InvoiceIntakesTableProps {
  rows: InvoiceIntake[];
  onOpen: (intake: InvoiceIntake) => void;
}

export function InvoiceIntakesTable({ rows, onOpen }: InvoiceIntakesTableProps) {
  // El listado trae `annual_budget` sin carrera: se resuelve contra los presupuestos visibles.
  const { data: budgets } = useBudgets({ per_page: 100 });
  const budgetById = useMemo(() => new Map((budgets?.data ?? []).map((b) => [b.id, b])), [budgets]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('document_number', {
        header: 'N° factura',
        cell: (info) => (
          <span className="font-mono font-semibold text-text">
            {info.getValue() ?? `#${info.row.original.id}`}
          </span>
        ),
      }),
      columnHelper.accessor('annual_budget_id', {
        header: 'Presupuesto',
        cell: (info) => {
          const budget = budgetById.get(info.getValue()) ?? info.row.original.annual_budget;
          return budget ? (
            <span className="text-text">
              {careerLabel(budget)} · <span className="font-mono">{budget.year}</span>
            </span>
          ) : (
            <span className="font-mono text-text-muted">#{info.getValue()}</span>
          );
        },
      }),
      columnHelper.accessor('purchase_id', {
        header: 'Compra',
        cell: (info) => (
          <span className="font-mono text-text-muted">
            {info.getValue() ? `#${info.getValue()}` : '—'}
          </span>
        ),
      }),
      columnHelper.accessor('total_deducted', {
        header: 'Total',
        cell: (info) => (
          <span className="font-mono tabular-nums">
            {info.getValue() ? formatCLP(info.getValue()) : '—'}
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Estado',
        cell: (info) => <InvoiceIntakeStatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor((r) => r.received_at ?? r.created_at ?? null, {
        id: 'date',
        header: 'Fecha',
        cell: (info) => (
          <span className="font-mono text-text-muted">{formatDate(info.getValue())}</span>
        ),
      }),
    ],
    [budgetById],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr
              key={hg.id}
              className="border-b border-border bg-background font-mono text-xs uppercase tracking-wider text-text-muted"
            >
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  className={cn(
                    'px-4 py-2.5 font-medium',
                    h.column.id === 'total_deducted' && 'text-right',
                  )}
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-text-muted">
                No hay ingresos de factura para el filtro seleccionado.
              </td>
            </tr>
          )}
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              tabIndex={0}
              onClick={() => onOpen(row.original)}
              onKeyDown={(e) => e.key === 'Enter' && onOpen(row.original)}
              className="cursor-pointer transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 focus:outline-none focus:bg-zinc-50 dark:focus:bg-zinc-800/50"
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={cn('px-4 py-2.5', cell.column.id === 'total_deducted' && 'text-right')}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
