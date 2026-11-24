import { useMemo } from 'react';
import { Bell, AlertTriangle, AlertCircle, CheckCircle, ArrowRight, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCriticalStockAlerts, useDismissStockAlert } from '@sgia/api-client';
import type { CriticalStockAlert } from '@sgia/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { STATE_TEXT_CLASS } from '@/components/ui/typography';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import { useNewAlertSound } from '../hooks/use-new-alert-sound';

/** La campana se actualiza sola cada minuto para avisar (con sonido) de alertas nuevas. */
const BELL_REFETCH_MS = 60_000;

/**
 * Hover y foco: el ítem pasa a rojo de forma gradual (300 ms) y aparece el basurero; clic o Enter lo quita de la
 * campana (docs/exportaciones-y-campana.md). Con movimiento reducido el cambio es inmediato. El `!` gana al
 * `hover:bg-zinc-100` de `DropdownMenuItem` (`cn` no fusiona clases).
 */
const DISMISS_ITEM_CLASS =
  'group relative flex flex-col items-start gap-1 p-3 pr-10 cursor-pointer transition-colors duration-300 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none hover:bg-danger-bg! focus:bg-danger-bg! dark:hover:bg-danger-bg! dark:focus:bg-danger-bg!';

export function NotificationBell() {
  const navigate = useNavigate();
  const { data, isLoading } = useCriticalStockAlerts(
    { is_resolved: false, per_page: 5, exclude_dismissed: true },
    { refetchInterval: BELL_REFETCH_MS },
  );
  const dismiss = useDismissStockAlert();

  const alerts = useMemo(() => data?.data ?? [], [data]);
  const alertIds = useMemo(() => (data ? alerts.map((a) => a.id) : undefined), [data, alerts]);
  useNewAlertSound(alertIds);

  const handleDismiss = (alert: CriticalStockAlert) => {
    dismiss.mutate(alert, { onError: (error) => toast.error(apiErrorToMessage(error)) });
  };
  // Totales del servidor (stock real del inventario); la lista solo trae las 5 más recientes.
  const totalUnresolved = data?.counts?.active ?? data?.meta?.total ?? alerts.length;
  const criticalCount =
    data?.counts?.critical ?? alerts.filter((a) => a.alert_type === 'critical').length;
  const warningCount = data?.counts?.warning ?? Math.max(totalUnresolved - criticalCount, 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Centro de notificaciones: ${totalUnresolved} alertas no resueltas`}
          title={
            totalUnresolved > 0
              ? `${totalUnresolved} alertas de stock activas`
              : 'Sin alertas pendientes'
          }
          className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition-colors duration-150 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 pointer-coarse:h-11 pointer-coarse:w-11"
        >
          <Bell aria-hidden="true" className="h-4 w-4" />
          {totalUnresolved > 0 && (
            <span
              data-testid="notification-badge"
              className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 font-mono text-xs font-medium text-white dark:text-zinc-900"
            >
              {totalUnresolved > 9 ? '9+' : totalUnresolved}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)] p-0">
        {/* Header del Centro de Alertas: título y total arriba; desglose por severidad debajo */}
        <div className="flex flex-col gap-2 border-b border-zinc-200 dark:border-zinc-800 px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950/40">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
              Alertas de stock
            </span>
            <span className="shrink-0 whitespace-nowrap text-xs text-zinc-500 dark:text-zinc-400">
              {totalUnresolved > 0 ? `${totalUnresolved} activas` : 'Sin alertas'}
            </span>
          </div>
          {totalUnresolved > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="critical" dot className="whitespace-nowrap">
                {`${criticalCount} ${criticalCount === 1 ? 'crítica' : 'críticas'}`}
              </Badge>
              <Badge tone="warning" dot className="whitespace-nowrap">
                {`${warningCount} ${warningCount === 1 ? 'advertencia' : 'advertencias'}`}
              </Badge>
            </div>
          )}
        </div>

        {/* Lista de Alertas Recientes */}
        <div className="max-h-72 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800">
          {isLoading ? (
            <div className={`p-4 ${STATE_TEXT_CLASS}`}>
              Cargando alertas…
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
              <CheckCircle aria-hidden="true" className="mb-1.5 h-6 w-6 text-ok" />
              <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
                Niveles de stock óptimos
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                No hay quiebres ni advertencias de stock activas.
              </p>
            </div>
          ) : (
            alerts.map((alert) => {
              const isCritical = alert.alert_type === 'critical';
              const productName =
                alert.product?.nombre ||
                alert.producto?.nombre ||
                alert.product_name ||
                `Producto #${alert.product_id}`;
              const currentStock = alert.current_stock ?? alert.product?.stock ?? alert.stock ?? 0;
              const minStock =
                alert.product?.stockCritico ??
                alert.product?.stock_minimo ??
                alert.stock_minimo ??
                0;

              return (
                <DropdownMenuItem
                  key={alert.id}
                  // El menú queda abierto para quitar varias seguidas.
                  onSelect={(event) => {
                    event.preventDefault();
                    handleDismiss(alert);
                  }}
                  aria-label={`Quitar notificación: ${productName}, stock ${currentStock} (mínimo ${minStock})`}
                  title="Quitar de mis notificaciones"
                  data-alert-id={alert.id}
                  className={DISMISS_ITEM_CLASS}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-[13px] font-medium text-zinc-900 transition-colors duration-300 motion-reduce:transition-none group-hover:text-danger group-focus:text-danger dark:text-zinc-100">
                      {productName}
                    </span>
                    <Badge tone={isCritical ? 'critical' : 'warning'}>
                      {isCritical ? 'Crítico' : 'Bajo'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 transition-colors duration-300 motion-reduce:transition-none group-hover:text-danger group-focus:text-danger dark:text-zinc-400">
                    {isCritical ? (
                      <AlertTriangle aria-hidden="true" className="h-3 w-3 shrink-0 text-danger" />
                    ) : (
                      <AlertCircle aria-hidden="true" className="h-3 w-3 shrink-0 text-warn" />
                    )}
                    <span>
                      Stock: <span className="font-mono font-medium">{currentStock}</span> (mín <span className="font-mono">{minStock}</span>)
                    </span>
                  </div>
                  <Trash2
                    aria-hidden="true"
                    data-testid="notification-trash"
                    className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-danger opacity-0 transition-opacity duration-300 motion-reduce:transition-none group-hover:opacity-100 group-focus:opacity-100"
                  />
                </DropdownMenuItem>
              );
            })
          )}
        </div>

        {/* Footer con Enlace a Vista Completa */}
        <DropdownMenuSeparator className="m-0" />
        <div className="bg-zinc-50 p-2 dark:bg-zinc-950/40">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate('/alertas')}
            className="w-full"
          >
            <span>Ver bandeja completa de alertas</span>
            <ArrowRight aria-hidden="true" className="h-3 w-3" />
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
