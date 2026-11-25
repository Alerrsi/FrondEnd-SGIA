import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  useCajon,
  useDeleteProducto,
  useProducts,
  useToggleProductoActivo,
} from '@sgia/api-client';
import type { Producto, ProductoParams } from '@sgia/types';
import { Boxes, FileUp, Plus, X } from 'lucide-react';

import { ExportExcelButton } from '@/components/shared/export-excel-button';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { canDo } from '@/features/auth/types/roles';
import { useAuth } from '@/features/auth/context/auth-context';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import {
  InventarioTable,
  type EstadoFilter,
} from '../components/inventario-table';
import { InvoiceIntakeReviewSheet } from '@/features/ingresos-factura/components/invoice-intake-review-sheet';
import { UploadInvoiceIntakeDialog } from '@/features/ingresos-factura/components/upload-invoice-intake-dialog';
import { ProductoDetailDialog } from '../components/producto-detail-dialog';
import { ProductoFormDialog } from '../components/producto-form-dialog';
import { ReubicarProductoModal } from '../components/reubicar-producto-modal';
import { Cell } from '@/components/ui/cell';
import { CellGrid } from '@/components/ui/cell-grid';
import { ErrorState } from '@/components/ui/error-state';
import { Metric } from '@/components/ui/metric';
import { PageHeader } from '@/components/ui/page-header';
import { CODE_CHIP_CLASS } from '@/components/ui/typography';

export default function ProductosListPage() {
  const { user } = useAuth();
  const toggleProductoActivo = useToggleProductoActivo();
  const deleteProducto = useDeleteProducto();

  // Roles permitidos para acciones especiales. El alta por factura se hace en este mismo menú (REQ-17).
  const canScanInvoice = canDo(user?.rol, 'scanInvoice');
  const canDelete = canDo(user?.rol, 'deleteProduct');

  // Server-side query filters & pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  // `?q=` llega desde el escaneo de Inicio (rediseño «Trazo», fase 4).
  const [searchParams, setSearchParams] = useSearchParams();
  // REQ-22: «Ver en inventario» desde el pop-up del mapa filtra por cajón (`?cajon_id=`).
  const cajonIdParam = Number(searchParams.get('cajon_id'));
  const cajonIdFilter = Number.isInteger(cajonIdParam) && cajonIdParam > 0 ? cajonIdParam : undefined;
  const { data: cajonFiltrado } = useCajon(cajonIdFilter);
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [salaFilter, setSalaFilter] = useState('');
  const [cajonFilter, setCajonFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('todos');
  const [criticalOnly, setCriticalOnly] = useState(false);

  // Modales
  const [invoiceUploadOpen, setInvoiceUploadOpen] = useState(false);
  const [invoiceIntakeId, setInvoiceIntakeId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [detailProduct, setDetailProduct] = useState<Producto | null>(null);
  const [reubicarTarget, setReubicarTarget] = useState<Producto | null>(null);
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
    cajon_id: cajonIdFilter,
    is_active:
      estadoFilter === 'todos' ? undefined : estadoFilter === 'activos',
    critical_only: criticalOnly ? true : undefined,
  };

  const { data, isLoading, isError, isFetching } =
    useProducts(queryParams);

  // Mismos filtros que el listado, sin paginación (docs/reportes-excel.md).
  const exportParams = {
    search: queryParams.search,
    area: queryParams.area,
    sala: queryParams.sala,
    cajon: queryParams.cajon,
    cajon_id: queryParams.cajon_id,
    is_active: queryParams.is_active,
    critical_only: queryParams.critical_only,
  };

  // Contadores rápidos para métricas
  const totalItems = data?.meta?.total ?? 0;
  const productosList = Array.isArray(data?.data)
    ? data.data.filter((p): p is Producto => Boolean(p && typeof p === "object"))
    : [];
  // Total del servidor: contar en la página cargada daba solo los de esa página.
  const { data: criticalData } = useProducts({ page: 1, perPage: 1, critical_only: true });
  const criticalItemsCount = criticalData?.meta?.total ?? 0;

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
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Boxes}
        title="Inventario"
        description="Productos, insumos y equipos del pañol con su stock, ubicación y estado."
        actions={
          <>
            <ExportExcelButton path="/products/export" params={exportParams} filenamePrefix="inventario" />
            {canScanInvoice && (
              <Button variant="secondary" size="sm" onClick={() => setInvoiceUploadOpen(true)}>
                <FileUp aria-hidden="true" className="h-3.5 w-3.5" />
                Ingresar por factura
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={handleOpenCreate}>
              <Plus aria-hidden="true" className="h-3.5 w-3.5" />
              Dar de alta producto
            </Button>
          </>
        }
      />

      {cajonIdFilter && (
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-zinc-600 dark:text-zinc-300">
          Mostrando el cajón
          <span className={CODE_CHIP_CLASS}>{cajonFiltrado?.barcode ?? cajonFiltrado?.codigo ?? `#${cajonIdFilter}`}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.delete('cajon_id');
              setSearchParams(next);
            }}
          >
            <X aria-hidden="true" className="h-3.5 w-3.5" />
            Quitar filtro
          </Button>
        </div>
      )}

      <CellGrid columns={3} aria-label="Resumen del inventario">
        <Cell>
          <Metric label="Referencias" value={totalItems} hint="En el catálogo del pañol" />
        </Cell>
        <Cell>
          <Metric
            label="Stock crítico"
            value={criticalItemsCount}
            tone={criticalItemsCount > 0 ? 'danger' : 'neutral'}
            hint={criticalItemsCount > 0 ? 'Bajo el mínimo' : 'Al día'}
          />
        </Cell>
        <Cell>
          <Metric label="Lector Code128" value="Listo" hint="Escanea un código o presiona /" />
        </Cell>
      </CellGrid>

      {isError && (
        <ErrorState>Error de conexión con el catálogo de pañol. Reintentando sincronización…</ErrorState>
      )}

      <InventarioTable
        productos={productosList}
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
      <UploadInvoiceIntakeDialog
        open={invoiceUploadOpen}
        onClose={() => setInvoiceUploadOpen(false)}
        onUploaded={(intake) => {
          setInvoiceUploadOpen(false);
          setInvoiceIntakeId(intake.id);
        }}
      />

      <InvoiceIntakeReviewSheet
        intakeId={invoiceIntakeId}
        onClose={() => setInvoiceIntakeId(null)}
      />

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
