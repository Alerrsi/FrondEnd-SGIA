import { useCallback, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Bell,
  Layers,
  ShoppingCart,
} from 'lucide-react';
import { useCriticalStockAlerts, useResolveStockAlert } from '@sgia/api-client';
import type { CriticalStockAlert, Producto } from '@sgia/types';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuth } from '@/features/auth/context/auth-context';
import { canDo } from '@/features/auth/types/roles';
import { PurchaseRequestFormDialog } from '@/features/solicitudes-compra/components/purchase-request-form-dialog';
import type { PurchaseRequestFormValues } from '@/features/solicitudes-compra/lib/purchase-request-form-schema';
import { ProductoDetailDialog } from '@/features/inventario/components/producto-detail-dialog';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import {
  AlertasTable,
  type AlertStatusFilter,
  type AlertTypeFilter,
} from '../components/alertas-table';
import { PageHeading } from '@/components/ui/page-heading';

type RequestItems = PurchaseRequestFormValues['items'];

/** Cantidad sugerida para reponer: lo que falta para llegar al mínimo (al menos 1); editable en el diálogo. */
function toRequestItem(alert: CriticalStockAlert): RequestItems[number] {
  const stock = alert.current_stock ?? alert.product?.stock ?? alert.stock ?? 0;
  const min = alert.stock_minimo ?? alert.product?.stock_minimo ?? alert.product?.stockCritico ?? 0;
  return {
    product_id: alert.product_id,
    product_name: alert.product?.nombre ?? alert.producto?.nombre ?? alert.product_name ?? `Producto #${alert.product_id}`,
    quantity: Math.max(min - stock, 1),
  };
}

