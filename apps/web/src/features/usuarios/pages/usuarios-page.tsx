import { useUsers } from '@sgia/api-client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function UsuariosPage() {
  const { data } = useUsers();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-mono-tabular text-xl text-text">Usuarios</h1>
      <div className="flex flex-col gap-2">
        {data?.data.map((usuario) => (
          <Card key={usuario.id} className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-text">{usuario.nombre}</span>
              <span className="font-mono-tabular text-xs text-text-muted">
                {usuario.email} · {usuario.run}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone="neutral">{usuario.rol}</Badge>
              {usuario.activo ? <Badge tone="success">activo</Badge> : <Badge tone="danger">inactivo</Badge>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}