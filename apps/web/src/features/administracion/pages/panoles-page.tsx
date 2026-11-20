import { useState } from 'react';
import { useDeleteStoreroom, useStorerooms } from '@sgia/api-client';
import type { Storeroom } from '@sgia/types';
import { MoreHorizontal, Plus, Warehouse } from 'lucide-react';

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
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/ui/page-header';
import { TableFrame } from '@/components/ui/table-frame';
import { TableSearch } from '@/components/ui/table-search';
import { ICON_BUTTON_CLASS, ROW_CLASS, STICKY_COL_CLASS, TD_CLASS, TH_CLASS } from '@/components/ui/table-styles';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { CODE_CHIP_CLASS, TABLE_HEAD_CLASS } from '@/components/ui/typography';
import { cn } from '@/lib/cn';
import { SkeletonList } from '@/components/ui/skeleton-list';

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

  const storerooms = data?.data ?? [];

  const toolbar = (
    <TableToolbar>
      <TableSearch value={search} onChange={setSearch} placeholder="Nombre o código…" label="Buscar pañol" />
    </TableToolbar>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Warehouse}
        title="Pañoles"
        description="Pañoles de la sede, con sus salas y usuarios asignados."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Nuevo pañol
          </Button>
        }
      />

      <TableFrame toolbar={toolbar}>
        {isLoading ? (
          <SkeletonList label="Cargando pañoles…" rows={4} columns={3} />
        ) : isError ? (
          <div className="p-3">
            <ErrorState>No se pudieron cargar los pañoles.</ErrorState>
          </div>
        ) : storerooms.length === 0 ? (
          <EmptyState icon={Warehouse} title="No hay pañoles registrados." />
        ) : (
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead className={TABLE_HEAD_CLASS}>
              <tr>
                {['Código', 'Nombre', 'Ubicación', 'Salas', 'Usuarios', ''].map((h, i) => (
                  <th
                    key={h || 'actions'}
                    className={cn(
                      TH_CLASS,
                      i === 0 && `${STICKY_COL_CLASS} max-md:bg-zinc-50`,
                      (h === 'Salas' || h === 'Usuarios') && 'text-right',
                    )}
                  >
                    {h || <span className="sr-only">Acciones</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {storerooms.map((st) => (
                <tr key={String(st.id)} className={ROW_CLASS}>
                  <td className={`${TD_CLASS} ${STICKY_COL_CLASS} whitespace-nowrap`}>
                    <span className={CODE_CHIP_CLASS}>{st.code}</span>
                  </td>
                  <td className={`${TD_CLASS} font-medium text-zinc-900 dark:text-zinc-100`}>{st.name}</td>
                  <td className={`${TD_CLASS} text-zinc-600 dark:text-zinc-400`}>{st.general_location || '—'}</td>
                  <td className={`${TD_CLASS} text-right font-mono`}>{st.locations_count ?? 0}</td>
                  <td className={`${TD_CLASS} text-right font-mono`}>{st.users_count ?? 0}</td>
                  <td className={`${TD_CLASS} text-right`}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" aria-label={`Acciones de ${st.code}`} className={ICON_BUTTON_CLASS}>
                          <MoreHorizontal aria-hidden="true" className="h-3.5 w-3.5" />
                        </button>
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
                        <DropdownMenuItem className="text-danger" onSelect={() => setToDelete(st)}>
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
      </TableFrame>

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
