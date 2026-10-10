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
  ArrowRightLeft,
  Barcode,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Eye,
  Loader2,
  MapPin,
  Pencil,
  Power,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useCajones, useLocations } from '@sgia/api-client';
import type { Producto } from '@sgia/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

export const AREAS_INACAP = [
  'Informática',
  'Ciberseguridad',
  'Telecomunicaciones',
  'Electricidad',
  'Automatización',
  'Electrónica',
  'Redes',
] as const;

export type EstadoFilter = 'todos' | 'activos' | 'inactivos';

export interface InventarioTableProps {
  productos: Producto[];
  isLoading?: boolean;
  isFetching?: boolean;
  canDelete?: boolean;
  search?: string;
  onSearchChange?: (val: string) => void;
  areaFilter?: string;
  onAreaFilterChange?: (val: string) => void;
  salaFilter?: string;
  onSalaFilterChange?: (val: string) => void;
  cajonFilter?: string;
  onCajonFilterChange?: (val: string) => void;
  estadoFilter?: EstadoFilter;
  onEstadoFilterChange?: (val: EstadoFilter) => void;
  criticalOnly?: boolean;
  onCriticalOnlyChange?: (val: boolean) => void;
  onViewDetail?: (producto: Producto) => void;
  onEdit?: (producto: Producto) => void;
  onReubicar?: (producto: Producto) => void;
  onToggleActivo?: (producto: Producto) => void;
  onDelete?: (producto: Producto) => void;
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

const columnHelper = createColumnHelper<Producto>();

export function InventarioTable({
  productos,
  isLoading = false,
  isFetching = false,
  canDelete = false,
  search = '',
  onSearchChange,
  areaFilter = '',
  onAreaFilterChange,
  salaFilter = '',
  onSalaFilterChange,
  cajonFilter = '',
  onCajonFilterChange,
  estadoFilter = 'todos',
  onEstadoFilterChange,
  criticalOnly = false,
  onCriticalOnlyChange,
  onViewDetail,
  onEdit,
  onReubicar,
  onToggleActivo,
  onDelete,
  page = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  meta,
}: InventarioTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const estadoOptions: Array<{ value: EstadoFilter; label: string }> = [
    { value: 'todos', label: 'Todos los estados' },
    { value: 'activos', label: 'Solo activos' },
    { value: 'inactivos', label: 'Solo inactivos' },
  ];

  // Carga dinámica de ubicaciones físicas desde la API
  const { data: locationsData } = useLocations({ per_page: 50 });
  const locations = locationsData?.data ?? [];

  const activeLocation = locations.find(
    (l) => (l.nombre || l.sala) === salaFilter,
  );

  const { data: cajonesData } = useCajones(
    activeLocation?.id ? { location_id: activeLocation.id, per_page: 50 } : undefined,
  );
  const cajones = cajonesData?.data ?? [];

  const columns = useMemo(
    () => [
      columnHelper.accessor('codigoBarras', {
        header: 'SKU / Code128',
        cell: (info) => (
          <span className="inline-flex items-center gap-1 font-mono text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/60">
            <Barcode className="h-3 w-3 text-zinc-400 dark:text-zinc-500" />
            <span>{info.getValue() || '—'}</span>
          </span>
        ),
      }),
      columnHelper.accessor('nombre', {
        header: 'Activo / Modelo',
        cell: (info) => {
          const prod = info.row.original;
          return (
            <div className="flex flex-col gap-0.5 max-w-xs">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug">{prod.nombre}</span>
              {prod.description && (
                <span className="line-clamp-1 text-[11px] text-zinc-500 dark:text-zinc-400">{prod.description}</span>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('categoria', {
        header: 'Área / Especialidad',
        cell: (info) => (
          <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
            {info.getValue() || '—'}
          </span>
        ),
      }),
      columnHelper.accessor('ubicacion', {
        header: 'Ubicación Física',
        cell: (info) => {
          const loc = info.getValue();
          if (!loc) {
            return <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">—</span>;
          }
          return (
            <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-600 dark:text-zinc-400">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
              <span>
                {loc.sala || 'Sala —'} · {loc.cajon || 'Cajón —'}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor('stock', {
        header: 'Stock',
        cell: (info) => {
          const prod = info.row.original;
          const isCritical = prod.stock <= prod.stockCritico;
          const isWarning = !isCritical && prod.stock <= prod.stockCritico + 5;
          const maxLevel = Math.max(prod.stockCritico * 2.5, 10);
          const ratio = Math.min((prod.stock / maxLevel) * 100, 100);

          return (
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden shrink-0">
                <div
                  className={cn(
                    'h-full transition-all duration-300',
                    isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500',
                  )}
                  style={{ width: `${Math.max(ratio, 8)}%` }}
                />
              </div>

              {isCritical ? (
                <Badge tone="critical">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Stock crítico ({prod.stock} / {prod.stockCritico} mín)
                </Badge>
              ) : isWarning ? (
                <Badge tone="warning">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Stock bajo ({prod.stock} / {prod.stockCritico} mín)
                </Badge>
              ) : (
                <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
                  {prod.stock} <span className="text-zinc-400 dark:text-zinc-500">(mín {prod.stockCritico})</span>
                </span>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('activo', {
        header: 'Estado',
        cell: (info) =>
          info.getValue() ? (
            <Badge tone="available">activo</Badge>
          ) : (
            <Badge tone="retired">inactivo</Badge>
          ),
      }),
      columnHelper.display({
        id: 'acciones',
        header: 'Acciones',
        cell: (info) => {
          const prod = info.row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {onViewDetail && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  title="Ver detalle y código de barras"
                  aria-label={`Ver detalles de ${prod.nombre}`}
                  onClick={() => onViewDetail(prod)}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              )}

              {onReubicar && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  title="Reubicar en pañol"
                  aria-label={`Reubicar ${prod.nombre}`}
                  onClick={() => onReubicar(prod)}
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                </Button>
              )}

              {onEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  title="Editar producto"
                  aria-label={`Editar ${prod.nombre}`}
                  onClick={() => onEdit(prod)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}

              {onToggleActivo && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  title={prod.activo ? 'Desactivar producto' : 'Activar producto'}
                  aria-label={`${prod.activo ? 'Desactivar' : 'Activar'} ${prod.nombre}`}
                  onClick={() => onToggleActivo(prod)}
                >
                  <Power className="h-3.5 w-3.5" />
                </Button>
              )}

              {canDelete && onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-500 hover:text-red-700 dark:hover:text-red-400"
                  title="Eliminar producto"
                  aria-label={`Eliminar ${prod.nombre}`}
                  onClick={() => onDelete(prod)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          );
        },
      }),
    ],
    [canDelete, onViewDetail, onEdit, onReubicar, onToggleActivo, onDelete],
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
  const totalPages = meta?.lastPage ?? Math.max(1, Math.ceil((meta?.total ?? productos.length) / pageSize));
  const totalRows = meta?.total ?? productos.length;
  const firstShown = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastShown = Math.min(currentPage * pageSize, totalRows);

  const controlClasses =
    'h-8.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 font-mono text-xs text-zinc-800 dark:text-zinc-200 transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600';

  return (
    <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
      {/* Unified Toolbar with Frame */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search box with / kbd shortcut */}
          <div className="relative min-w-0 flex-1 sm:h-8.5 sm:w-72 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Buscar por nombre, SKU, marca…"
              aria-label="Buscar productos"
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

          {/* Filtro por Área */}
          <select
            value={areaFilter}
            onChange={(e) => onAreaFilterChange?.(e.target.value)}
            aria-label="Filtrar por área"
            className={controlClasses}
          >
            <option value="">Todas las áreas</option>
            {AREAS_INACAP.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          {/* Filtro Dinámico por Sala */}
          <select
            value={salaFilter}
            onChange={(e) => {
              onSalaFilterChange?.(e.target.value);
              onCajonFilterChange?.('');
            }}
            aria-label="Filtrar por sala"
            className={controlClasses}
          >
            <option value="">Todas las salas</option>
            {locations.map((loc) => {
              const label = loc.nombre || loc.sala || `Sala #${loc.id}`;
              return (
                <option key={loc.id} value={label}>
                  {label}
                </option>
              );
            })}
          </select>

          {/* Filtro Dinámico por Cajón */}
          {salaFilter && (
            <select
              value={cajonFilter}
              onChange={(e) => onCajonFilterChange?.(e.target.value)}
              aria-label="Filtrar por cajón"
              className={controlClasses}
            >
              <option value="">Todos los cajones</option>
              {cajones.map((c) => (
                <option key={c.id} value={c.codigo}>
                  {c.codigo} {c.descripcion ? `· ${c.descripcion}` : ''}
                </option>
              ))}
            </select>
          )}

          {/* Filtro por Estado */}
          <select
            value={estadoFilter}
            onChange={(e) => onEstadoFilterChange?.(e.target.value as EstadoFilter)}
            aria-label="Filtrar por estado"
            className={controlClasses}
          >
            {estadoOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Toggle de Stock Crítico */}
          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-mono text-zinc-600 dark:text-zinc-300 ml-1 select-none">
            <input
              type="checkbox"
              checked={criticalOnly}
              onChange={(e) => onCriticalOnlyChange?.(e.target.checked)}
              aria-label="Solo stock crítico"
              className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-zinc-400"
            />
            <span className={criticalOnly ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''}>
              Bajo mínimo
            </span>
          </label>
        </div>

        {isFetching && (
          <div
            role="progressbar"
            aria-label="Cargando productos en pañol"
            className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-mono"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
            <span>Buscando...</span>
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
                  <div
                    role="progressbar"
                    aria-label="Cargando productos en pañol"
                    className="flex items-center justify-center gap-2"
                  >
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-600 dark:text-zinc-400" />
                    <span>Buscando y cargando productos en pañol…</span>
                  </div>
                </td>
              </tr>
            ) : productos.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-xs text-zinc-500 font-mono">
                  No se encontraron productos con los criterios seleccionados.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3.5 py-2">
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
          Mostrando {firstShown} a {lastShown} de {totalRows} activos
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
              {[10, 25, 50, 100].map((size) => (
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
