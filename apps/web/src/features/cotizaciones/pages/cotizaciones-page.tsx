import { useCotizaciones } from '@sgia/api-client';

import { QuotationStatusBadge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function CotizacionesPage() {
  const { data } = useCotizaciones({ page: 1, perPage: 20 });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Cotizaciones a Proveedores
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Gestión y seguimiento de cotizaciones y adquisiciones de insumos (REQ-07 / REQ-08).
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {data?.data.length === 0 && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
            No hay cotizaciones registradas actualmente.
          </div>
        )}
        {data?.data.map((cotizacion) => (
          <Card key={cotizacion.id} className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                #{cotizacion.id}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {cotizacion.proveedor ?? 'Sin proveedor'} · {cotizacion.items.length} ítems
              </span>
            </div>
            <QuotationStatusBadge estado={cotizacion.estado} />
          </Card>
        ))}
      </div>
    </div>
  );
}
