import { useState, useMemo } from 'react';
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
import { ProductoDetailDialog } from '@/features/inventario/components/producto-detail-dialog';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import {
  AlertasTable,
  type AlertStatusFilter,
  type AlertTypeFilter,
} from '../components/alertas-table';

export default function AlertasStockPage() {
  const navigate = useNavigate();

  // Estados de paginación y filtros
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<AlertTypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<AlertStatusFilter>('active');

  // Modal / Diálogos
  const [resolvingAlert, setResolvingAlert] = useState<CriticalStockAlert | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);

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

  // Query global de conteo para cinta métrica
  const { data: globalActiveData } = useCriticalStockAlerts({ is_resolved: false, per_page: 100 });
  const { data: globalResolvedData } = useCriticalStockAlerts({ is_resolved: true, per_page: 100 });

  const activeAlerts = globalActiveData?.data ?? [];
  const totalActive = globalActiveData?.meta?.total ?? activeAlerts.length;
  const criticalCount = activeAlerts.filter((a) => a.alert_type === 'critical').length;
  const warningCount = activeAlerts.filter((a) => a.alert_type === 'warning').length;
  const totalResolved = globalResolvedData?.meta?.total ?? (globalResolvedData?.data ?? []).length;

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

  const handleRequestQuote = (alert: CriticalStockAlert) => {
    toast.info(`Iniciando solicitud de reposición para alerta #${alert.id}`);
    navigate('/cotizaciones');
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Encabezado y Miga Técnica */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span data-sede-badge="true" className="sede-badge inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs font-mono font-medium text-danger">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
            SEDE TEMUCO · PAÑOL TI
          </span>
          <span className="text-text-muted text-xs font-mono">/</span>
          <span className="font-mono text-xs text-text-muted uppercase tracking-wider">
            Gestión de Existencias
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
              <Bell aria-hidden="true" className="h-5 w-5 text-text" />
              Alertas de Stock Crítico y Preventivo
            </h1>
            <p className="text-xs text-text-muted">
              Monitoreo en tiempo real de quiebres y umbrales mínimos de hardware según especificación REQ-06.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/inventario')}
              className="text-xs gap-1.5"
            >
              <Layers aria-hidden="true" className="h-3.5 w-3.5" />
              <span>Ver Inventario</span>
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => navigate('/cotizaciones')}
              className="text-xs gap-1.5"
            >
              <ShoppingCart aria-hidden="true" className="h-3.5 w-3.5" />
              <span>Ir a Cotizaciones</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Cinta Métrica Compacta (Metric Strip 36-40px) */}
      <div className="flex flex-wrap items-center divide-x divide-border rounded-md border border-border bg-surface px-4 py-2 text-xs font-mono shadow-xs">
        <div className="flex items-center gap-2 pr-4">
          <span className="text-text-muted">Alertas Activas:</span>
          <strong className="text-text tabular-nums font-semibold">
            {totalActive}
          </strong>
        </div>

        <div className="flex items-center gap-2 px-4">
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-text-muted">Nivel Crítico (≤ mín):</span>
          <strong className="text-danger tabular-nums font-semibold">
            {criticalCount}
          </strong>
        </div>

        <div className="flex items-center gap-2 px-4">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span className="text-text-muted">Advertencia (≤ mín + 5):</span>
          <strong className="text-warn tabular-nums font-semibold">
            {warningCount}
          </strong>
        </div>

        <div className="flex items-center gap-2 pl-4">
          <CheckCircle aria-hidden="true" className="h-3 w-3 text-emerald-500" />
          <span className="text-text-muted">Atendidas / Resueltas:</span>
          <strong className="text-text tabular-nums font-semibold">
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
        onRequestQuote={handleRequestQuote}
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
        title="Resolver Alerta de Existencias"
        description={
          resolvingAlert
            ? `¿Deseas marcar como resuelta la alerta para "${resolvingAlert.product_name ?? 'este producto'}"? Esto indicará que la situación de inventario fue atendida o regularizada.`
            : ''
        }
        confirmLabel="Marcar como Resuelta"
        variant="primary"
        loading={resolveMutation.isPending}
        onConfirm={handleConfirmResolve}
        onCancel={() => setResolvingAlert(null)}
      />

      {/* Ficha Técnica de Producto Afectado */}
      <ProductoDetailDialog
        open={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        producto={selectedProduct}
      />
    </div>
  );
}
