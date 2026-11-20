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
import { InvoiceIntakeStatusBadge } from '@/features/ingresos-factura/components/invoice-intake-status-badge';
import { careerLabel } from '@/features/presupuestos/lib/budget-label';
import { cn } from '@/lib/cn';
import { EmptyState } from '@/components/ui/empty-state';
import { ROW_CLASS, STICKY_COL_CLASS, TD_CLASS, TH_CLASS } from '@/components/ui/table-styles';
import { CODE_CHIP_CLASS, TABLE_HEAD_CLASS } from '@/components/ui/typography';

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
          <span className={CODE_CHIP_CLASS}>
            {info.getValue() ?? `#${info.row.original.id}`}
          </span>
        ),
      }),
      columnHelper.accessor('annual_budget_id', {
        header: 'Presupuesto',
        cell: (info) => {
          const budget = budgetById.get(info.getValue()) ?? info.row.original.annual_budget;
          return budget ? (
            <span className="whitespace-nowrap">
              {careerLabel(budget)} · <span className="font-mono">{budget.year}</span>
            </span>
          ) : (
            <span className="font-mono text-zinc-500 dark:text-zinc-400">#{info.getValue()}</span>
          );
        },
      }),
      columnHelper.accessor('purchase_id', {
        header: 'Compra',
        cell: (info) => (
          <span className="font-mono text-zinc-500 dark:text-zinc-400">
            {info.getValue() ? `#${info.getValue()}` : '—'}
          </span>
        ),
      }),
      columnHelper.accessor('total_deducted', {
        header: 'Total',
        cell: (info) => (
          <span className="whitespace-nowrap font-mono">
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
          <span className="whitespace-nowrap font-mono text-zinc-500 dark:text-zinc-400">{formatDate(info.getValue())}</span>
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

  if (rows.length === 0) {
    return <EmptyState title="No hay ingresos de factura para el filtro seleccionado." />;
  }

  return (
    <table className="w-full min-w-[820px] border-collapse text-left">
      <thead className={TABLE_HEAD_CLASS}>
        {table.getHeaderGroups().map((hg) => (
          <tr key={hg.id}>
            {hg.headers.map((h, index) => (
              <th
                key={h.id}
                className={cn(
                  TH_CLASS,
                  h.column.id === 'total_deducted' && 'text-right',
                  index === 0 && `${STICKY_COL_CLASS} max-md:bg-zinc-50`,
                )}
              >
                {flexRender(h.column.columnDef.header, h.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr
            key={row.id}
            tabIndex={0}
            onClick={() => onOpen(row.original)}
            onKeyDown={(e) => e.key === 'Enter' && onOpen(row.original)}
            className={`${ROW_CLASS} cursor-pointer focus:outline-none focus-visible:bg-zinc-50 dark:focus-visible:bg-zinc-800/40`}
          >
            {row.getVisibleCells().map((cell, index) => (
              <td
                key={cell.id}
                className={cn(
                  TD_CLASS,
                  cell.column.id === 'total_deducted' && 'text-right',
                  index === 0 && `${STICKY_COL_CLASS} whitespace-nowrap`,
                )}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