export default function AlertasStockPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canRequest = canDo(user?.rol, 'managePurchaseRequests');

  // Estados de paginación y filtros
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<AlertTypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<AlertStatusFilter>('active');

  // Modal / Diálogos
  const [resolvingAlert, setResolvingAlert] = useState<CriticalStockAlert | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);

  // Selección para crear una solicitud de compra; se conserva al cambiar de página.
  const [selected, setSelected] = useState<Map<number, CriticalStockAlert>>(new Map());
  const [requestItems, setRequestItems] = useState<RequestItems | null>(null);
  const selectedProductIds = useMemo(() => new Set(selected.keys()), [selected]);

  const toggleSelect = useCallback((alert: CriticalStockAlert) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(alert.product_id)) next.delete(alert.product_id);
      else next.set(alert.product_id, alert);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback((alerts: CriticalStockAlert[], checked: boolean) => {
    setSelected((prev) => {
      const next = new Map(prev);
      for (const a of alerts) {
        if (checked) next.set(a.product_id, a);
        else next.delete(a.product_id);
      }
      return next;
    });
  }, []);

  // Queries y Mutaciones
  const queryParams = useMemo(
    () => ({
      alert_type: typeFilter === 'all' ? undefined : typeFilter,
      is_resolved: statusFilter === 'all' ? undefined : statusFilter === 'resolved',
      per_page: pageSize,
      page,
    }),
    [typeFilter, statusFilter, pageSize, page],
  );

  const { data, isLoading, isFetching } = useCriticalStockAlerts(queryParams);
  const resolveMutation = useResolveStockAlert();

  // Cinta métrica: totales del servidor, calculados contra el stock real del inventario.
  // Sin `counts` (API antigua) se cuentan las alertas de la página cargada.
  const counts = data?.counts;
  const pageAlerts = data?.data ?? [];
  const totalActive = counts?.active ?? pageAlerts.filter((a) => !a.is_resolved).length;
  const criticalCount =
    counts?.critical ??
    pageAlerts.filter((a) => !a.is_resolved && a.alert_type === 'critical').length;
  const warningCount =
    counts?.warning ?? pageAlerts.filter((a) => !a.is_resolved && a.alert_type === 'warning').length;
  const totalResolved = counts?.resolved ?? pageAlerts.filter((a) => a.is_resolved).length;

  const rawAlerts = data?.data ?? [];

  // Filtrado local por búsqueda en memoria si aplica
  const filteredAlerts = useMemo(() => {
    if (!search.trim()) return rawAlerts;
    const term = search.toLowerCase().trim();
    return rawAlerts.filter((a) => {
      const name = (a.product?.nombre || a.producto?.nombre || a.product_name || '').toLowerCase();
      const sku = (a.product?.codigoBarras || a.product?.barcode || '').toLowerCase();
      return name.includes(term) || sku.includes(term);
    });
  }, [rawAlerts, search]);

  const handleConfirmResolve = async () => {
    if (!resolvingAlert) return;
    try {
      await resolveMutation.mutateAsync(resolvingAlert.id);
      toast.success(
        `Alerta para ${resolvingAlert.product_name ?? 'producto'} marcada como resuelta`,
      );
      setResolvingAlert(null);
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    }
  };

  const handleRequestOne = useCallback((alert: CriticalStockAlert) => {
    setRequestItems([toRequestItem(alert)]);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Encabezado y Miga Técnica */}
      <div className="flex flex-col gap-2">

        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageHeading icon={Bell} title="Alertas de stock crítico y preventivo">
            Monitoreo en tiempo real de quiebres y umbrales mínimos de hardware.
          </PageHeading>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/inventario')}
              className="text-xs gap-1.5"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Ver inventario</span>
            </Button>
            {canRequest && selected.size > 0 && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setRequestItems([...selected.values()].map(toRequestItem))}
                className="text-xs gap-1.5"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>Crear solicitud de compra ({selected.size})</span>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/solicitudes-compra')}
              className="text-xs gap-1.5"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Ir a solicitudes de compra</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Cinta Métrica Compacta (Metric Strip 36-40px) */}
      <div className="flex flex-wrap items-center divide-x divide-zinc-200 dark:divide-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 text-xs font-mono shadow-xs">
        <div className="flex items-center gap-2 pr-4">
          <span className="text-zinc-400 dark:text-zinc-500">Alertas activas:</span>
          <strong className="text-zinc-900 dark:text-zinc-100 tabular-nums font-semibold">
            {totalActive}
          </strong>
        </div>

        <div className="flex items-center gap-2 px-4">
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-zinc-400 dark:text-zinc-500">Nivel crítico (≤ mín):</span>
          <strong className="text-rose-600 dark:text-rose-400 tabular-nums font-semibold">
            {criticalCount}
          </strong>
        </div>

        <div className="flex items-center gap-2 px-4">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span className="text-zinc-400 dark:text-zinc-500">Advertencia (≤ mín + 5):</span>
          <strong className="text-amber-600 dark:text-amber-400 tabular-nums font-semibold">
            {warningCount}
          </strong>
        </div>

        <div className="flex items-center gap-2 pl-4">
          <CheckCircle className="h-3 w-3 text-emerald-500" />
          <span className="text-zinc-400 dark:text-zinc-500">Atendidas / resueltas:</span>
          <strong className="text-zinc-700 dark:text-zinc-300 tabular-nums font-semibold">
            {totalResolved}
          </strong>
        </div>
      </div>

      {/* Tabla de Alertas */}
      <AlertasTable
        alerts={filteredAlerts}
        isLoading={isLoading}
        isFetching={isFetching}
        search={search}
        onSearchChange={setSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={(val) => {
          setTypeFilter(val);
          setPage(1);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
        onResolve={(alert) => setResolvingAlert(alert)}
        onViewProduct={(product) => setSelectedProduct(product)}
        onRequestQuote={canRequest ? handleRequestOne : undefined}
        selectable={canRequest}
        selectedProductIds={selectedProductIds}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        meta={data?.meta}
      />

      {/* Diálogo de Confirmación para Resolver Alerta */}
      <ConfirmDialog
        open={resolvingAlert !== null}
        title="Resolver alerta de existencias"
        description={
          resolvingAlert
            ? `¿Deseas marcar como resuelta la alerta para "${resolvingAlert.product_name ?? 'este producto'}"? Esto indicará que la situación de inventario fue atendida o regularizada.`
            : ''
        }
        confirmLabel="Marcar como resuelta"
        variant="primary"
        loading={resolveMutation.isPending}
        onConfirm={handleConfirmResolve}
        onCancel={() => setResolvingAlert(null)}
      />

      {canRequest && (
        <PurchaseRequestFormDialog
          open={requestItems !== null}
          onClose={() => setRequestItems(null)}
          initialItems={requestItems ?? undefined}
          initialNotes="Reposición por alerta de stock."
          onSaved={(r) => {
            setSelected(new Map());
            navigate(`/solicitudes-compra/${r.id}`);
          }}
        />
      )}

      {/* Ficha Técnica de Producto Afectado */}
      <ProductoDetailDialog
        open={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        producto={selectedProduct}
      />
    </div>
  );
}
