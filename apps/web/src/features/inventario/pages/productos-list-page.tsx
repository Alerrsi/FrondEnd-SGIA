import { useEffect, useState } from 'react';
import {
  useDeleteProducto,
  useProducts,
  useToggleProductoActivo,
} from '@sgia/api-client';
import type { Producto, ProductoParams } from '@sgia/types';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileUp,
  Package,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuth } from '@/features/auth/context/auth-context';
import { apiErrorToMessage } from '@/lib/api-error';
import { FacturaUploadModal } from '../components/factura-upload-modal';
import {
  InventarioTable,
  type EstadoFilter,
} from '../components/inventario-table';
import { ProductoDetailDialog } from '../components/producto-detail-dialog';
import { ProductoFormDialog } from '../components/producto-form-dialog';

export default function ProductosListPage() {
  const { user } = useAuth();
  const toggleProductoActivo = useToggleProductoActivo();
  const deleteProducto = useDeleteProducto();

  // Roles permitidos para acciones especiales
  const canScanInvoice = user?.rol === 'DIR-01' || user?.rol === 'AD-01';
  const canDelete = user?.rol === 'AD-01' || user?.rol === 'DIR-01';

  // Server-side query filters & pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('todos');
  const [criticalOnly, setCriticalOnly] = useState(false);

  // Modales
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [detailProduct, setDetailProduct] = useState<Producto | null>(null);
  const [facturaModalOpen, setFacturaModalOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<Producto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Producto | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams: ProductoParams = {
    page,
    per_page: perPage,
    search: debouncedSearch.trim() || undefined,
    area: areaFilter || undefined,
    is_active:
      estadoFilter === 'todos' ? undefined : estadoFilter === 'activo',
    critical_only: criticalOnly ? true : undefined,
  };

  const { data, isLoading, isError, isFetching, refetch } =
    useProducts(queryParams);

  // Contadores rápidos para métricas
  const totalItems = data?.meta?.total ?? 0;
  const criticalItemsCount = (data?.data ?? []).filter(
    (p) => p.stock <= p.stockCritico,
  ).length;

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (producto: Producto) => {
    setEditingProduct(producto);
    setFormOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    try {
      await toggleProductoActivo.mutateAsync({
        id: toggleTarget.id,
        is_active: !toggleTarget.activo,
      });
      toast.success(
        toggleTarget.activo
          ? `Producto "${toggleTarget.nombre}" desactivado`
          : `Producto "${toggleTarget.nombre}" activado`,
      );
      setToggleTarget(null);
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProducto.mutateAsync(deleteTarget.id);
      toast.success(
        `Producto "${deleteTarget.nombre}" eliminado del catálogo`,
      );
      setDeleteTarget(null);
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    }
  };

  if (isLoading) {
    return <p className="text-sm text-text-muted">Cargando catálogo de inventario…</p>;
  }

  if (isError || !data) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <span>No se pudo conectar con el catálogo de inventario.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Encabezado y acciones principales */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono-tabular text-xl font-bold tracking-tight text-text">
            Catálogo de Inventario
          </h1>
          <p className="text-xs text-text-muted">
            Control de insumos, herramientas y activos de pañol con código de barras Code128.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canScanInvoice && (
            <Button
              variant="ghost"
              onClick={() => setFacturaModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <FileUp className="h-4 w-4 text-accent" />
              <span>Subir Factura (OCR)</span>
            </Button>
          )}

          <Button onClick={handleOpenCreate} className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Nuevo producto</span>
          </Button>
        </div>
      </div>

      {/* Tarjetas de estado rápido */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-raised text-accent">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-text-muted">Total de referencias</span>
            <p className="font-mono-tabular text-lg font-bold text-text">
              {totalItems} <span className="text-xs font-normal text-text-muted">productos</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-text-muted">Stock en umbral crítico</span>
            <p className="font-mono-tabular text-lg font-bold text-warning">
              {criticalItemsCount}{' '}
              <span className="text-xs font-normal text-text-muted">en esta página</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-text-muted">Estado del pañol</span>
            <p className="text-sm font-semibold text-text">Operativo y Sincronizado</p>
          </div>
        </div>
      </div>

      {/* Tabla de Inventario con búsqueda, filtros y paginación en servidor */}
      <InventarioTable
        productos={data.data}
        meta={data.meta}
        search={search}
        onSearchChange={setSearch}
        areaFilter={areaFilter}
        onAreaFilterChange={(a) => {
          setAreaFilter(a);
          setPage(1);
        }}
        estadoFilter={estadoFilter}
        onEstadoFilterChange={(e) => {
          setEstadoFilter(e);
          setPage(1);
        }}
        criticalOnly={criticalOnly}
        onCriticalOnlyChange={(c) => {
          setCriticalOnly(c);
          setPage(1);
        }}
        page={page}
        onPageChange={setPage}
        pageSize={perPage}
        onPageSizeChange={(s) => {
          setPerPage(s);
          setPage(1);
        }}
        isFetching={isFetching}
        canDelete={canDelete}
        onViewDetail={setDetailProduct}
        onEdit={handleOpenEdit}
        onToggleActivo={setToggleTarget}
        onDelete={setDeleteTarget}
      />

      {/* Modal de Creación / Edición */}
      <ProductoFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingProduct(null);
        }}
        producto={editingProduct}
      />

      {/* Modal de Detalle con Código de Barras SVG e Impresión */}
      <ProductoDetailDialog
        open={detailProduct !== null}
        onClose={() => setDetailProduct(null)}
        producto={detailProduct}
        onEdit={(prod) => {
          setDetailProduct(null);
          handleOpenEdit(prod);
        }}
      />

      {/* Modal de Subida OCR de Factura */}
      <FacturaUploadModal
        open={facturaModalOpen}
        onClose={() => setFacturaModalOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* Diálogo de Confirmación de Activación/Desactivación */}
      <ConfirmDialog
        open={toggleTarget !== null}
        title={toggleTarget?.activo ? 'Desactivar producto' : 'Activar producto'}
        description={
          toggleTarget
            ? `¿Deseas ${toggleTarget.activo ? 'desactivar' : 'activar'} "${toggleTarget.nombre}"? ${
                toggleTarget.activo
                  ? 'El producto no podrá ser seleccionado en nuevas solicitudes de préstamos.'
                  : 'El producto volverá a estar disponible para el pañol y solicitudes de docentes.'
              }`
            : ''
        }
        confirmLabel={toggleTarget?.activo ? 'Desactivar' : 'Activar'}
        variant={toggleTarget?.activo ? 'danger' : 'primary'}
        loading={toggleProductoActivo.isPending}
        onConfirm={handleConfirmToggle}
        onCancel={() => setToggleTarget(null)}
      />

      {/* Diálogo Crítico de Eliminación de Producto */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar producto del inventario"
        description={
          deleteTarget
            ? `¿Estás seguro de que deseas eliminar permanentemente "${deleteTarget.nombre}"? Esta acción borrará el registro de inventario.`
            : ''
        }
        confirmLabel="Eliminar producto"
        cancelLabel="Cancelar"
        variant="danger"
        loading={deleteProducto.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
