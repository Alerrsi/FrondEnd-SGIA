import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
  ShoppingCart,
} from 'lucide-react';
import type { CriticalStockAlert, Producto } from '@sgia/types';

import { Badge } from '@/components/ui/badge';
import { PurchaseRequestStatusBadge } from '@/features/solicitudes-compra/components/purchase-request-status-badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { CODE_CHIP_CLASS, STATE_TEXT_CLASS, TABLE_HEAD_CLASS } from '@/components/ui/typography';
import { FILTER_CONTROL_CLASS } from '@/components/ui/form-control';
import { SkeletonRows } from '@/components/ui/skeleton-rows';
import { TableFrame } from '@/components/ui/table-frame';
import { TableSearch } from '@/components/ui/table-search';
import { ICON_BUTTON_CLASS, ROW_CLASS, STICKY_COL_CLASS, TD_CLASS, TH_CLASS } from '@/components/ui/table-styles';
import { TableToolbar } from '@/components/ui/table-toolbar';

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
  /** Muestra casillas para elegir alertas (solo quien puede crear solicitudes de compra). */
  selectable?: boolean;
  /** Enlaza el código de la solicitud abierta; solo quien accede a Compras (no el pañol). */
  linkRequests?: boolean;
  /** IDs de producto seleccionados. */
  selectedProductIds?: ReadonlySet<number>;
  onToggleSelect?: (alert: CriticalStockAlert) => void;
  onToggleSelectAll?: (alerts: CriticalStockAlert[], checked: boolean) => void;
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
  FILTER_CONTROL_CLASS;

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
  selectable = false,
  linkRequests = false,
  selectedProductIds,
  onToggleSelect,
  onToggleSelectAll,
  page = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  meta,
}: AlertasTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  /** Una alerta se puede pedir si sigue activa y su producto no está en otra solicitud abierta. */
  const selectableAlerts = useMemo(
    () => alerts.filter((a) => !a.is_resolved && !a.open_purchase_request),
    [alerts],
  );
  const selectedCount = selectableAlerts.filter((a) => selectedProductIds?.has(a.product_id)).length;
  const allSelected = selectableAlerts.length > 0 && selectedCount === selectableAlerts.length;

  const columns = useMemo(
    () => [
      ...(selectable
        ? [
            columnHelper.display({
              id: 'seleccion',
              header: () => (
                <input
                  type="checkbox"
                  aria-label="Seleccionar todas las alertas de la página"
                  checked={allSelected}
                  disabled={selectableAlerts.length === 0}
                  onChange={(e) => onToggleSelectAll?.(selectableAlerts, e.target.checked)}
                  className="h-4 w-4 accent-accent"
                />
              ),
              cell: ({ row }) => {
                const alert = row.original;
                const request = alert.open_purchase_request;
                const disabled = alert.is_resolved || Boolean(request);
                return (
                  <input
                    type="checkbox"
                    aria-label={`Seleccionar ${alert.product_name ?? `producto ${alert.product_id}`}`}
                    title={request ? `Ya está en la solicitud ${request.code}` : undefined}
                    checked={selectedProductIds?.has(alert.product_id) ?? false}
                    disabled={disabled}
                    onChange={() => onToggleSelect?.(alert)}
                    className="h-4 w-4 accent-accent"
                  />
                );
              },
            }),
          ]
        : []),
      columnHelper.accessor('alert_type', {
        header: 'Severidad',
        cell: (info) => {
          const type = info.getValue();
          const isCritical = type === 'critical';
          return isCritical ? (
            <Badge tone="critical" icon={<AlertTriangle aria-hidden="true" className="h-3 w-3" />}>
              Crítico
            </Badge>
          ) : (
            <Badge tone="warning" icon={<AlertCircle aria-hidden="true" className="h-3 w-3" />}>
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
            <div className="flex min-w-48 max-w-xs flex-col gap-0.5">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug">
                {name}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {sku && (
                  <span className={`inline-flex items-center gap-1 ${CODE_CHIP_CLASS}`}>
                    <Barcode aria-hidden="true" className="h-3 w-3 text-zinc-400" />
                    <span>{sku}</span>
                  </span>
                )}
                {area && (
                  <span className="text-[13px] text-zinc-500 dark:text-zinc-400">
                    · {area}
                  </span>
                )}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row.current_stock ?? row.product?.stock ?? row.stock, {
        id: 'existencias',
        header: 'Nivel de Existencias',
        cell: (info) => {
          const alert = info.row.original;
          const stock = alert.current_stock ?? alert.product?.stock ?? alert.stock ?? 0;
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
                    'h-full',
                    isCritical ? 'bg-danger' : 'bg-warn',
                  )}
                  style={{ width: `${Math.max(ratio, 8)}%` }}
                />
              </div>
              <span className="whitespace-nowrap font-mono text-[13px] text-zinc-800 dark:text-zinc-200">
                <span className="font-medium">{stock}</span>{' '}
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
      columnHelper.display({
        id: 'solicitud',
        header: 'Solicitud',
        cell: ({ row }) => {
          const request = row.original.open_purchase_request;
          if (!request) return <span className="text-[13px] text-zinc-400">—</span>;
          return (
            <div className="flex flex-col items-start gap-1">
              {linkRequests ? (
                <Link
                  to={`/compras/solicitudes/${request.id}`}
                  className={`${CODE_CHIP_CLASS} hover:underline`}
                >
                  {request.code}
                </Link>
              ) : (
                <span className={CODE_CHIP_CLASS}>{request.code}</span>
              )}
              <PurchaseRequestStatusBadge status={request.status} />
            </div>
          );
        },
      }),
      columnHelper.accessor('created_at', {
        header: 'Fecha Alerta',
        cell: (info) => {
          const val = info.getValue();
          if (!val) return <span className="text-[13px] text-zinc-400">—</span>;
          const date = new Date(val);
          return (
            <span className="whitespace-nowrap font-mono text-[13px] text-zinc-500 dark:text-zinc-400">
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
                >
                  <CheckCheck aria-hidden="true" className="h-3.5 w-3.5 text-ok" />
                  <span>Resolver</span>
                </Button>
              )}

              {onRequestQuote && !alert.is_resolved && !alert.open_purchase_request && (
                <button
                  type="button"
                  className={ICON_BUTTON_CLASS}
                  onClick={() => onRequestQuote(alert)}
                  title="Crear solicitud de compra para este producto"
                  aria-label={`Crear solicitud de compra para ${alert.product_name ?? 'producto'}`}
                >
                  <ShoppingCart aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Ya tiene solicitud de compra abierta: carrito tachado (no se puede pedir otra). */}
              {onRequestQuote && !alert.is_resolved && alert.open_purchase_request && (
                <span
                  role="img"
                  title={`Solicitud de compra ${alert.open_purchase_request.code} en proceso`}
                  aria-label={`Solicitud de compra ${alert.open_purchase_request.code} en proceso para ${alert.product_name ?? 'producto'}`}
                  className="inline-flex h-8 w-8 shrink-0 cursor-not-allowed items-center justify-center text-zinc-400 dark:text-zinc-500"
                >
                  <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true">
                    {/* Misma diagonal que los íconos "-off" de Lucide. */}
                    <path d="m2 2 20 20" />
                  </ShoppingCart>
                </span>
              )}

              {product && onViewProduct && (
                <button
                  type="button"
                  className={ICON_BUTTON_CLASS}
                  onClick={() => onViewProduct(product)}
                  title="Ver ficha técnica del producto"
                  aria-label={`Ver ficha de ${product.nombre}`}
                >
                  <Eye aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        },
      }),
    ],
    [
      onResolve,
      onViewProduct,
      onRequestQuote,
      selectable,
      linkRequests,
      selectedProductIds,
      onToggleSelect,
      onToggleSelectAll,
      selectableAlerts,
      allSelected,
    ],
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

  const toolbar = (
    <TableToolbar>
      <TableSearch
        value={search}
        onChange={(val) => onSearchChange?.(val)}
        placeholder="Buscar por producto, SKU…"
        label="Buscar alertas"
      />
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
      {isFetching && (
        <div className="flex items-center gap-1.5 text-[13px] text-zinc-500 dark:text-zinc-400 sm:ml-auto">
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin text-zinc-400" />
          <span>Actualizando…</span>
        </div>
      )}
    </TableToolbar>
  );

  const footer = (
    <>
      <span className="font-mono">
        Mostrando {firstShown} a {lastShown} de {totalRows} alertas
      </span>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5">
          <span>Filas</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            aria-label="Filas por página"
            className={controlClasses}
          >
            {[10, 25, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            aria-label="Página anterior"
          >
            <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
          </Button>
          <span className="px-2 font-mono text-zinc-700 dark:text-zinc-300">
            {totalPages === 0 ? 0 : currentPage} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            aria-label="Página siguiente"
          >
            <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <TableFrame toolbar={toolbar} footer={footer}>
      <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
        <thead className={TABLE_HEAD_CLASS}>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    className={cn(
                      TH_CLASS,
                      header.column.id === 'acciones' && 'text-right',
                      header.column.id === 'producto' && `${STICKY_COL_CLASS} max-md:bg-zinc-50`,
                    )}
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex cursor-pointer items-center gap-1 font-medium transition-colors duration-150 hover:text-zinc-900 dark:hover:text-zinc-100"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sorted === 'asc' ? (
                          <ChevronUp aria-hidden="true" className="h-3.5 w-3.5 text-zinc-900 dark:text-zinc-100" />
                        ) : sorted === 'desc' ? (
                          <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 text-zinc-900 dark:text-zinc-100" />
                        ) : (
                          <ChevronsUpDown aria-hidden="true" className="h-3.5 w-3.5 opacity-40" />
                        )}
                      </button>
                    ) : (
                      <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {isLoading ? (
            <SkeletonRows columns={columns.length} label="Cargando registro de alertas de stock…" />
          ) : alerts.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={`px-4 py-12 ${STATE_TEXT_CLASS}`}>
                No se encontraron alertas de existencias con los filtros aplicados.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className={ROW_CLASS}>
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={cn(TD_CLASS, cell.column.id === 'producto' && STICKY_COL_CLASS)}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </TableFrame>
  );
}
