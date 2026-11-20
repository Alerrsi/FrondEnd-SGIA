import { useMemo, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useBudgetMovements } from '@sgia/api-client';
import type { BudgetMovement, BudgetMovementType } from '@sgia/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCLP } from '@/features/compras/lib/format';
import { MOVEMENT_TYPES, movementMeta } from '@/features/presupuestos/lib/movement-labels';
import { STATE_TEXT_CLASS, TABLE_HEAD_CLASS } from '@/components/ui/typography';
import { FILTER_CONTROL_CLASS } from '@/components/ui/form-control';
import { SkeletonRows } from '@/components/ui/skeleton-rows';

const columnHelper = createColumnHelper<BudgetMovement>();

const controlClasses = FILTER_CONTROL_CLASS;

const dateTime = (value: string) =>
  value
    ? new Date(value).toLocaleString('es-CL', {
        timeZone: 'America/Santiago',
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : '—';

/** Ledger del presupuesto (más reciente primero), con filtros por tipo y rango de fechas. */
export function BudgetMovementsPanel({ budgetId }: { budgetId: number }) {
  const [type, setType] = useState<BudgetMovementType | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useBudgetMovements(budgetId, {
    type: type || undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    per_page: 15,
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor('created_at', {
        header: 'Fecha',
        cell: (info) => (
          <span className="font-mono whitespace-nowrap text-zinc-500 dark:text-zinc-400">{dateTime(info.getValue())}</span>
        ),
      }),
      columnHelper.accessor('type', {
        header: 'Tipo',
        cell: (info) => {
          const meta = movementMeta(info.getValue());
          return <Badge tone={meta.tone}>{meta.label}</Badge>;
        },
      }),
      columnHelper.accessor('amount', {
        header: 'Monto',
        cell: (info) => {
          const meta = movementMeta(info.row.original.type);
          return (
            <span className="whitespace-nowrap font-mono">
              {meta.sign === '±' ? '' : `${meta.sign} `}
              {formatCLP(info.getValue())}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'origin',
        header: 'Origen',
        cell: (info) => {
          const m = info.row.original;
          if (m.purchase_id) {
            return (
              <Link
                to="/compras/ordenes"
                className="whitespace-nowrap text-accent underline-offset-2 hover:underline"
              >
                Compra #{m.purchase_id}
              </Link>
            );
          }
          if (m.invoice_intake_id) {
            return (
              <Link
                to={`/compras/facturas?ingreso=${m.invoice_intake_id}`}
                className="whitespace-nowrap text-accent underline-offset-2 hover:underline"
              >
                Ingreso #{m.invoice_intake_id}
              </Link>
            );
          }
          return <span className="text-zinc-500 dark:text-zinc-400">—</span>;
        },
      }),
      columnHelper.accessor('notes', {
        header: 'Detalle',
        cell: (info) => (
          <div className="text-zinc-600 dark:text-zinc-300">
            {info.getValue() ?? '—'}
            {(info.row.original.user?.nombre ?? info.row.original.user?.name) && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {info.row.original.user?.nombre ?? info.row.original.user?.name}
              </div>
            )}
          </div>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <select
          aria-label="Filtrar por tipo de movimiento"
          value={type}
          onChange={(e) => {
            setType(e.target.value as BudgetMovementType | '');
            setPage(1);
          }}
          className={controlClasses}
        >
          <option value="">Todos los tipos</option>
          {MOVEMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {movementMeta(t).label}
            </option>
          ))}
        </select>
        <input
          type="date"
          aria-label="Desde"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            setPage(1);
          }}
          className={controlClasses}
        />
        <input
          type="date"
          aria-label="Hasta"
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            setPage(1);
          }}
          className={controlClasses}
        />
        {isFetching && <span className="text-[13px] text-zinc-500 dark:text-zinc-400">Buscando…</span>}
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full border-collapse text-left text-[13px] text-zinc-700 dark:text-zinc-300">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr
                key={hg.id}
                className={TABLE_HEAD_CLASS}
              >
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className={
                      h.column.id === 'amount'
                        ? 'px-3 py-2 text-right font-medium'
                        : 'px-3 py-2 font-medium'
                    }
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {isLoading && (
              <SkeletonRows columns={columns.length} rows={5} label="Cargando movimientos…" cellClassName="px-3 py-2" />
            )}
            {!isLoading && table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className={`px-3 py-6 ${STATE_TEXT_CLASS}`}>
                  Sin movimientos para el filtro.
                </td>
              </tr>
            )}
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={cell.column.id === 'amount' ? 'px-3 py-2 text-right' : 'px-3 py-2'}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta && meta.lastPage > 1 && (
        <div className="flex items-center justify-end gap-2 text-[13px] text-zinc-500 dark:text-zinc-400">
          <span className="font-mono">
            {meta.currentPage} / {meta.lastPage}
          </span>
          <Button
            size="icon"
            variant="secondary"
            aria-label="Página anterior"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            aria-label="Página siguiente"
            disabled={page >= meta.lastPage}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Los ajustes muestran la diferencia absoluta; el detalle indica el monto anterior y el nuevo.
      </p>
    </div>
  );
}
