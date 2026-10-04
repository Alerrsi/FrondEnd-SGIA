import { useEffect, useMemo, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type PaginationState,
  type SortingState,
} from '@tanstack/react-table';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Pencil,
  Power,
  Search,
  X,
} from 'lucide-react';
import { ROLE_LABELS, ROLES, type RoleCode, type UsuarioSinPassword } from '@sgia/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

const columnHelper = createColumnHelper<UsuarioSinPassword>();

const accessorColumns = [
  columnHelper.accessor('run', {
    header: 'RUN',
    cell: (info) => <span className="font-mono-tabular text-xs text-text">{info.getValue()}</span>,
  }),
  columnHelper.accessor('nombre', {
    header: 'Nombre',
    cell: (info) => <span className="text-sm text-text">{info.getValue()}</span>,
  }),
  columnHelper.accessor('email', {
    header: 'Email',
    cell: (info) => (
      <span className="font-mono-tabular text-xs text-text-muted">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor('rol', {
    header: 'Rol',
    cell: (info) => <Badge tone="neutral">{ROLE_LABELS[info.getValue()]}</Badge>,
  }),
  columnHelper.accessor('activo', {
    header: 'Estado',
    cell: (info) =>
      info.getValue() ? <Badge tone="success">activo</Badge> : <Badge tone="danger">inactivo</Badge>,
  }),
  columnHelper.accessor('createdAt', {
    header: 'Creado',
    cell: (info) => (
      <span className="font-mono-tabular text-xs text-text-muted">
        {new Date(info.getValue()).toLocaleDateString('es-CL')}
      </span>
    ),
  }),
];

const controlClasses =
  'h-9 rounded-lg border border-border bg-surface-raised px-3 font-mono-tabular text-xs text-text transition-colors placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const estadoOptions = [
  { value: 'todos', label: 'Todos los estados' },
  { value: 'activo', label: 'Solo activos' },
  { value: 'inactivo', label: 'Solo inactivos' },
] as const;

type EstadoFilter = (typeof estadoOptions)[number]['value'];

export function UsuariosTable({
  usuarios,
  onEdit,
  onToggleActivo,
}: {
  usuarios: UsuarioSinPassword[];
  onEdit: (usuario: UsuarioSinPassword) => void;
  onToggleActivo: (usuario: UsuarioSinPassword) => void;
}) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [rolFilter, setRolFilter] = useState<RoleCode | ''>('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('todos');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const columns = useMemo(
    () => [
      ...accessorColumns,
      columnHelper.display({
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => {
          const usuario = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => onEdit(usuario)}
                aria-label={`Editar a ${usuario.nombre}`}
                title="Editar usuario"
                className="rounded-lg border border-border p-2 text-text-muted transition-colors hover:bg-surface-raised hover:text-text focus-visible:outline-2 focus-visible:outline-accent"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onToggleActivo(usuario)}
                aria-label={usuario.activo ? `Desactivar a ${usuario.nombre}` : `Activar a ${usuario.nombre}`}
                title={usuario.activo ? 'Desactivar usuario' : 'Activar usuario'}
                className={cn(
                  'rounded-lg border p-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent',
                  usuario.activo
                    ? 'border-border text-text-muted hover:border-danger/30 hover:bg-danger/10 hover:text-danger'
                    : 'border-border text-accent-muted hover:border-success/30 hover:bg-success/10 hover:text-success',
                )}
              >
                <Power className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        },
      }),
    ],
    [onEdit, onToggleActivo],
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedQuery, rolFilter, estadoFilter]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return usuarios.filter((usuario) => {
      const matchesQuery =
        !q ||
        [usuario.run, usuario.nombre, usuario.email].some((value) =>
          Boolean(value && value.toLowerCase().includes(q)),
        );
      const matchesRol = !rolFilter || usuario.rol === rolFilter;
      const matchesEstado =
        estadoFilter === 'todos' ||
        (estadoFilter === 'activo' ? usuario.activo : !usuario.activo);
      return matchesQuery && matchesRol && matchesEstado;
    });
  }, [usuarios, debouncedQuery, rolFilter, estadoFilter]);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const rows = table.getRowModel().rows;
  const { pageIndex, pageSize } = pagination;
  const pageCount = table.getPageCount();
  const firstShown = rows.length === 0 ? 0 : pageIndex * pageSize + 1;
  const lastShown = pageIndex * pageSize + rows.length;

  return (
    <section
      aria-label="Listado de usuarios"
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
    >
      {/* Toolbar: búsqueda y filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:h-9 sm:w-72 sm:flex-none">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por RUN, nombre o email…"
            aria-label="Buscar usuarios"
            className={cn(controlClasses, 'w-full py-2 pl-9 pr-9')}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-text-muted transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-accent"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <select
          value={rolFilter}
          onChange={(event) => setRolFilter(event.target.value as RoleCode | '')}
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
          onChange={(event) => setEstadoFilter(event.target.value as EstadoFilter)}
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
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-text-muted"
                >
                  No se encontraron usuarios con los filtros aplicados.
                </td>
              </tr>
            )}
            {rows.map((row) => (
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-text-muted">
          Mostrando{' '}
          <span className="font-mono-tabular text-text">{firstShown}</span>–
          <span className="font-mono-tabular text-text">{lastShown}</span> de{' '}
          <span className="font-mono-tabular text-text">{filtered.length}</span> usuarios
        </span>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-text-muted">
            Filas por página
            <select
              value={pageSize}
              onChange={(event) => table.setPageSize(Number(event.target.value))}
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
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-mono-tabular text-xs text-text-muted">
              {pageCount === 0 ? 0 : pageIndex + 1} / {pageCount}
            </span>
            <Button
              variant="ghost"
              className="h-8 w-8 px-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
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