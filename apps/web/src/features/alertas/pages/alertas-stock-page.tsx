import { useCallback, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Layers, ShoppingCart } from 'lucide-react';
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
import { Cell } from '@/components/ui/cell';
import { CellGrid } from '@/components/ui/cell-grid';
import { Metric } from '@/components/ui/metric';
import { PageHeader } from '@/components/ui/page-header';

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
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Bell}
        title="Alertas de stock crítico y preventivo"
        description="Productos bajo su stock mínimo o cerca de él, para reponer antes de que falten."
        actions={
          <>
            <Button type="button" variant="secondary" size="sm" onClick={() => navigate('/inventario')}>
              <Layers aria-hidden="true" className="h-3.5 w-3.5" />
              Ver inventario
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => navigate('/compras/solicitudes')}>
              <ShoppingCart aria-hidden="true" className="h-3.5 w-3.5" />
              Ir a solicitudes de compra
            </Button>
            {canRequest && selected.size > 0 && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setRequestItems([...selected.values()].map(toRequestItem))}
              >
                <ShoppingCart aria-hidden="true" className="h-3.5 w-3.5" />
                Crear solicitud de compra ({selected.size})
              </Button>
            )}
          </>
        }
      />

      <CellGrid columns={4} aria-label="Resumen de alertas">
        <Cell>
          <Metric label="Alertas activas" value={totalActive} />
        </Cell>
        <Cell>
          <Metric label="Nivel crítico (≤ mín)" value={criticalCount} tone={criticalCount > 0 ? 'danger' : 'neutral'} />
        </Cell>
        <Cell>
          <Metric label="Advertencia (≤ mín + 5)" value={warningCount} tone={warningCount > 0 ? 'warning' : 'neutral'} />
        </Cell>
        <Cell>
          <Metric label="Atendidas / resueltas" value={totalResolved} />
        </Cell>
      </CellGrid>

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
            navigate(`/compras/solicitudes/${r.id}`);
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
