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
  AlertTriangle,
  Barcode,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Loader2,
  MapPin,
  Pencil,
  Power,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type { PaginatedResponse, Producto } from '@sgia/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

const columnHelper = createColumnHelper<Producto>();

export const AREAS_INACAP = [
  'Informática',
  'Ciberseguridad',
  'Telecomunicaciones',
  'Electricidad',
  'Automatización',
  'Electrónica',
  'Redes',
] as const;

export const estadoOptions = [
  { value: 'todos', label: 'Todos los estados' },
  { value: 'activo', label: 'Solo activos' },
  { value: 'inactivo', label: 'Solo inactivos' },
] as const;

export type EstadoFilter = (typeof estadoOptions)[number]['value'];

const controlClasses =
  'h-9 rounded-lg border border-border bg-surface-raised px-3 font-mono-tabular text-xs text-text transition-colors placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

export interface InventarioTableProps {
  productos: Producto[];
  meta?: PaginatedResponse<Producto>['meta'];
  search?: string;
  onSearchChange?: (value: string) => void;
  areaFilter?: string;
  onAreaFilterChange?: (area: string) => void;
  estadoFilter?: EstadoFilter;
  onEstadoFilterChange?: (estado: EstadoFilter) => void;
  criticalOnly?: boolean;
  onCriticalOnlyChange?: (critical: boolean) => void;
  page?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  isFetching?: boolean;
  canDelete?: boolean;
  onViewDetail: (producto: Producto) => void;
  onEdit: (producto: Producto) => void;
  onToggleActivo: (producto: Producto) => void;
  onDelete?: (producto: Producto) => void;
}

