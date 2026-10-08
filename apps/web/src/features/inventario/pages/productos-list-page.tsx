import { useEffect, useState } from 'react';
import {
  useDeleteProducto,
  useProducts,
  useToggleProductoActivo,
} from '@sgia/api-client';
import type { Producto, ProductoParams } from '@sgia/types';
import {
  AlertCircle,
  FileUp,
  Plus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuth } from '@/features/auth/context/auth-context';
import { apiErrorToMessage } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';
import { FacturaUploadModal } from '../components/factura-upload-modal';
import {
  InventarioTable,
  type EstadoFilter,
} from '../components/inventario-table';
import { ProductoDetailDialog } from '../components/producto-detail-dialog';
import { ProductoFormDialog } from '../components/producto-form-dialog';
import { ReubicarProductoModal } from '../components/reubicar-producto-modal';

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
  const [salaFilter, setSalaFilter] = useState('');
  const [cajonFilter, setCajonFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('todos');
  const [criticalOnly, setCriticalOnly] = useState(false);

  // Modales
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [detailProduct, setDetailProduct] = useState<Producto | null>(null);
  const [reubicarTarget, setReubicarTarget] = useState<Producto | null>(null);
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

  // Listener ergonómico para pistola lectora Code128 / escáner
  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está tipeando activamente en un input o modal
      const activeEl = document.activeElement;
      if (
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement
      ) {
        return;
      }

      // Atajo para enfocar buscador
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        searchInput?.focus();
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 100) {
        barcodeBuffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (barcodeBuffer.length >= 4) {
          e.preventDefault();
          setSearch(barcodeBuffer);
          setDebouncedSearch(barcodeBuffer);
          setPage(1);
          toast.success(`Código Code128 detectado: ${barcodeBuffer}`);
          barcodeBuffer = '';
        }
      } else if (e.key.length === 1) {
        barcodeBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const queryParams: ProductoParams = {
    page,
    perPage,
    search: debouncedSearch.trim() || undefined,
    area: areaFilter || undefined,
    sala: salaFilter || undefined,
    cajon: cajonFilter || undefined,
    is_active:
      estadoFilter === 'todos' ? undefined : estadoFilter === 'activos',
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

  return (
    <div className="flex flex-col gap-3.5">
      {/* 1. Encabezado Técnico Compacto y Acciones */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              SEDE TEMUCO · PAÑOL TI
            </span>
            <span className="text-zinc-400 dark:text-zinc-600 text-xs font-mono">/ Módulo FU-02</span>
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Control de Inventario y Activos
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {canScanInvoice && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFacturaModalOpen(true)}
              className="flex items-center gap-1.5 text-xs h-8"
            >
              <FileUp className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>Subir Factura (OCR)</span>
            </Button>
          )}

          {/* CTA Principal: Monocromático de alto contraste técnico */}
          <Button onClick={handleOpenCreate} size="sm" className="flex items-center gap-1.5 text-xs h-8">
            <Plus className="h-3.5 w-3.5" />
            <span>Dar de alta producto</span>
          </Button>
        </div>
      </div>

      {/* 2. Barra métrica horizontal compacta (Sustituye tarjetas gigantes de 150px) */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 px-4 py-2.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 dark:text-zinc-400">Total Referencias:</span>
          <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100 tabular-nums">
            {totalItems}
          </span>
        </div>
        <div className="h-3 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 dark:text-zinc-400">Stock Crítico:</span>
          <span
            className={cn(
              'font-mono font-medium',
              criticalItemsCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400',
            )}
          >
            {criticalItemsCount} {criticalItemsCount === 1 ? 'ítem bajo mínimo' : 'bajo mínimo'}
          </span>
        </div>
        <div className="h-3 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 dark:text-zinc-400">Lector Code128:</span>
          <span className="font-mono text-zinc-600 dark:text-zinc-400">Listo (Presiona /)</span>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="flex items-center gap-2 rounded-md border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>Error de conexión con el catálogo de pañol. Reintentando sincronización…</span>
        </div>
      )}

      {/* 3. Marco unificado: Toolbar + Tabla de Datos */}
      <InventarioTable
        productos={data?.data ?? []}
        isLoading={isLoading}
        isFetching={isFetching}
        canDelete={canDelete}
        search={search}
        onSearchChange={setSearch}
        areaFilter={areaFilter}
        onAreaFilterChange={(val) => {
          setAreaFilter(val);
          setPage(1);
        }}
        salaFilter={salaFilter}
        onSalaFilterChange={(val) => {
          setSalaFilter(val);
          setPage(1);
        }}
        cajonFilter={cajonFilter}
        onCajonFilterChange={(val) => {
          setCajonFilter(val);
          setPage(1);
        }}
        estadoFilter={estadoFilter}
        onEstadoFilterChange={(val) => {
          setEstadoFilter(val);
          setPage(1);
        }}
        criticalOnly={criticalOnly}
        onCriticalOnlyChange={(val) => {
          setCriticalOnly(val);
          setPage(1);
        }}
        onViewDetail={setDetailProduct}
        onEdit={handleOpenEdit}
        onReubicar={setReubicarTarget}
        onToggleActivo={setToggleTarget}
        onDelete={setDeleteTarget}
        page={page}
        pageSize={perPage}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPerPage(size);
          setPage(1);
        }}
        meta={data?.meta}
      />

      {/* Modales y Drawers */}
      <ProductoFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingProduct(null);
        }}
        producto={editingProduct}
      />

      <ProductoDetailDialog
        open={detailProduct !== null}
        onClose={() => setDetailProduct(null)}
        producto={detailProduct}
        onEdit={(prod) => {
          setDetailProduct(null);
          handleOpenEdit(prod);
        }}
      />

      <ReubicarProductoModal
        open={reubicarTarget !== null}
        onClose={() => setReubicarTarget(null)}
        producto={reubicarTarget}
      />

      {canScanInvoice && (
        <FacturaUploadModal
          open={facturaModalOpen}
          onClose={() => setFacturaModalOpen(false)}
          onSuccess={() => refetch()}
        />
      )}

      {/* Modal de confirmación para activar/desactivar */}
      <ConfirmDialog
        open={toggleTarget !== null}
        title={toggleTarget?.activo ? 'Desactivar producto' : 'Activar producto'}
        description={
          toggleTarget
            ? `¿Seguro que deseas ${toggleTarget.activo ? 'desactivar' : 'activar'} "${toggleTarget.nombre}"? ${
                toggleTarget.activo
                  ? 'El activo no aparecerá en búsquedas de nuevos préstamos.'
                  : 'El producto volverá a estar disponible en pañol.'
              }`
            : ''
        }
        confirmLabel={toggleTarget?.activo ? 'Desactivar' : 'Activar'}
        variant={toggleTarget?.activo ? 'danger' : 'primary'}
        loading={toggleProductoActivo.isPending}
        onConfirm={handleConfirmToggle}
        onCancel={() => setToggleTarget(null)}
      />

      {/* Modal de confirmación crítica de eliminación */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar producto del inventario"
        description={
          deleteTarget
            ? `¿Confirmas la eliminación permanente de "${deleteTarget.nombre}"? Esta acción solo se permite si el producto no tiene préstamos activos asociados.`
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
