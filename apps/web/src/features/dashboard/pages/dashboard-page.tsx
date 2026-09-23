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
    <div className="flex flex-col gap-4">
      <h1 className="font-mono-tabular text-xl text-text">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-text-muted">Productos activos</p>
          <p className="font-mono-tabular text-3xl text-text">
            {cargandoProductos ? '—' : (productos?.meta.total ?? 0)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-text-muted">Préstamos en proceso</p>
          <p className="font-mono-tabular text-3xl text-text">{prestamos?.meta.total ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-muted">Cotizaciones</p>
          <p className="font-mono-tabular text-3xl text-text">{cotizaciones?.meta.total ?? 0}</p>
        </Card>
      </div>
      <div className="flex items-center gap-2">
        <Badge tone="success">Datos demo</Badge>
        <span className="text-sm text-text-muted">
          Los gráficos (productos más solicitados, distribución por carrera) se agregan en REQ-14.
        </span>
      </div>
    </div>
  );
}