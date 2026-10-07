import { useMemo, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import {
  AlertCircle,
  AlertTriangle,
  Barcode,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Eye,
  Loader2,
  Search,
  ShoppingCart,
  X,
} from 'lucide-react';
import type { CriticalStockAlert, Producto } from '@sgia/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

export type AlertTypeFilter = 'all' | 'critical' | 'warning';
export type AlertStatusFilter = 'all' | 'active' | 'resolved';

export interface AlertasTableProps {
  alerts: CriticalStockAlert[];
  isLoading?: boolean;
  isFetching?: boolean;
  search?: string;
  onSearchChange?: (val: string) => void;
  typeFilter?: AlertTypeFilter;
  onTypeFilterChange?: (val: AlertTypeFilter) => void;
  statusFilter?: AlertStatusFilter;
  onStatusFilterChange?: (val: AlertStatusFilter) => void;
  onResolve?: (alert: CriticalStockAlert) => void;
  onViewProduct?: (producto: Producto) => void;
  onRequestQuote?: (alert: CriticalStockAlert) => void;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  meta?: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

const columnHelper = createColumnHelper<CriticalStockAlert>();

const controlClasses =
  'h-8.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 font-mono text-xs text-zinc-800 dark:text-zinc-200 transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600';

export function AlertasTable({
  alerts,
  isLoading = false,
  isFetching = false,
  search = '',
  onSearchChange,
  typeFilter = 'all',
  onTypeFilterChange,
  statusFilter = 'active',
  onStatusFilterChange,
  onResolve,
  onViewProduct,
  onRequestQuote,
  page = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  meta,
}: AlertasTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('alert_type', {
        header: 'Severidad',
        cell: (info) => {
          const type = info.getValue();
          const isCritical = type === 'critical';
          return isCritical ? (
            <Badge tone="critical">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Crítico
            </Badge>
          ) : (
            <Badge tone="warning">
              <AlertCircle className="mr-1 h-3 w-3" />
              Advertencia
            </Badge>
          );
        },
      }),
      columnHelper.accessor((row) => row.product?.nombre || row.producto?.nombre || row.product_name, {
        id: 'producto',
        header: 'Producto / SKU',
        cell: (info) => {
          const alert = info.row.original;
          const name =
            alert.product?.nombre ||
            alert.producto?.nombre ||
            alert.product_name ||
            `Producto #${alert.product_id}`;
          const sku =
            alert.product?.codigoBarras ||
            alert.product?.barcode ||
            alert.producto?.codigoBarras ||
            alert.producto?.barcode;
          const area = alert.product?.area || alert.producto?.area;

          return (
            <div className="flex flex-col gap-0.5 max-w-xs">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug">
                {name}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {sku && (
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60">
                    <Barcode className="h-2.5 w-2.5 text-zinc-400" />
                    <span>{sku}</span>
                  </span>
                )}
                {area && (
                  <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                    · {area}
                  </span>
                )}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row.product?.stock ?? row.stock, {
        id: 'existencias',
        header: 'Nivel de Existencias',
        cell: (info) => {
          const alert = info.row.original;
          const stock = alert.product?.stock ?? alert.stock ?? 0;
          const stockMin =
            alert.product?.stockCritico ??
            alert.product?.stock_minimo ??
            alert.stock_minimo ??
            0;
          const isCritical = alert.alert_type === 'critical';
          const maxLevel = Math.max(stockMin * 2, 10);
          const ratio = Math.min((stock / maxLevel) * 100, 100);

          return (
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden shrink-0">
                <div
                  className={cn(
                    'h-full transition-all duration-300',
                    isCritical ? 'bg-rose-500' : 'bg-amber-500',
                  )}
                  style={{ width: `${Math.max(ratio, 8)}%` }}
                />
              </div>
              <span className="font-mono text-xs tabular-nums text-zinc-800 dark:text-zinc-200">
                <strong>{stock}</strong>{' '}
                <span className="text-zinc-400 dark:text-zinc-500">/ mín {stockMin}</span>
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor('is_resolved', {
        header: 'Estado',
        cell: (info) => {
          const isResolved = info.getValue();
          return isResolved ? (
            <Badge tone="available">Resuelta</Badge>
          ) : (
            <Badge tone="retired">Activa</Badge>
          );
        },
      }),
      columnHelper.accessor('created_at', {
        header: 'Fecha Alerta',
        cell: (info) => {
          const val = info.getValue();
          if (!val) return <span className="font-mono text-xs text-zinc-400">—</span>;
          const date = new Date(val);
          return (
            <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
              {Number.isNaN(date.getTime())
                ? '—'
                : date.toLocaleDateString('es-CL', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => {
          const alert = row.original;
          const product = alert.product ?? alert.producto;

          return (
            <div className="flex items-center justify-end gap-1.5">
              {!alert.is_resolved && onResolve && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onResolve(alert)}
                  title="Marcar alerta como resuelta / atendida"
                  aria-label={`Resolver alerta de ${alert.product_name ?? 'producto'}`}
                  className="h-7 px-2 text-xs gap-1 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Resolver</span>
                </Button>
              )}

              {onRequestQuote && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRequestQuote(alert)}
                  title="Iniciar cotización de reposición"
                  aria-label={`Cotizar reposición para ${alert.product_name ?? 'producto'}`}
                  className="h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                </Button>
              )}

              {product && onViewProduct && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewProduct(product)}
                  title="Ver ficha técnica del producto"
                  aria-label={`Ver ficha de ${product.nombre}`}
                  className="h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          );
        },
      }),
    ],
    [onResolve, onViewProduct, onRequestQuote],
  );

  const table = useReactTable({
    data: alerts,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const currentPage = meta?.currentPage ?? page;
  const totalPages = meta?.lastPage ?? Math.max(1, Math.ceil((meta?.total ?? alerts.length) / pageSize));
  const totalRows = meta?.total ?? alerts.length;
  const firstShown = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastShown = Math.min(currentPage * pageSize, totalRows);

  return (
    <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
      {/* Unified Toolbar with Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search box with / kbd */}
          <div className="relative min-w-0 flex-1 sm:h-8.5 sm:w-72 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Buscar por producto, SKU…"
              aria-label="Buscar alertas"
              className={cn(controlClasses, 'w-full py-1.5 pl-9 pr-9')}
            />
            {search ? (
              <button
                type="button"
                onClick={() => onSearchChange?.('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-4.5 select-none items-center rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-1 font-mono text-[10px] text-zinc-400">
                /
              </kbd>
            )}
          </div>

          {/* Filtro por Severidad */}
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange?.(e.target.value as AlertTypeFilter)}
            aria-label="Filtrar por severidad"
            className={controlClasses}
          >
            <option value="all">Todas las severidades</option>
            <option value="critical">Solo críticas (≤ mín)</option>
            <option value="warning">Solo advertencias (≤ mín + 5)</option>
          </select>

          {/* Filtro por Estado */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange?.(e.target.value as AlertStatusFilter)}
            aria-label="Filtrar por estado"
            className={controlClasses}
          >
            <option value="active">Solo activas</option>
            <option value="resolved">Solo resueltas</option>
            <option value="all">Todos los estados</option>
          </select>
        </div>

        {isFetching && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
            <span>Actualizando…</span>
          </div>
        )}
      </div>

      {/* TanStack Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-zinc-50/90 dark:bg-zinc-900/90 border-b border-zinc-200 dark:border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold font-mono">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th key={header.id} className="px-3.5 py-2.5">
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100 focus-visible:outline-none"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === 'asc' ? (
                            <ChevronUp className="h-3.5 w-3.5 text-zinc-900 dark:text-zinc-100" />
                          ) : sorted === 'desc' ? (
                            <ChevronDown className="h-3.5 w-3.5 text-zinc-900 dark:text-zinc-100" />
                          ) : (
                            <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                          )}
                        </button>
                      ) : (
                        <span>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-xs text-zinc-500 font-mono">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-600 dark:text-zinc-400" />
                    <span>Cargando registro de alertas de stock…</span>
                  </div>
                </td>
              </tr>
            ) : alerts.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-xs text-zinc-500 font-mono">
                  No se encontraron alertas de existencias con los filtros aplicados.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3.5 py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Technical Pagination Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 dark:border-zinc-800 p-2.5 text-xs text-zinc-500 dark:text-zinc-400 font-mono bg-zinc-50/30 dark:bg-zinc-900/30">
        <div>
          Mostrando {firstShown} a {lastShown} de {totalRows} alertas
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">Filas:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              aria-label="Filas por página"
              className={cn(controlClasses, 'h-7 py-0 pl-2 pr-6 text-xs')}
            >
              {[10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              aria-label="Página anterior"
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2 text-zinc-700 dark:text-zinc-300 tabular-nums">
              {totalPages === 0 ? 0 : currentPage} / {totalPages}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              aria-label="Página siguiente"
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
