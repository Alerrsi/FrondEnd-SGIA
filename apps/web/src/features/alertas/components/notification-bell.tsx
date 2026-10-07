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

export function NotificationBell() {
  const navigate = useNavigate();
  const { data, isLoading } = useCriticalStockAlerts({
    is_resolved: false,
    per_page: 5,
  });

  const alerts = data?.data ?? [];
  const totalUnresolved = data?.meta?.total ?? alerts.length;
  const criticalCount = alerts.filter((a) => a.alert_type === 'critical').length;

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
              className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 font-mono text-[9px] font-bold text-white shadow-xs animate-pulse"
            >
              {totalUnresolved > 9 ? '9+' : totalUnresolved}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0 shadow-lg">
        {/* Header del Centro de Alertas */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50/70 dark:bg-zinc-900/70">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Alertas de Stock
            </span>
            {totalUnresolved > 0 && (
              <span className="rounded bg-red-500/10 border border-red-500/20 px-1.5 py-0.2 font-mono text-[10px] font-bold text-red-600 dark:text-red-400">
                {totalUnresolved} activas
              </span>
            )}
          </div>
          {criticalCount > 0 && (
            <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400 font-medium">
              {criticalCount} crítica(s)
            </span>
          )}
        </div>

        {/* Lista de Alertas Recientes */}
        <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {isLoading ? (
            <div className="p-4 text-center text-xs font-mono text-zinc-400">
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
              const currentStock = alert.product?.stock ?? alert.stock ?? 0;
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
