import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROLE_LABELS } from '@sgia/types';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../context/auth-context';
import { getRoleDefaultPath } from '../types/roles';

export function ForbiddenPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const roleCode = user?.rol;
  const roleLabel = roleCode ? ROLE_LABELS[roleCode] : 'Desconocido';
  const defaultPath = roleCode ? getRoleDefaultPath(roleCode) : '/login';

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-surface text-danger">
        <ShieldAlert className="h-7 w-7" />
      </div>

      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono-tabular text-sm text-text-muted">HTTP 403</span>
        <Badge tone="danger">Acceso Restringido</Badge>
      </div>

      <h1 className="mb-2 text-xl font-semibold text-text">
        No tienes permisos para ver esta sección
      </h1>

      <p className="mb-6 max-w-md text-sm text-text-muted">
        Tu cuenta está identificada con el rol{' '}
        <span className="font-mono-tabular text-text font-medium">
          {roleCode} ({roleLabel})
        </span>
        , el cual no cuenta con autorización para acceder a esta ruta.
      </p>

      <Button
        variant="ghost"
        onClick={() => navigate(defaultPath, { replace: true })}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a mi módulo principal
      </Button>
    </div>
  );
}
