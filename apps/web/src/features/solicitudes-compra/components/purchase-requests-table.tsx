import { useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { MIN_PURCHASE_REQUEST_QUOTATIONS, type PurchaseRequest } from '@sgia/types';

import { formatDate } from '@/features/compras/lib/format';
import { careerLabel } from '@/features/presupuestos/lib/budget-label';
import { PurchaseRequestStatusBadge } from '@/features/solicitudes-compra/components/purchase-request-status-badge';
import { cn } from '@/lib/cn';
import { CODE_CHIP_CLASS, STATE_TEXT_CLASS, TABLE_HEAD_CLASS } from '@/components/ui/typography';

const columnHelper = createColumnHelper<PurchaseRequest>();

interface PurchaseRequestsTableProps {
  rows: PurchaseRequest[];
  onOpen: (request: PurchaseRequest) => void;
}

const NUMERIC = new Set(['items', 'quotations']);

export function PurchaseRequestsTable({ rows, onOpen }: PurchaseRequestsTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: 'Código',
        cell: (info) => (
          <span className={CODE_CHIP_CLASS}>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('annual_budget', {
        header: 'Presupuesto',
        cell: (info) => {
          const budget = info.getValue();
          return budget ? (
            <span className="text-zinc-700 dark:text-zinc-300">
              {careerLabel(budget)} · <span className="font-mono">{budget.year}</span>
            </span>
          ) : (
            <span className="font-mono text-zinc-500">#{info.row.original.annual_budget_id}</span>
          );
        },
      }),
      columnHelper.accessor((r) => r.items.length, {
        id: 'items',
        header: 'Ítems',
        cell: (info) => <span className="font-mono tabular-nums">{info.getValue()}</span>,
      }),
      columnHelper.accessor('quotations_count', {
        id: 'quotations',
        header: 'Cotizaciones',
        cell: (info) => {
          const n = info.getValue();
          return (
            <span
              className={cn(
                'font-mono tabular-nums',
                n >= MIN_PURCHASE_REQUEST_QUOTATIONS
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-zinc-500',
              )}
            >
              {n}/{MIN_PURCHASE_REQUEST_QUOTATIONS}
            </span>
          );
        },
      }),
      columnHelper.accessor('status', {
        header: 'Estado',
        cell: (info) => <PurchaseRequestStatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor('creator_name', {
        header: 'Creada por',
        cell: (info) => (
          <span className="text-zinc-600 dark:text-zinc-400">{info.getValue() ?? '—'}</span>
        ),
      }),
      columnHelper.accessor('created_at', {
        header: 'Fecha',
        cell: (info) => (
          <span className="font-mono text-zinc-500">{formatDate(info.getValue())}</span>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr
              key={hg.id}
              className={TABLE_HEAD_CLASS}
            >
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  className={cn('px-4 py-2.5 font-medium', NUMERIC.has(h.column.id) && 'text-right')}
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className={`px-4 py-10 ${STATE_TEXT_CLASS}`}>
                No hay solicitudes de compra para el filtro seleccionado.
              </td>
            </tr>
          )}
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              tabIndex={0}
              onClick={() => onOpen(row.original)}
              onKeyDown={(e) => e.key === 'Enter' && onOpen(row.original)}
              className="cursor-pointer transition-colors hover:bg-zinc-50/80 focus:bg-zinc-50 focus:outline-none dark:hover:bg-zinc-800/40 dark:focus:bg-zinc-800/50"
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={cn('px-4 py-2.5', NUMERIC.has(cell.column.id) && 'text-right')}
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
