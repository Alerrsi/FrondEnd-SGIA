import { formatDate } from '@/lib/format';
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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Loader2,
  Pencil,
  Power,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  ROLE_LABELS,
  ROLES,
  type Career,
  type RoleCode,
  type Storeroom,
  type StoreroomId,
  type UsuarioSinPassword,
} from '@sgia/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { formatRun } from '../lib/run';

const columnHelper = createColumnHelper<UsuarioSinPassword>();

const accessorColumns = [
  columnHelper.accessor('run', {
    header: 'RUN',
    cell: (info) => {
      const val = info.getValue();
      return (
        <span className="font-mono text-xs text-text bg-surface-raised px-2 py-0.5 rounded border border-border tabular-nums">
          {val ? formatRun(val) : '—'}
        </span>
      );
    },
  }),
  columnHelper.accessor('nombre', {
    header: 'Nombre',
    cell: (info) => (
      <span className="text-sm font-medium text-text">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('email', {
    header: 'Email',
    cell: (info) => (
      <span className="font-mono text-xs text-text-muted">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('rol', {
    header: 'Rol',
    cell: (info) => (
      <span className="font-mono text-xs text-text bg-surface-raised px-2 py-0.5 rounded border border-border">
        {ROLE_LABELS[info.getValue()] ?? info.getValue()}
      </span>
    ),
  }),
  columnHelper.display({
    id: 'assignment',
    header: 'Pañol / Carreras',
    cell: (info) => {
      const user = info.row.original;
      const careers = user.careers ?? [];
      return (
        <div className="flex flex-col gap-0.5 text-xs">
          <span className="font-mono text-text">
            {user.storeroom?.code ?? user.storeroom_id ?? '—'}
          </span>
          {careers.length > 0 && (
            <span className="text-xs text-text-muted">
              {careers.map((c) => c.code ?? c.name).join(', ')}
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
  columnHelper.accessor('createdAt', {
    header: 'Creado',
    cell: (info) => {
      const val = info.getValue();
      if (!val) return <span className="font-mono text-xs text-text-muted">—</span>;
      const date = new Date(val);
      return (
        <span className="font-mono text-xs text-text-muted tabular-nums">
          {Number.isNaN(date.getTime()) ? '—' : formatDate(date.toISOString())}
        </span>
      );
    },
  }),
];

const controlClasses =
  'h-8.5 rounded-md border border-border bg-surface px-2.5 font-mono text-xs text-text transition-colors placeholder:text-text-muted focus:border-text-muted focus:outline-none focus:ring-1 focus:ring-info';

export const estadoOptions = [
  { value: 'todos', label: 'Todos los estados' },
  { value: 'activo', label: 'Solo activos' },
  { value: 'inactivo', label: 'Solo inactivos' },
] as const;

export type EstadoFilter = (typeof estadoOptions)[number]['value'];

export interface UsuariosTableProps {
  usuarios: UsuarioSinPassword[];
  meta?: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
  search?: string;
  onSearchChange?: (value: string) => void;
  rolFilter?: RoleCode | '';
  onRolFilterChange?: (role: RoleCode | '') => void;
  estadoFilter?: EstadoFilter;
  onEstadoFilterChange?: (estado: EstadoFilter) => void;
  /** Opciones de los filtros por pañol y carrera (AD-01). Sin opciones no se muestran. */
  storerooms?: Storeroom[];
  careers?: Career[];
  storeroomFilter?: string;
  onStoreroomFilterChange?: (id: StoreroomId | '') => void;
  careerFilter?: number | '';
  onCareerFilterChange?: (id: number | '') => void;
  page?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  currentUserId?: number;
  isFetching?: boolean;
  onEdit: (usuario: UsuarioSinPassword) => void;
  onToggleActivo: (usuario: UsuarioSinPassword) => void;
  onDelete?: (usuario: UsuarioSinPassword) => void;
}

export function UsuariosTable({
  usuarios,
  meta,
  search = '',
  onSearchChange,
  rolFilter = '',
  onRolFilterChange,
  estadoFilter = 'todos',
  onEstadoFilterChange,
  storerooms = [],
  careers = [],
  storeroomFilter = '',
  onStoreroomFilterChange,
  careerFilter = '',
  onCareerFilterChange,
  page = 1,
  onPageChange,
  pageSize = 10,
  onPageSizeChange,
  currentUserId,
  isFetching = false,
  onEdit,
  onToggleActivo,
  onDelete,
}: UsuariosTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () => [
      ...accessorColumns,
      columnHelper.display({
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => {
          const usuario = row.original;
          const isSelf = currentUserId !== undefined && usuario.id === currentUserId;

          return (
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => onEdit(usuario)}
                aria-label={`Editar a ${usuario.nombre}`}
                title="Editar usuario"
                className="rounded p-1 text-text-muted hover:bg-surface-raised hover:text-text transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-info"
              >
                <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onToggleActivo(usuario)}
                disabled={isSelf}
                aria-label={
                  isSelf
                    ? 'No puedes desactivar tu propia cuenta'
                    : usuario.activo
                      ? `Desactivar a ${usuario.nombre}`
                      : `Activar a ${usuario.nombre}`
                }
                title={
                  isSelf
                    ? 'No puedes desactivar tu propia cuenta de administrador'
                    : usuario.activo
                      ? 'Desactivar usuario'
                      : 'Activar usuario'
                }
                className={cn(
                  'rounded p-1 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-info',
                  isSelf
                    ? 'cursor-not-allowed opacity-30 text-text-muted'
                    : usuario.activo
                      ? 'text-text-muted hover:bg-amber-500/10 hover:text-amber-600'
                      : 'text-text-muted hover:bg-emerald-500/10 hover:text-emerald-600',
                )}
              >
                <Power aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(usuario)}
                  disabled={isSelf}
                  aria-label={
                    isSelf
                      ? 'No puedes eliminar tu propia cuenta'
                      : `Eliminar a ${usuario.nombre}`
                  }
                  title={
                    isSelf
                      ? 'No puedes eliminar tu propia cuenta de administrador'
                      : 'Eliminar usuario'
                  }
                  className={cn(
                    'rounded p-1 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-info',
                    isSelf
                      ? 'cursor-not-allowed opacity-30 text-text-muted'
                      : 'text-text-muted hover:bg-danger-bg hover:text-danger',
                  )}
                >
                  <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        },
      }),
    ],
    [onEdit, onToggleActivo, onDelete, currentUserId],
  );

  const table = useReactTable({
    data: usuarios,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const currentPage = meta?.currentPage ?? page;
  const totalPages = meta?.lastPage ?? Math.max(1, Math.ceil((meta?.total ?? usuarios.length) / pageSize));
  const totalRows = meta?.total ?? usuarios.length;
  const firstShown = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastShown = Math.min(currentPage * pageSize, totalRows);

  return (
    <div className="rounded-md border border-border bg-surface overflow-hidden shadow-xs">
      {/* Unified Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border p-3 bg-surface-raised">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:h-8.5 sm:w-72 sm:flex-none">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder="Buscar por nombre o correo…"
              aria-label="Buscar usuarios"
              className={cn(controlClasses, 'w-full py-1.5 pl-9 pr-9')}
            />
            {search ? (
              <button
                type="button"
                onClick={() => onSearchChange?.('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-text-muted transition-colors hover:text-text focus-visible:outline-none"
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-4.5 select-none items-center rounded border border-border bg-surface-raised px-1 font-mono text-xs text-text-muted">
                /
              </kbd>
            )}
          </div>

          <select
            value={rolFilter}
            onChange={(event) => onRolFilterChange?.(event.target.value as RoleCode | '')}
            aria-label="Filtrar por rol"
            className={controlClasses}
          >
            <option value="">Todos los roles</option>
            {ROLES.map((rol) => (
              <option key={rol} value={rol}>
                {ROLE_LABELS[rol]}
              </option>
            ))}
          </select>

          <select
            value={estadoFilter}
            onChange={(event) => onEstadoFilterChange?.(event.target.value as EstadoFilter)}
            aria-label="Filtrar por estado"
            className={controlClasses}
          >
            {estadoOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {storerooms.length > 0 && (
            <select
              value={storeroomFilter}
              onChange={(event) => {
                const found = storerooms.find((st) => String(st.id) === event.target.value);
                onStoreroomFilterChange?.(found ? found.id : '');
              }}
              aria-label="Filtrar por pañol"
              className={controlClasses}
            >
              <option value="">Todos los pañoles</option>
              {storerooms.map((st) => (
                <option key={String(st.id)} value={String(st.id)}>
                  {st.name}
                </option>
              ))}
            </select>
          )}

          {careers.length > 0 && (
            <select
              value={careerFilter}
              onChange={(event) =>
                onCareerFilterChange?.(event.target.value ? Number(event.target.value) : '')
              }
              aria-label="Filtrar por carrera"
              className={controlClasses}
            >
              <option value="">Todas las carreras</option>
              {careers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code ? `${c.code} · ` : ''}
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {isFetching && (
          <div className="flex items-center gap-1.5 text-xs text-text-muted font-mono">
            <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin text-text-muted" />
            <span>Actualizando…</span>
          </div>
        )}
      </div>

      {/* TanStack Table */}
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
                            <ChevronUp aria-hidden="true" className="h-3.5 w-3.5 text-text" />
                          ) : sorted === 'desc' ? (
                            <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 text-text" />
                          ) : (
                            <ChevronsUpDown aria-hidden="true" className="h-3.5 w-3.5 opacity-40" />
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
            {usuarios.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-xs text-text-muted font-mono"
                >
                  No se encontraron usuarios con los filtros aplicados.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-surface-raised transition-colors"
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-2.5 text-xs text-text-muted font-mono bg-surface-raised">
        <div>
          Mostrando {firstShown} a {lastShown} de {totalRows} usuarios
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Filas:</span>
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange?.(Number(event.target.value))}
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
              <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
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
              <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
