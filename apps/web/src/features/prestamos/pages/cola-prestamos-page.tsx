import { useLoans } from '@sgia/api-client';
import { LoanStatus } from '@sgia/types';

import { LoanStatusBadge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function ColaPrestamosPage() {
  const { data } = useLoans({ estado: LoanStatus.EN_PROCESO, origen: 'remoto' });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-mono-tabular text-xl text-text">Cola de préstamos</h1>
      <div className="flex flex-col gap-2">
        {data?.data.length === 0 && (
          <p className="text-sm text-text-muted">No hay solicitudes pendientes.</p>
        )}
        {data?.data.map((prestamo) => (
          <Card key={prestamo.id} className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="font-mono-tabular text-sm text-text">#{prestamo.id}</span>
              <span className="text-sm text-text-muted">
                {prestamo.solicitanteNombre ?? `Usuario #${prestamo.solicitanteId}`}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-text-muted">
                {prestamo.items.reduce((acc, item) => acc + item.cantidad, 0)} ítems
              </span>
              <LoanStatusBadge estado={prestamo.estado} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}