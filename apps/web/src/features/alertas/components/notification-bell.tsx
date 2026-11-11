import { Bell, AlertTriangle, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCriticalStockAlerts } from '@sgia/api-client';

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

export function NotificationBell() {
  const navigate = useNavigate();
  const { data, isLoading } = useCriticalStockAlerts({
    is_resolved: false,
    per_page: 5,
  });

  const alerts = data?.data ?? [];
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
          className="relative flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
        >
          <Bell className="h-4 w-4" />
          {totalUnresolved > 0 && (
            <span
              data-testid="notification-badge"
              className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 font-mono text-[11px] font-bold text-white shadow-xs animate-pulse"
            >
              {totalUnresolved > 9 ? '9+' : totalUnresolved}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0 shadow-lg">
        {/* Header del Centro de Alertas: título y total arriba; desglose por severidad debajo */}
        <div className="flex flex-col gap-2 border-b border-zinc-200 dark:border-zinc-800 px-3 py-2.5 bg-zinc-50/70 dark:bg-zinc-900/70">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Alertas de stock
            </span>
            <span className="shrink-0 whitespace-nowrap text-[11px] text-zinc-500 dark:text-zinc-400">
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
        <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {isLoading ? (
            <div className={`p-4 ${STATE_TEXT_CLASS}`}>
              Cargando alertas…
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
              <CheckCircle className="h-8 w-8 text-emerald-500 mb-1.5 opacity-80" />
              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                Niveles de stock óptimos
              </p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
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
                  onClick={() => navigate('/alertas')}
                  className="flex flex-col items-start gap-1 p-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[180px]">
                      {productName}
                    </span>
                    <Badge tone={isCritical ? 'critical' : 'warning'}>
                      {isCritical ? 'Crítico' : 'Bajo'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                    {isCritical ? (
                      <AlertTriangle className="h-3 w-3 text-rose-500 shrink-0" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
                    )}
                    <span>
                      Stock: <strong className="text-zinc-800 dark:text-zinc-200">{currentStock}</strong> (mín {minStock})
                    </span>
                  </div>
                </DropdownMenuItem>
              );
            })
          )}
        </div>

        {/* Footer con Enlace a Vista Completa */}
        <DropdownMenuSeparator className="m-0" />
        <div className="p-2 bg-zinc-50/50 dark:bg-zinc-900/50">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate('/alertas')}
            className="w-full justify-center text-xs gap-1.5 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <span>Ver bandeja completa de alertas</span>
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
