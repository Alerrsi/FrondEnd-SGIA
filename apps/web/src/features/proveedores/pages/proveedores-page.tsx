import { useEffect, useState } from 'react';
import {
  useSetSupplierStatus,
  useSuppliers,
} from '@sgia/api-client';
import type { Supplier, SupplierArea } from '@sgia/types';
import { Building2, Plus } from 'lucide-react';

import { ExportExcelButton } from '@/components/shared/export-excel-button';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import { ProveedoresTable } from '@/features/proveedores/components/proveedores-table';
import { SupplierFormDialog } from '@/features/proveedores/components/supplier-form-dialog';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonList } from '@/components/ui/skeleton-list';

export default function ProveedoresPage() {
  const setSupplierStatus = useSetSupplierStatus();

  // Server-side filter & pagination state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState<SupplierArea | ''>('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Dialog targets
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [toggleTarget, setToggleTarget] = useState<Supplier | null>(null);

  const queryParams = {
    page,
    per_page: 20,
    // Búsqueda en el servidor (`GET /api/suppliers?search=`, docs/centro-reportes.md decisión 14).
    search: debouncedSearch || undefined,
    category: categoryFilter || undefined,
    area: areaFilter || undefined,
  };

  const { data, isLoading, isError, isFetching } = useSuppliers(queryParams);
  const suppliers = data?.data ?? [];

  const handleOpenCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (supplier: Supplier) => {
    setEditing(supplier);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const handleCategoryFilterChange = (category: string) => {
    setCategoryFilter(category);
    setPage(1);
  };

  const handleAreaFilterChange = (area: SupplierArea | '') => {
    setAreaFilter(area);
    setPage(1);
  };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    try {
      await setSupplierStatus.mutateAsync({
        id: toggleTarget.id,
        is_active: toggleTarget.is_active === false,
      });
      toast.success(
        toggleTarget.is_active !== false
          ? `Proveedor ${toggleTarget.name} suspendido`
          : `Proveedor ${toggleTarget.name} activado`,
      );
      setToggleTarget(null);
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    }
  };

  // Solo la primera carga muestra el esqueleto: al buscar se conserva la lista (y el foco del buscador).
  if (isLoading && !data) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-56" />
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <SkeletonList label="Cargando catálogo de proveedores…" rows={8} columns={4} />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <ErrorState>No se pudo cargar el catálogo de proveedores desde el servidor.</ErrorState>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Building2}
        title="Proveedores"
        description="Empresas a las que se envían solicitudes de cotización, con sus áreas y contacto."
        actions={
          <>
            <ExportExcelButton
              path="/suppliers/export"
              params={{ search: queryParams.search, category: queryParams.category, area: queryParams.area }}
              filenamePrefix="proveedores"
            />
            <Button variant="primary" onClick={handleOpenCreate}>
              <Plus aria-hidden="true" className="h-4 w-4" />
              Nuevo proveedor
            </Button>
          </>
        }
      />

      <ProveedoresTable
        suppliers={suppliers}
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={handleCategoryFilterChange}
        areaFilter={areaFilter}
        onAreaFilterChange={handleAreaFilterChange}
        isFetching={isFetching}
        onEdit={handleOpenEdit}
        onToggleStatus={setToggleTarget}
      />

      <SupplierFormDialog
        open={formOpen}
        onClose={handleCloseForm}
        supplier={editing}
      />

      {/* Confirmation dialog for status toggle */}
      <ConfirmDialog
        open={toggleTarget !== null}
        title={toggleTarget?.is_active !== false ? 'Suspender proveedor' : 'Activar proveedor'}
        description={
          toggleTarget
            ? `¿Seguro que deseas ${
                toggleTarget.is_active !== false ? 'suspender' : 'activar'
              } a ${toggleTarget.name}? ${
                toggleTarget.is_active !== false
                  ? 'El proveedor no aparecerá en cotizaciones ni órdenes de compra.'
                  : 'El proveedor volverá a estar disponible para cotizaciones.'
              }`
            : ''
        }
        confirmLabel={toggleTarget?.is_active !== false ? 'Suspender' : 'Activar'}
        variant={toggleTarget?.is_active !== false ? 'danger' : 'primary'}
        loading={setSupplierStatus.isPending}
        onConfirm={handleConfirmToggle}
        onCancel={() => setToggleTarget(null)}
      />
    </div>
  );
}
