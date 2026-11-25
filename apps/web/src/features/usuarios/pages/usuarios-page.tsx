import { useEffect, useState } from 'react';
import {
  useCareers,
  useDeleteUsuario,
  useStorerooms,
  useToggleUsuarioActivo,
  useUsers,
} from '@sgia/api-client';
import type {
  RoleCode,
  StoreroomId,
  UserQueryParams,
  UsuarioSinPassword,
} from '@sgia/types';
import { Plus, Users } from 'lucide-react';

import { ExportExcelButton } from '@/components/shared/export-excel-button';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuth } from '@/features/auth/context/auth-context';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import { UsuarioFormDialog } from '@/features/usuarios/components/usuario-form-dialog';
import { UsuariosTable, type EstadoFilter } from '@/features/usuarios/components/usuarios-table';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonList } from '@/components/ui/skeleton-list';

export default function UsuariosPage() {
  const { user: currentUser } = useAuth();
  const toggleUsuarioActivo = useToggleUsuarioActivo();
  const deleteUsuario = useDeleteUsuario();

  // Server-side filter & pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [rolFilter, setRolFilter] = useState<RoleCode | ''>('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('todos');
  const [storeroomFilter, setStoreroomFilter] = useState<StoreroomId | ''>('');
  const [careerFilter, setCareerFilter] = useState<number | ''>('');
  const { data: storeroomsData } = useStorerooms({ per_page: 100 });
  const { data: careersData } = useCareers({ per_page: 100 });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Dialog targets
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UsuarioSinPassword | null>(null);
  const [toggleTarget, setToggleTarget] = useState<UsuarioSinPassword | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UsuarioSinPassword | null>(null);

  const queryParams: UserQueryParams = {
    page,
    per_page: perPage,
    search: debouncedSearch.trim() || undefined,
    role: rolFilter || undefined,
    is_active: estadoFilter === 'todos' ? undefined : estadoFilter === 'activo',
    storeroom_id: storeroomFilter === '' ? undefined : storeroomFilter,
    career_id: careerFilter === '' ? undefined : careerFilter,
  };

  const { data, isLoading, isError, isFetching } = useUsers(queryParams);

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

  const handleRoleFilterChange = (role: RoleCode | '') => {
    setRolFilter(role);
    setPage(1);
  };

  const handleEstadoFilterChange = (estado: EstadoFilter) => {
    setEstadoFilter(estado);
    setPage(1);
  };

  const handlePerPageChange = (size: number) => {
    setPerPage(size);
    setPage(1);
  };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;

    if (currentUser?.id === toggleTarget.id) {
      toast.error('No puedes desactivar tu propia cuenta de administrador.');
      setToggleTarget(null);
      return;
    }

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

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    if (currentUser?.id === deleteTarget.id) {
      toast.error('No puedes eliminar tu propia cuenta de administrador.');
      setDeleteTarget(null);
      return;
    }

    try {
      await deleteUsuario.mutateAsync(deleteTarget.id);
      toast.success(`Usuario ${deleteTarget.nombre} eliminado permanentemente`);
      setDeleteTarget(null);
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-56" />
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <SkeletonList label="Cargando directorio de usuarios…" rows={8} columns={5} />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <ErrorState>No se pudo cargar el listado de usuarios desde el servidor.</ErrorState>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Users}
        title="Directorio de usuarios"
        description="Cuentas de acceso al panel y a la app móvil: rol, pañol, carreras y estado."
        actions={
          <>
            <ExportExcelButton
              path="/users/export"
              params={{
                search: queryParams.search,
                role: queryParams.role,
                is_active: queryParams.is_active,
                storeroom_id: queryParams.storeroom_id,
                career_id: queryParams.career_id,
              }}
              filenamePrefix="usuarios"
            />
            <Button variant="primary" onClick={handleOpenCreate}>
              <Plus aria-hidden="true" className="h-4 w-4" />
              Nuevo usuario
            </Button>
          </>
        }
      />

      <UsuariosTable
        usuarios={data.data}
        meta={data.meta}
        search={search}
        onSearchChange={setSearch}
        rolFilter={rolFilter}
        onRolFilterChange={handleRoleFilterChange}
        estadoFilter={estadoFilter}
        onEstadoFilterChange={handleEstadoFilterChange}
        storerooms={storeroomsData?.data}
        careers={careersData?.data}
        storeroomFilter={storeroomFilter === '' ? '' : String(storeroomFilter)}
        onStoreroomFilterChange={(id) => {
          setStoreroomFilter(id);
          setPage(1);
        }}
        careerFilter={careerFilter}
        onCareerFilterChange={(id) => {
          setCareerFilter(id);
          setPage(1);
        }}
        page={page}
        onPageChange={setPage}
        pageSize={perPage}
        onPageSizeChange={handlePerPageChange}
        currentUserId={currentUser?.id}
        isFetching={isFetching}
        onEdit={handleOpenEdit}
        onToggleActivo={setToggleTarget}
        onDelete={setDeleteTarget}
      />

      <UsuarioFormDialog
        open={formOpen}
        onClose={handleCloseForm}
        usuario={editing}
      />

      {/* Confirmación de activación/desactivación */}
      <ConfirmDialog
        open={toggleTarget !== null}
        title={toggleTarget?.activo ? 'Desactivar usuario' : 'Activar usuario'}
        description={
          toggleTarget
            ? `¿Seguro que deseas ${toggleTarget.activo ? 'desactivar' : 'activar'} a ${toggleTarget.nombre}? ${
                toggleTarget.activo
                  ? 'El usuario perderá inmediatamente el acceso al sistema y sus sesiones activas serán revocadas.'
                  : 'El usuario podrá volver a ingresar al sistema con sus credenciales.'
              }`
            : ''
        }
        confirmLabel={toggleTarget?.activo ? 'Desactivar' : 'Activar'}
        variant={toggleTarget?.activo ? 'danger' : 'primary'}
        loading={toggleUsuarioActivo.isPending}
        onConfirm={handleConfirmToggle}
        onCancel={() => setToggleTarget(null)}
      />

      {/* Confirmación crítica de eliminación */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar usuario permanentemente"
        description={
          deleteTarget
            ? `¿Estás seguro de que deseas eliminar a ${deleteTarget.nombre} (${deleteTarget.email})? Esta acción es irreversible, revocará todos sus tokens y borrará su historial de sesiones.`
            : ''
        }
        confirmLabel="Eliminar usuario"
        cancelLabel="Cancelar"
        variant="danger"
        loading={deleteUsuario.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
