import { formatDateTime } from '@/lib/format';
import { useMemo, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useBudgetMovements } from '@sgia/api-client';
import type { BudgetMovement, BudgetMovementType } from '@sgia/types';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCLP } from '@/features/compras/lib/format';
import { MOVEMENT_TYPES, movementMeta } from '@/features/presupuestos/lib/movement-labels';

const columnHelper = createColumnHelper<BudgetMovement>();

const controlClasses =
  'h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2 font-mono text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-400';

const dateTime = formatDateTime;

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
          <span className="font-mono text-zinc-500">{dateTime(info.getValue())}</span>
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
            <span className="font-mono tabular-nums">
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
                to="/compras"
                className="font-mono text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
              >
                Compra #{m.purchase_id}
              </Link>
            );
          }
          if (m.invoice_intake_id) {
            return (
              <Link
                to={`/ingresos-factura?ingreso=${m.invoice_intake_id}`}
                className="font-mono text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
              >
                Ingreso #{m.invoice_intake_id}
              </Link>
            );
          }
          return <span className="text-zinc-400">—</span>;
        },
      }),
      columnHelper.accessor('notes', {
        header: 'Detalle',
        cell: (info) => (
          <div className="text-zinc-600 dark:text-zinc-300">
            {info.getValue() ?? '—'}
            {(info.row.original.user?.nombre ?? info.row.original.user?.name) && (
              <div className="text-[11px] text-zinc-400">
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
      <div className="flex flex-wrap items-center gap-2">
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
        {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />}
      </div>

      <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr
                key={hg.id}
                className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
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
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {isLoading && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-zinc-400">
                  Cargando movimientos…
                </td>
              </tr>
            )}
            {!isLoading && table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-zinc-400">
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
        <div className="flex items-center justify-end gap-2 text-xs text-zinc-500">
          <span className="font-mono">
            {meta.currentPage} / {meta.lastPage}
          </span>
          <Button
            size="icon"
            variant="outline"
            aria-label="Página anterior"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            aria-label="Página siguiente"
            disabled={page >= meta.lastPage}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
      <p className="text-[11px] text-zinc-400">
        Los ajustes muestran la diferencia absoluta; el detalle indica el monto anterior y el nuevo.
      </p>
    </div>
  );
}
