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
import { EmptyState } from '@/components/ui/empty-state';
import { ROW_CLASS, STICKY_COL_CLASS, TD_CLASS, TH_CLASS } from '@/components/ui/table-styles';
import { CODE_CHIP_CLASS, TABLE_HEAD_CLASS } from '@/components/ui/typography';

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
            <span className="whitespace-nowrap">
              {careerLabel(budget)} · <span className="font-mono">{budget.year}</span>
            </span>
          ) : (
            <span className="font-mono text-zinc-500 dark:text-zinc-400">#{info.row.original.annual_budget_id}</span>
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
                n >= MIN_PURCHASE_REQUEST_QUOTATIONS ? 'text-ok' : 'text-zinc-500 dark:text-zinc-400',
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
          <span className="whitespace-nowrap text-zinc-600 dark:text-zinc-400">{info.getValue() ?? '—'}</span>
        ),
      }),
      columnHelper.accessor('created_at', {
        header: 'Fecha',
        cell: (info) => (
          <span className="whitespace-nowrap font-mono text-zinc-500 dark:text-zinc-400">{formatDate(info.getValue())}</span>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });

  if (rows.length === 0) {
    return <EmptyState title="No hay solicitudes de compra para el filtro seleccionado." />;
  }

  return (
    <table className="w-full min-w-[860px] border-collapse text-left">
      <thead className={TABLE_HEAD_CLASS}>
        {table.getHeaderGroups().map((hg) => (
          <tr key={hg.id}>
            {hg.headers.map((h, index) => (
              <th
                key={h.id}
                className={cn(
                  TH_CLASS,
                  NUMERIC.has(h.column.id) && 'text-right',
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
                  NUMERIC.has(cell.column.id) && 'text-right',
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
