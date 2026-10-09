import { useEffect, useState } from 'react';
import {
  useSetSupplierStatus,
  useSuppliers,
} from '@sgia/api-client';
import type { Supplier } from '@sgia/types';
import { AlertCircle, Building2, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import { ProveedoresTable } from '@/features/proveedores/components/proveedores-table';
import { SupplierFormDialog } from '@/features/proveedores/components/supplier-form-dialog';

export default function ProveedoresPage() {
  const setSupplierStatus = useSetSupplierStatus();

  // Server-side filter & pagination state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

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
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [toggleTarget, setToggleTarget] = useState<Supplier | null>(null);

  const queryParams = {
    page,
    per_page: 20,
    category: categoryFilter || undefined,
  };

  const { data, isLoading, isError, isFetching } = useSuppliers(queryParams);

  // Client-side search filtering (until backend supports search param)
  const filteredSuppliers = (data?.data ?? []).filter((s) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.contact_name?.toLowerCase().includes(q) ?? false) ||
      s.email.toLowerCase().includes(q)
    );
  });

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

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400 py-12 justify-center">
        <span>Cargando catálogo de proveedores…</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 p-4 text-xs font-medium text-red-700 dark:text-red-400">
        <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
        <span>No se pudo cargar el catálogo de proveedores desde el servidor.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-red-600 dark:text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600 dark:bg-red-500 animate-pulse" />
            SEDE TEMUCO · ADQUISICIONES
          </span>
          <span className="text-zinc-400 text-xs font-mono">/</span>
          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Proveedores
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
              Catálogo de Proveedores
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Gestión de empresas proveedoras para cotizaciones y adquisiciones de insumos (REQ-07).
            </p>
          </div>
          <Button variant="primary" onClick={handleOpenCreate} className="text-xs">
            <Plus className="h-4 w-4" />
            Nuevo proveedor
          </Button>
        </div>
      </div>

      <ProveedoresTable
        suppliers={filteredSuppliers}
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={handleCategoryFilterChange}
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
