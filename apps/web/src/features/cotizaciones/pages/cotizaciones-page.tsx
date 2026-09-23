import { useCotizaciones } from '@sgia/api-client';

import { QuotationStatusBadge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function CotizacionesPage() {
  const { data } = useCotizaciones({ page: 1, perPage: 20 });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-mono-tabular text-xl text-text">Cotizaciones</h1>
      <div className="flex flex-col gap-2">
        {data?.data.length === 0 && (
          <p className="text-sm text-text-muted">No hay cotizaciones registradas.</p>
        )}
        {data?.data.map((cotizacion) => (
          <Card key={cotizacion.id} className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="font-mono-tabular text-sm text-text">#{cotizacion.id}</span>
              <span className="text-sm text-text-muted">
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