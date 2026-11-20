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
  Trash2,
} from 'lucide-react';
import { useCajones, useLocations } from '@sgia/api-client';
import type { CajonEntity, LocationEntity, Producto } from '@sgia/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

import { ProductoUnidadesExpandidas } from './producto-unidades-expandidas';
import { CODE_CHIP_CLASS, STATE_TEXT_CLASS, TABLE_HEAD_CLASS } from '@/components/ui/typography';
import { FILTER_CONTROL_CLASS } from '@/components/ui/form-control';
import { MobileRow } from '@/components/ui/mobile-row';
import { SkeletonRows } from '@/components/ui/skeleton-rows';
import { TableFrame } from '@/components/ui/table-frame';
import { TableSearch } from '@/components/ui/table-search';
import { ICON_BUTTON_CLASS, ROW_CLASS, STICKY_COL_CLASS, TD_CLASS, TH_CLASS } from '@/components/ui/table-styles';
import { TableToolbar } from '@/components/ui/table-toolbar';

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
              className={ICON_BUTTON_CLASS}
            >
              <ChevronRight aria-hidden="true" className={cn('h-4 w-4', expanded && 'rotate-90')} />
            </button>
          );
        },
      }),
      columnHelper.accessor('codigoBarras', {
        header: 'SKU / Code128',
        cell: (info) => (
          <span className={`inline-flex items-center gap-1 ${CODE_CHIP_CLASS}`}>
            <Barcode aria-hidden="true" className="h-3 w-3 text-zinc-400 dark:text-zinc-500" />
            <span>{info.getValue() || '—'}</span>
          </span>
        ),
      }),
      columnHelper.accessor('nombre', {
        header: 'Activo / Modelo',
        cell: (info) => {
          const prod = info.row.original;
          return (
            <div className="flex min-w-48 max-w-xs flex-col gap-0.5">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug">{prod.nombre}</span>
              {prod.description && (
                <span className="line-clamp-1 text-[13px] text-zinc-500 dark:text-zinc-400">{prod.description}</span>
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
            <span className="text-[13px] text-zinc-600 dark:text-zinc-400">
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
            return <span className="text-[13px] text-zinc-400 dark:text-zinc-500">—</span>;
          }
          if (typeof loc === 'string') {
            return (
              <div className="flex items-center gap-1.5 whitespace-nowrap font-mono text-[13px] text-zinc-600 dark:text-zinc-400">
                <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                <span>{loc}</span>
              </div>
            );
          }
          const salaStr = labelOf(loc.sala, 'nombre', 'sala');
          const cajonStr = labelOf(loc.cajon, 'codigo', 'nombre');
          return (
            <div className="flex items-center gap-1.5 whitespace-nowrap font-mono text-[13px] text-zinc-600 dark:text-zinc-400">
              <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
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
              <div className="w-16 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden shrink-0">
                <div
                  className={cn(
                    'h-full',
                    isCritical ? 'bg-danger' : isWarning ? 'bg-warn' : 'bg-ok',
                  )}
                  style={{ width: `${Math.max(ratio, 8)}%` }}
                />
              </div>

              {isCritical ? (
                <Badge tone="critical" icon={<AlertTriangle aria-hidden="true" className="h-3 w-3" />}>
                  Stock crítico ({prod.stock} / {prod.stockCritico} mín)
                </Badge>
              ) : isWarning ? (
                <Badge tone="warning" icon={<AlertTriangle aria-hidden="true" className="h-3 w-3" />}>
                  Stock bajo ({prod.stock} / {prod.stockCritico} mín)
                </Badge>
              ) : (
                <span className="whitespace-nowrap font-mono text-[13px] text-zinc-700 dark:text-zinc-300">
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
                <button
                  type="button"
                  className={ICON_BUTTON_CLASS}
                  title="Ver detalle y código de barras"
                  aria-label={`Ver detalles de ${prod.nombre}`}
                  onClick={() => onViewDetail(prod)}
                >
                  <Eye aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              )}

              {onReubicar && (
                <button
                  type="button"
                  className={ICON_BUTTON_CLASS}
                  title="Reubicar en pañol"
                  aria-label={`Reubicar ${prod.nombre}`}
                  onClick={() => onReubicar(prod)}
                >
                  <ArrowRightLeft aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              )}

              {onEdit && (
                <button
                  type="button"
                  className={ICON_BUTTON_CLASS}
                  title="Editar producto"
                  aria-label={`Editar ${prod.nombre}`}
                  onClick={() => onEdit(prod)}
                >
                  <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              )}

              {onToggleActivo && (
                <button
                  type="button"
                  className={ICON_BUTTON_CLASS}
                  title={prod.activo ? 'Desactivar producto' : 'Activar producto'}
                  aria-label={`${prod.activo ? 'Desactivar' : 'Activar'} ${prod.nombre}`}
                  onClick={() => onToggleActivo(prod)}
                >
                  <Power aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              )}

              {canDelete && onDelete && (
                <button
                  type="button"
                  className={ICON_BUTTON_CLASS}
                  title="Eliminar producto"
                  aria-label={`Eliminar ${prod.nombre}`}
                  onClick={() => onDelete(prod)}
                >
                  <Trash2 aria-hidden="true" className="h-3.5 w-3.5 text-danger" />
                </button>
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

  const controlClasses = FILTER_CONTROL_CLASS;

  const toolbar = (
    <TableToolbar>
      <TableSearch
        value={search}
        onChange={(val) => onSearchChange?.(val)}
        placeholder="Buscar por nombre, SKU, marca…"
        label="Buscar productos"
      />

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

      <label className="flex min-h-8 cursor-pointer select-none items-center gap-1.5 px-1 text-[13px] text-zinc-600 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={criticalOnly}
          onChange={(e) => onCriticalOnlyChange?.(e.target.checked)}
          aria-label="Solo stock crítico"
          className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
        />
        <span className={criticalOnly ? 'font-medium text-danger' : ''}>Bajo mínimo</span>
      </label>

      {isFetching && (
        <div
          role="progressbar"
          aria-label="Cargando productos en pañol"
          className="flex items-center gap-1.5 text-[13px] text-zinc-500 dark:text-zinc-400 sm:ml-auto"
        >
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin text-zinc-400" />
          <span>Buscando…</span>
        </div>
      )}
    </TableToolbar>
  );

  const footer = (
    <>
      <span className="font-mono">
        Mostrando {firstShown} a {lastShown} de {totalRows} activos
      </span>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5">
          <span className="text-zinc-500 dark:text-zinc-400">Filas</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            aria-label="Filas por página"
            className={controlClasses}
          >
            {[10, 25, 50, 100].map((size) => (
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

  const mobile =
    !isLoading && safeProductos.length > 0 ? (
      <ul>
        {safeProductos.map((prod) => {
          const isCritical = prod.stock <= prod.stockCritico;
          return (
            <MobileRow
              key={prod.id}
              title={prod.nombre}
              meta={
                <span className="font-code">{prod.codigoBarras || '—'}</span>
              }
              trailing={
                <Badge tone={isCritical ? 'critical' : prod.activo ? 'available' : 'retired'}>
                  {isCritical ? `Stock ${prod.stock} / ${prod.stockCritico}` : prod.activo ? `Stock ${prod.stock}` : 'inactivo'}
                </Badge>
              }
              onClick={onViewDetail ? () => onViewDetail(prod) : undefined}
            />
          );
        })}
      </ul>
    ) : undefined;

  return (
    <TableFrame toolbar={toolbar} footer={footer} mobile={mobile}>
      <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
        <thead className={TABLE_HEAD_CLASS}>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header, index) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    className={cn(
                      TH_CLASS,
                      header.column.id === 'acciones' && 'text-right',
                      index === 1 && `${STICKY_COL_CLASS} max-md:bg-zinc-50`,
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
            <SkeletonRows columns={columns.length} rows={8} label="Buscando y cargando productos en pañol…" />
          ) : safeProductos.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={`px-4 py-12 ${STATE_TEXT_CLASS}`}>
                No se encontraron productos con los criterios seleccionados.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
                <tr className={ROW_CLASS}>
                  {row.getVisibleCells().map((cell, index) => (
                    <td key={cell.id} className={cn(TD_CLASS, index === 1 && STICKY_COL_CLASS)}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
                {expandedIds.has(row.original.id) && (
                  <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40">
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
    </TableFrame>
  );
}
