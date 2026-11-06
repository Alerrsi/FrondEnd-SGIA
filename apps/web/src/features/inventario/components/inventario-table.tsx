import { Fragment, useMemo, useState } from 'react';
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
import type { CajonEntity, LocationEntity, Producto } from '@sgia/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

import { ProductoUnidadesExpandidas } from './producto-unidades-expandidas';

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

// La API puede devolver texto u objeto ({nombre, ...}) según el endpoint.
function labelOf(value: unknown, ...keys: string[]): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    for (const key of keys) {
      const found = (value as Record<string, unknown>)[key];
      if (typeof found === 'string') return found;
    }
  }
  return '';
}

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
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());

  const toggleExpanded = (id: number) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const estadoOptions: Array<{ value: EstadoFilter; label: string }> = [
    { value: 'todos', label: 'Todos los estados' },
    { value: 'activos', label: 'Solo activos' },
    { value: 'inactivos', label: 'Solo inactivos' },
  ];

  // Carga dinámica de ubicaciones físicas desde la API
  const { data: locationsData } = useLocations({ per_page: 50 });
  const locations: LocationEntity[] = Array.isArray(locationsData?.data)
    ? locationsData.data
    : Array.isArray(locationsData)
      ? (locationsData as LocationEntity[])
      : [];

  const activeLocation = locations.find(
    (l) => (l.nombre || l.sala) === salaFilter,
  );

  const { data: cajonesData } = useCajones(
    activeLocation?.id ? { location_id: activeLocation.id, per_page: 50 } : undefined,
  );
  const cajones: CajonEntity[] = Array.isArray(cajonesData?.data)
    ? cajonesData.data
    : Array.isArray(cajonesData)
      ? (cajonesData as CajonEntity[])
      : [];

  const safeProductos = useMemo(() => {
    return Array.isArray(productos)
      ? productos.filter((p): p is Producto => Boolean(p && typeof p === "object"))
      : [];
  }, [productos]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'expandir',
        header: () => <span className="sr-only">Instancias</span>,
        cell: (info) => {
          const prod = info.row.original;
          if (prod.type !== 'equipo' && prod.type !== 'maqueta') return null;
          const expanded = expandedIds.has(prod.id);
          return (
            <button
              type="button"
              onClick={() => toggleExpanded(prod.id)}
              aria-expanded={expanded}
              aria-label={`${expanded ? 'Ocultar' : 'Ver'} instancias de ${prod.nombre}`}
              title={expanded ? 'Ocultar instancias' : 'Ver instancias'}
              className="rounded p-1 text-text-muted transition-colors hover:bg-surface-raised hover:text-text"
            >
              <ChevronRight
                className={cn('h-4 w-4 transition-transform', expanded && 'rotate-90')}
              />
            </button>
          );
        },
      }),
      columnHelper.accessor('codigoBarras', {
        header: 'SKU / Code128',
        cell: (info) => (
          <span className="inline-flex items-center gap-1 font-mono text-xs px-1.5 py-0.5 rounded bg-surface-raised text-text border border-border">
            <Barcode className="h-3 w-3 text-text-muted" />
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
              <span className="text-sm font-medium text-text leading-snug">{prod.nombre}</span>
              {prod.description && (
                <span className="line-clamp-1 text-xs text-text-muted">{prod.description}</span>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('categoria', {
        header: 'Área / Especialidad',
        cell: (info) => {
          const val = info.getValue();
          const display =
            typeof val === 'string'
              ? val
              : labelOf(val, 'nombre', 'name') || '—';
          return (
            <span className="font-mono text-xs text-text-muted">
              {display}
            </span>
          );
        },
      }),
      columnHelper.accessor('ubicacion', {
        header: 'Ubicación Física',
        cell: (info) => {
          const loc = info.getValue();
          if (!loc) {
            return <span className="font-mono text-xs text-text-muted">—</span>;
          }
          if (typeof loc === 'string') {
            return (
              <div className="flex items-center gap-1.5 font-mono text-xs text-text-muted">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                <span>{loc}</span>
              </div>
            );
          }
          const salaStr = labelOf(loc.sala, 'nombre', 'sala');
          const cajonStr = labelOf(loc.cajon, 'codigo', 'nombre');
          return (
            <div className="flex items-center gap-1.5 font-mono text-xs text-text-muted">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-text-muted" />
              <span>
                {salaStr || 'Sala —'} · {cajonStr || 'Cajón —'}
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
              <div className="w-16 h-1.5 bg-surface-raised rounded-full overflow-hidden shrink-0">
                <div
                  className={cn(
                    'h-full transition-[width] duration-300',
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
                <span className="font-mono text-xs text-text">
                  {prod.stock} <span className="text-text-muted">(mín {prod.stockCritico})</span>
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
                  className="h-7 w-7 text-text-muted hover:text-text"
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
                  className="h-7 w-7 text-text-muted hover:text-text"
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
                  className="h-7 w-7 text-text-muted hover:text-text"
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
                  className="h-7 w-7 text-text-muted hover:text-text"
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
                  className="h-7 w-7 text-red-500 hover:text-red-700"
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
    [canDelete, expandedIds, onViewDetail, onEdit, onReubicar, onToggleActivo, onDelete],
  );

  const table = useReactTable({
    data: safeProductos,
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
    'h-8.5 rounded-md border border-border bg-surface px-2.5 font-mono text-xs text-text transition-colors placeholder:text-text-muted focus:border-text-muted focus:outline-none focus:ring-1 focus:ring-info';

  return (
    <div className="rounded-md border border-border bg-surface overflow-hidden shadow-xs">
      {/* Unified Toolbar with Frame */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border p-3 bg-surface-raised">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search box with / kbd shortcut */}
          <div className="relative min-w-0 flex-1 sm:h-8.5 sm:w-72 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
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
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-text-muted hover:text-text"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-4.5 select-none items-center rounded border border-border bg-surface-raised px-1 font-mono text-xs text-text-muted">
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
          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-mono text-text-muted ml-1 select-none">
            <input
              type="checkbox"
              checked={criticalOnly}
              onChange={(e) => onCriticalOnlyChange?.(e.target.checked)}
              aria-label="Solo stock crítico"
              className="rounded border-border text-text focus:ring-info"
            />
            <span className={criticalOnly ? 'text-danger font-semibold' : ''}>
              Bajo mínimo
            </span>
          </label>
        </div>

        {isFetching && (
          <div
            role="progressbar"
            aria-label="Cargando productos en pañol"
            className="flex items-center gap-1.5 text-xs text-text-muted font-mono"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin text-text-muted" />
            <span>Buscando…</span>
          </div>
        )}
      </div>

      {/* TanStack Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-surface-raised border-b border-border text-xs uppercase tracking-wider text-text-muted font-semibold font-mono">
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
                          className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-text-muted transition-colors hover:text-text focus-visible:outline-none"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === 'asc' ? (
                            <ChevronUp className="h-3.5 w-3.5 text-text" />
                          ) : sorted === 'desc' ? (
                            <ChevronDown className="h-3.5 w-3.5 text-text" />
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
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-xs text-text-muted font-mono">
                  <div
                    role="progressbar"
                    aria-label="Cargando productos en pañol"
                    className="flex items-center justify-center gap-2"
                  >
                    <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
                    <span>Buscando y cargando productos en pañol…</span>
                  </div>
                </td>
              </tr>
            ) : safeProductos.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-xs text-text-muted font-mono">
                  No se encontraron productos con los criterios seleccionados.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <tr className="hover:bg-surface-raised transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3.5 py-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                  {expandedIds.has(row.original.id) && (
                    <tr className="bg-background">
                      <td colSpan={columns.length} className="p-0 pl-10">
                        <ProductoUnidadesExpandidas producto={row.original} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Technical Pagination Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-2.5 text-xs text-text-muted font-mono bg-surface-raised">
        <div>
          Mostrando {firstShown} a {lastShown} de {totalRows} activos
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Filas:</span>
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
            <span className="px-2 text-text tabular-nums">
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
