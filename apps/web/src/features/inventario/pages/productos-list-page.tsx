import { useProducts } from '@sgia/api-client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function ProductosListPage() {
  const { data, isLoading, isError } = useProducts({ page: 1, perPage: 20 });

  if (isLoading) {
    return <p className="text-sm text-text-muted">Cargando inventario…</p>;
  }

  if (isError || !data) {
    return <p className="text-sm text-danger">No se pudo cargar el inventario.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-mono-tabular text-xl text-text">Inventario</h1>
      <div className="flex flex-col gap-2">
        {data.data.map((producto) => (
          <Card key={producto.id} className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-text">{producto.nombre}</span>
              <span className="font-mono-tabular text-xs text-text-muted">
                {producto.codigoBarras}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono-tabular text-xs text-text-muted">
                {producto.ubicacion.sala} · {producto.ubicacion.cajon}
              </span>
              {producto.stock <= producto.stockCritico ? (
                <Badge tone="danger">{producto.stock} uds</Badge>
              ) : (
                <Badge tone="success">{producto.stock} uds</Badge>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}