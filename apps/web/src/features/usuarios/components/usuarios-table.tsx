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
  Users,
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
import { EmptyState } from '@/components/ui/empty-state';
import { FILTER_CONTROL_CLASS } from '@/components/ui/form-control';
import { MobileRow } from '@/components/ui/mobile-row';
import { TableFrame } from '@/components/ui/table-frame';
import { TableSearch } from '@/components/ui/table-search';
import { ROW_CLASS, STICKY_COL_CLASS, TD_CLASS, TH_CLASS } from '@/components/ui/table-styles';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { CODE_CHIP_CLASS, TABLE_HEAD_CLASS } from '@/components/ui/typography';
import { UsuarioRowActions } from '@/features/usuarios/components/usuario-row-actions';
import { cn } from '@/lib/cn';
import { formatRun } from '../lib/run';

const columnHelper = createColumnHelper<UsuarioSinPassword>();

const accessorColumns = [
  columnHelper.accessor('run', {
    header: 'RUN',
    cell: (info) => {
      const val = info.getValue();
      return val ? (
        <span className={CODE_CHIP_CLASS}>{formatRun(val)}</span>
      ) : (
        <span className="text-zinc-500 dark:text-zinc-400">—</span>
      );
    },
  }),
  columnHelper.accessor('nombre', {
    header: 'Nombre',
    cell: (info) => (
      <span className="whitespace-nowrap font-medium text-zinc-900 dark:text-zinc-100">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('email', {
    header: 'Email',
    cell: (info) => (
      <span className="text-[13px] text-zinc-500 dark:text-zinc-400">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('rol', {
    header: 'Rol',
    cell: (info) => <Badge>{ROLE_LABELS[info.getValue()] ?? info.getValue()}</Badge>,
  }),
  columnHelper.display({
    id: 'assignment',
    header: 'Pañol / Carreras',
    cell: (info) => {
      const user = info.row.original;
      const careers = user.careers ?? [];
      return (
        <div className="flex flex-col gap-0.5 text-[13px]">
          {(user.storeroom?.code ?? user.storeroom_id) != null ? (
            <span className="font-code text-xs text-zinc-700 dark:text-zinc-300">
              {user.storeroom?.code ?? user.storeroom_id}
            </span>
          ) : careers.length === 0 ? (
            <span className="text-zinc-500 dark:text-zinc-400">—</span>
          ) : null}
          {careers.length > 0 && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
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
        <Badge tone="available" dot>activo</Badge>
      ) : (
        <Badge tone="retired" dot>inactivo</Badge>
      ),
  }),
  columnHelper.accessor('createdAt', {
    header: 'Creado',
    cell: (info) => {
      const val = info.getValue();
      if (!val) return <span className="text-zinc-500 dark:text-zinc-400">—</span>;
      const date = new Date(val);
      return (
        <span className="whitespace-nowrap font-mono text-[13px] text-zinc-500 dark:text-zinc-400">
          {Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('es-CL')}
        </span>
      );
    },
  }),
];

const controlClasses = FILTER_CONTROL_CLASS;

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
        cell: ({ row }) => (
          <UsuarioRowActions
            usuario={row.original}
            isSelf={currentUserId !== undefined && row.original.id === currentUserId}
            onEdit={onEdit}
            onToggleActivo={onToggleActivo}
            onDelete={onDelete}
          />
        ),
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

  const toolbar = (
    <TableToolbar>
      <TableSearch
        value={search}
        onChange={(value) => onSearchChange?.(value)}
        placeholder="Buscar por nombre o correo…"
        label="Buscar usuarios"
      />

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

      {isFetching && <span className="text-[13px] text-zinc-500 dark:text-zinc-400">Actualizando…</span>}
    </TableToolbar>
  );

  const footer = (
    <>
      <span>
        Mostrando <span className="font-mono">{firstShown}</span> a <span className="font-mono">{lastShown}</span> de{' '}
        <span className="font-mono">{totalRows}</span> usuarios
      </span>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5">
          Filas
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange?.(Number(event.target.value))}
            aria-label="Filas por página"
            className={cn(controlClasses, 'font-mono')}
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
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            aria-label="Página anterior"
          >
            <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
          </Button>
          <span className="px-1 font-mono text-zinc-700 dark:text-zinc-300">
            {totalPages === 0 ? 0 : currentPage} / {totalPages}
          </span>
          <Button
            type="button"
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
    usuarios.length > 0 ? (
      <ul>
        {usuarios.map((usuario) => (
          <MobileRow
            key={usuario.id}
            title={usuario.nombre}
            meta={`${ROLE_LABELS[usuario.rol] ?? usuario.rol} · ${usuario.activo ? 'activo' : 'inactivo'} · ${usuario.email}`}
            trailing={
              <UsuarioRowActions
                usuario={usuario}
                isSelf={currentUserId !== undefined && usuario.id === currentUserId}
                onEdit={onEdit}
                onToggleActivo={onToggleActivo}
                onDelete={onDelete}
              />
            }
          />
        ))}
      </ul>
    ) : undefined;

  return (
    <TableFrame toolbar={toolbar} footer={footer} mobile={mobile}>
      {usuarios.length === 0 ? (
        <EmptyState icon={Users} title="No se encontraron usuarios con los filtros aplicados." />
      ) : (
        <table className="w-full min-w-[1040px] border-collapse text-left">
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
                        index === 0 && `${STICKY_COL_CLASS} max-md:bg-zinc-50`,
                        header.column.id === 'acciones' && 'text-right',
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
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className={ROW_CLASS}>
                {row.getVisibleCells().map((cell, index) => (
                  <td
                    key={cell.id}
                    className={cn(TD_CLASS, index === 0 && `${STICKY_COL_CLASS} whitespace-nowrap`)}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </TableFrame>
  );
}
