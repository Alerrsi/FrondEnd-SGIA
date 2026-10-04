import { useState } from 'react';
import { useToggleUsuarioActivo, useUsers } from '@sgia/api-client';
import type { UsuarioSinPassword } from '@sgia/types';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { apiErrorToMessage } from '@/lib/api-error';
import { UsuarioFormDialog } from '@/features/usuarios/components/usuario-form-dialog';
import { UsuariosTable } from '@/features/usuarios/components/usuarios-table';

export default function UsuariosPage() {
  const { data, isLoading, isError } = useUsers();
  const toggleUsuarioActivo = useToggleUsuarioActivo();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UsuarioSinPassword | null>(null);
  const [toggleTarget, setToggleTarget] = useState<UsuarioSinPassword | null>(null);

  const handleOpenCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (usuario: UsuarioSinPassword) => {
    setEditing(usuario);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    try {
      await toggleUsuarioActivo.mutateAsync({
        id: toggleTarget.id,
        activo: !toggleTarget.activo,
      });
      toast.success(
        toggleTarget.activo
          ? `Usuario ${toggleTarget.nombre} desactivado`
          : `Usuario ${toggleTarget.nombre} activado`,
      );
      setToggleTarget(null);
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    }
  };

  if (isLoading) {
    return <p className="text-sm text-text-muted">Cargando usuarios…</p>;
  }

  if (isError || !data) {
    return <p className="text-sm text-danger">No se pudo cargar los usuarios.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-mono-tabular text-xl text-text">Usuarios</h1>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </Button>
      </div>

      <UsuariosTable
        usuarios={data.data}
        onEdit={handleOpenEdit}
        onToggleActivo={setToggleTarget}
      />

      <UsuarioFormDialog
        open={formOpen}
        onClose={handleCloseForm}
        usuario={editing}
      />

      <ConfirmDialog
        open={toggleTarget !== null}
        title={toggleTarget?.activo ? 'Desactivar usuario' : 'Activar usuario'}
        description={
          toggleTarget
            ? `¿Seguro que deseas ${toggleTarget.activo ? 'desactivar' : 'activar'} a ${toggleTarget.nombre}?`
            : ''
        }
        confirmLabel={toggleTarget?.activo ? 'Desactivar' : 'Activar'}
        variant={toggleTarget?.activo ? 'danger' : 'primary'}
        loading={toggleUsuarioActivo.isPending}
        onConfirm={handleConfirmToggle}
        onCancel={() => setToggleTarget(null)}
      />
    </div>
  );
}