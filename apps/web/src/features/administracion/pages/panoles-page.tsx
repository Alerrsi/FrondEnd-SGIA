import { useState } from 'react';
import { useDeleteStoreroom, useStorerooms } from '@sgia/api-client';
import type { Storeroom } from '@sgia/types';
import { AlertCircle, MoreHorizontal, Plus, Warehouse } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StoreroomFormDialog } from '@/features/administracion/components/storeroom-form-dialog';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import { PageHeading } from '@/components/ui/page-heading';
import { CODE_CHIP_CLASS, STATE_TEXT_CLASS, TABLE_HEAD_CLASS } from '@/components/ui/typography';

export default function PanolesPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading, isError } = useStorerooms({ search: search.trim() || undefined, per_page: 50 });
  const remove = useDeleteStoreroom();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Storeroom | null>(null);
  const [toDelete, setToDelete] = useState<Storeroom | null>(null);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove.mutateAsync(toDelete.id);
      toast.success(`Pañol ${toDelete.code} eliminado`);
    } catch (error) {
      // 422 (errors.storeroom): tiene salas, usuarios o préstamos.
      toast.error(apiErrorToMessage(error));
    } finally {
      setToDelete(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeading icon={Warehouse} title="Pañoles">
          Pañoles de la sede, con sus salas y usuarios asignados.
        </PageHeading>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nuevo pañol
        </Button>
      </div>

      <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
        <div className="border-b border-zinc-200 dark:border-zinc-800 p-2.5">
          <input
            type="search"
            aria-label="Buscar pañol"
            placeholder="Nombre o código…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full max-w-sm rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>
        {isLoading ? (
          <div className={`py-12 ${STATE_TEXT_CLASS}`}>Cargando pañoles…</div>
        ) : isError ? (
          <div className="m-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            No se pudieron cargar los pañoles.
          </div>
        ) : (
          <table className="w-full border-collapse text-left text-xs">
            <thead className={TABLE_HEAD_CLASS}>
              <tr>
                {['Código', 'Nombre', 'Ubicación', 'Salas', 'Usuarios', ''].map((h) => (
                  <th key={h || 'actions'} className="px-4 py-2.5 font-medium">
                    {h || <span className="sr-only">Acciones</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {(data?.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className={`px-4 py-10 ${STATE_TEXT_CLASS}`}>
                    No hay pañoles registrados.
                  </td>
                </tr>
              )}
              {data?.data.map((st) => (
                <tr key={String(st.id)} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40">
                  <td className="px-4 py-2.5">
                    <span className={CODE_CHIP_CLASS}>
                      {st.code}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-zinc-900 dark:text-zinc-100">{st.name}</td>
                  <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400">{st.general_location || '—'}</td>
                  <td className="px-4 py-2.5 font-mono tabular-nums">{st.locations_count ?? 0}</td>
                  <td className="px-4 py-2.5 font-mono tabular-nums">{st.users_count ?? 0}</td>
                  <td className="px-4 py-2.5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" aria-label={`Acciones de ${st.code}`}>
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => {
                            setEditing(st);
                            setFormOpen(true);
                          }}
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-rose-600 dark:text-rose-400" onSelect={() => setToDelete(st)}>
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <StoreroomFormDialog
        open={formOpen}
        storeroom={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />
      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar pañol"
        description={`Se eliminará el pañol ${toDelete?.name ?? ''}. No se puede si tiene salas, usuarios o préstamos.`}
        confirmLabel="Eliminar"
        variant="danger"
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
