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
import { ROLE_LABELS, ROLES, type RoleCode, type UsuarioSinPassword } from '@sgia/types';

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
        <span className="font-mono text-xs text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 tabular-nums">
          {val ? formatRun(val) : '—'}
        </span>
      );
    },
  }),
  columnHelper.accessor('nombre', {
    header: 'Nombre',
    cell: (info) => (
      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('email', {
    header: 'Email',
    cell: (info) => (
      <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('rol', {
    header: 'Rol',
    cell: (info) => (
      <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-100/70 dark:bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
        {ROLE_LABELS[info.getValue()] ?? info.getValue()}
      </span>
    ),
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
      if (!val) return <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">—</span>;
      const date = new Date(val);
      return (
        <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
          {Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('es-CL')}
        </span>
      );
    },
  }),
];

const controlClasses =
  'h-8.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 font-mono text-xs text-zinc-800 dark:text-zinc-200 transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600';

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
                className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
              >
                <Pencil className="h-3.5 w-3.5" />
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
                  'rounded p-1 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400',
                  isSelf
                    ? 'cursor-not-allowed opacity-30 text-zinc-400'
                    : usuario.activo
                      ? 'text-zinc-400 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400'
                      : 'text-zinc-400 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400',
                )}
              >
                <Power className="h-3.5 w-3.5" />
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
                    'rounded p-1 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400',
                    isSelf
                      ? 'cursor-not-allowed opacity-30 text-zinc-400'
                      : 'text-zinc-400 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400',
                  )}
                >
                  <Trash2 className="h-3.5 w-3.5" />
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
    <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
      {/* Unified Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:h-8.5 sm:w-72 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
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
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300 focus-visible:outline-none"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-4.5 select-none items-center rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-1 font-mono text-[10px] text-zinc-400">
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
        </div>

        {isFetching && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
            <span>Actualizando…</span>
          </div>
        )}
      </div>

      {/* TanStack Table */}
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
            {usuarios.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-xs text-zinc-500 dark:text-zinc-400 font-mono"
                >
                  No se encontraron usuarios con los filtros aplicados.
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
          Mostrando {firstShown} a {lastShown} de {totalRows} usuarios
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">Filas:</span>
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
