import { useMemo } from 'react';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type { Student } from '@sgia/types';
import { MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatRun } from '@/features/usuarios/lib/run';

const columnHelper = createColumnHelper<Student>();

interface StudentsTableProps {
  rows: Student[];
  canDelete: boolean;
  onOpen: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}

export function StudentsTable({ rows, canDelete, onOpen, onEdit, onDelete }: StudentsTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('rut', {
        header: 'RUT',
        cell: (i) => (
          <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-surface-raised border border-border">
            {formatRun(i.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor('full_name', {
        header: 'Nombre',
        cell: (i) => (
          <span className="font-medium text-text">
            {i.getValue() || <span className="text-text-muted">Sin nombre</span>}
          </span>
        ),
      }),
      columnHelper.accessor((s) => s.career?.name ?? '', {
        id: 'career',
        header: 'Carrera',
        cell: (i) => <span className="text-text-muted">{i.getValue() || '—'}</span>,
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
                {canDelete && (
                  <DropdownMenuItem
                    className="text-danger"
                    onSelect={() => onDelete(row.original)}
                  >
                    Eliminar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      }),
    ],
    [canDelete, onOpen, onEdit, onDelete],
  );

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr
              key={hg.id}
              className="border-b border-border bg-background font-mono text-xs uppercase tracking-wider text-text-muted"
            >
              {hg.headers.map((h) => (
                <th key={h.id} className="px-4 py-2.5 font-medium">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-text-muted">
                No hay estudiantes para el filtro seleccionado.
              </td>
            </tr>
          )}
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-surface-raised">
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