export function InventarioTable({
  productos,
  meta,
  search = '',
  onSearchChange,
  areaFilter = '',
  onAreaFilterChange,
  estadoFilter = 'todos',
  onEstadoFilterChange,
  criticalOnly = false,
  onCriticalOnlyChange,
  page = 1,
  onPageChange,
  pageSize = 10,
  onPageSizeChange,
  isFetching = false,
  canDelete = false,
  onViewDetail,
  onEdit,
  onToggleActivo,
  onDelete,
}: InventarioTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('codigoBarras', {
        header: 'Código de Barra',
        cell: (info) => (
          <div className="flex items-center gap-1.5 font-mono-tabular text-xs text-text">
            <Barcode className="h-4 w-4 text-accent" />
            <span>{info.getValue() || '—'}</span>
          </div>
        ),
      }),
      columnHelper.accessor('nombre', {
        header: 'Producto',
        cell: (info) => {
          const prod = info.row.original;
          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-text">{prod.nombre}</span>
              {prod.description && (
                <span className="line-clamp-1 text-xs text-text-muted">{prod.description}</span>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('area', {
        header: 'Área',
        cell: (info) => {
          const area = info.getValue();
          return area ? <Badge tone="neutral">{area}</Badge> : <span className="text-xs text-text-muted">—</span>;
        },
      }),
      columnHelper.accessor('ubicacion', {
        header: 'Ubicación',
        cell: (info) => {
          const loc = info.getValue();
          if (!loc || (!loc.sala && !loc.cajon)) {
            return <span className="font-mono-tabular text-xs text-text-muted">Sin asignar</span>;
          }
          return (
            <div className="flex items-center gap-1.5 font-mono-tabular text-xs text-text-muted">
              <MapPin className="h-3.5 w-3.5 text-text-muted/70" />
              <span>
                {loc.sala || 'Sala —'} · {loc.cajon || 'Cajón —'}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor('stock', {
        header: 'Stock / Mínimo',
        cell: (info) => {
          const prod = info.row.original;
          const isCritical = prod.stock <= prod.stockCritico;
          return (
            <div className="flex items-center gap-2">
              {isCritical ? (
                <Badge tone="danger">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  {prod.stock} / {prod.stockCritico} mín
                </Badge>
              ) : (
                <Badge tone="success">
                  {prod.stock} uds (mín {prod.stockCritico})
                </Badge>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('activo', {
        header: 'Estado',
        cell: (info) =>
          info.getValue() ? (
            <Badge tone="success">activo</Badge>
          ) : (
            <Badge tone="danger">inactivo</Badge>
          ),
      }),
      columnHelper.display({
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => {
          const producto = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => onViewDetail(producto)}
                aria-label={`Ver detalle y código de barra de ${producto.nombre}`}
                title="Ver detalle y código de barras"
                className="rounded-lg border border-border p-2 text-text-muted transition-colors hover:bg-surface-raised hover:text-text focus-visible:outline-2 focus-visible:outline-accent"
              >
                <Barcode className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onEdit(producto)}
                aria-label={`Editar ${producto.nombre}`}
                title="Editar producto"
                className="rounded-lg border border-border p-2 text-text-muted transition-colors hover:bg-surface-raised hover:text-text focus-visible:outline-2 focus-visible:outline-accent"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onToggleActivo(producto)}
                aria-label={
                  producto.activo
                    ? `Desactivar ${producto.nombre}`
                    : `Activar ${producto.nombre}`
                }
                title={producto.activo ? 'Desactivar producto' : 'Activar producto'}
                className={cn(
                  'rounded-lg border p-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent',
                  producto.activo
                    ? 'border-border text-text-muted hover:border-danger/30 hover:bg-danger/10 hover:text-danger'
                    : 'border-border text-accent-muted hover:border-success/30 hover:bg-success/10 hover:text-success',
                )}
              >
                <Power className="h-3.5 w-3.5" />
              </button>
              {canDelete && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(producto)}
                  aria-label={`Eliminar ${producto.nombre}`}
                  title="Eliminar producto"
                  className="rounded-lg border border-border p-2 text-text-muted transition-colors hover:border-danger/40 hover:bg-danger/10 hover:text-danger focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        },
      }),
    ],
    [onViewDetail, onEdit, onToggleActivo, onDelete, canDelete],
  );

  const table = useReactTable({
    data: productos,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const currentPage = meta?.currentPage ?? page;
  const totalPages =
    meta?.lastPage ?? Math.max(1, Math.ceil((meta?.total ?? productos.length) / pageSize));
  const totalRows = meta?.total ?? productos.length;
  const firstShown = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastShown = Math.min(currentPage * pageSize, totalRows);

  return (
    <section
      aria-label="Catálogo de inventario"
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
    >
      {/* Toolbar de búsqueda y filtros */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Buscador */}
        <div className="relative min-w-0 flex-1 sm:h-9 sm:w-72 sm:flex-none">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder="Buscar por nombre, código o descripción…"
            aria-label="Buscar productos"
            className={cn(controlClasses, 'w-full py-2 pl-9 pr-9')}
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange?.('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-text-muted transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-accent"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filtro de Área */}
        <select
          value={areaFilter}
          onChange={(event) => onAreaFilterChange?.(event.target.value)}
          aria-label="Filtrar por área"
          className={controlClasses}
        >
          <option value="">Todas las áreas</option>
          {AREAS_INACAP.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>

        {/* Filtro de Estado */}
        <select
          value={estadoFilter}
          onChange={(event) => onEstadoFilterChange?.(event.target.value as EstadoFilter)}
          aria-label="Filtrar por estado"
          className={controlClasses}
        >
          {estadoOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Toggle Stock Crítico */}
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-text select-none hover:border-accent">
          <input
            type="checkbox"
            checked={criticalOnly}
            onChange={(e) => onCriticalOnlyChange?.(e.target.checked)}
            className="rounded border-border accent-accent focus:ring-accent"
          />
          <AlertTriangle className="h-3.5 w-3.5 text-warning" />
          <span>Solo stock crítico</span>
        </label>

        {isFetching && (
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
            <span className="font-mono-tabular">Actualizando…</span>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-left">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border bg-surface-raised/40">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th key={header.id} className="px-4 py-3">
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 font-mono-tabular text-xs font-medium uppercase tracking-wider text-text-muted transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-accent"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === 'asc' ? (
                            <ChevronUp className="h-3.5 w-3.5 text-accent" />
                          ) : sorted === 'desc' ? (
                            <ChevronDown className="h-3.5 w-3.5 text-accent" />
                          ) : (
                            <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {productos.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-text-muted"
                >
                  No se encontraron productos en el inventario con los filtros aplicados.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border last:border-0 hover:bg-surface-raised/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-text-muted">
          Mostrando <span className="font-mono-tabular text-text">{firstShown}</span>–
          <span className="font-mono-tabular text-text">{lastShown}</span> de{' '}
          <span className="font-mono-tabular text-text">{totalRows}</span> productos
        </span>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-text-muted">
            Filas por página
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

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="h-8 w-8 px-0"
              onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-mono-tabular text-xs text-text-muted">
              {totalPages === 0 ? 0 : currentPage} / {totalPages}
            </span>
            <Button
              variant="ghost"
              className="h-8 w-8 px-0"
              onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
