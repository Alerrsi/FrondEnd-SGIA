import { useCotizaciones, useLoans, useProducts } from '@sgia/api-client';
import { LoanStatus } from '@sgia/types';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function DashboardPage() {
  const { data: productos, isLoading: cargandoProductos } = useProducts({ perPage: 1 });
  const { data: prestamos } = useLoans({
    estado: LoanStatus.EN_PROCESO,
    origen: 'remoto',
  });
  const { data: cotizaciones } = useCotizaciones({ perPage: 1 });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Dashboard
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Métricas de inventario, solicitudes y adquisiciones institucionales.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Productos activos
          </p>
          <p className="font-mono text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1 tabular-nums">
            {cargandoProductos ? '—' : (productos?.meta.total ?? 0)}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Préstamos en proceso
          </p>
          <p className="font-mono text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1 tabular-nums">
            {prestamos?.meta.total ?? 0}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Cotizaciones
          </p>
          <p className="font-mono text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1 tabular-nums">
            {cotizaciones?.meta.total ?? 0}
          </p>
        </Card>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 shadow-xs">
        <Badge tone="available">Datos demo</Badge>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Los gráficos analíticos (productos más solicitados, distribución por carrera) se agregan en REQ-14.
        </span>
      </div>
    </div>
  );
}
