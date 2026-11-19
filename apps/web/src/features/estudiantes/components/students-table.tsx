import { useMemo } from 'react';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type { Student } from '@sgia/types';
import { MoreHorizontal } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatRun } from '@/features/usuarios/lib/run';
import { CODE_CHIP_CLASS, STATE_TEXT_CLASS, TABLE_HEAD_CLASS } from '@/components/ui/typography';

const columnHelper = createColumnHelper<Student>();

interface StudentsTableProps {
  rows: Student[];
  onOpen: (student: Student) => void;
  onEdit: (student: Student) => void;
  /** Activa o desactiva (los estudiantes no se borran). */
  onToggleStatus: (student: Student) => void;
}

export function StudentsTable({ rows, onOpen, onEdit, onToggleStatus }: StudentsTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('rut', {
        header: 'RUT',
        cell: (i) => (
          <span className={CODE_CHIP_CLASS}>
            {formatRun(i.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor('full_name', {
        header: 'Nombre',
        cell: (i) => (
          <span className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100">
            {i.getValue() || <span className="text-zinc-400">Sin nombre</span>}
            {!i.row.original.is_active && <Badge tone="retired">Desactivado</Badge>}
          </span>
        ),
      }),
      columnHelper.accessor((s) => s.career?.name ?? '', {
        id: 'career',
        header: 'Carrera',
        cell: (i) => <span className="text-zinc-600 dark:text-zinc-400">{i.getValue() || '—'}</span>,
      }),
      columnHelper.accessor('loans_count', {
        header: 'Préstamos',
        cell: (i) => <span className="font-mono tabular-nums">{i.getValue() ?? 0}</span>,
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <span className="sr-only">Acciones</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button size="sm" variant="outline" onClick={() => onOpen(row.original)}>
              Ficha
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Más acciones de ${row.original.rut}`}
                >
                  <MoreHorizontal aria-hidden="true" className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onEdit(row.original)}>Editar</DropdownMenuItem>
                <DropdownMenuItem
                  className={row.original.is_active ? 'text-rose-600 dark:text-rose-400' : undefined}
                  onSelect={() => onToggleStatus(row.original)}
                >
                  {row.original.is_active ? 'Desactivar' : 'Activar'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      }),
    ],
    [onOpen, onEdit, onToggleStatus],
  );

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr
              key={hg.id}
              className={TABLE_HEAD_CLASS}
            >
              {hg.headers.map((h) => (
                <th key={h.id} className="px-4 py-2.5 font-medium">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className={`px-4 py-10 ${STATE_TEXT_CLASS}`}>
                No hay estudiantes para el filtro seleccionado.
              </td>
            </tr>
          )}
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-2.5">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
