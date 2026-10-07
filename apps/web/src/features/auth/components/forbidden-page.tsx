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
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4 text-zinc-900 dark:text-zinc-100">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 shadow-xs">
        <ShieldAlert className="h-7 w-7" />
      </div>

      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">HTTP 403</span>
        <Badge tone="critical">Acceso Restringido</Badge>
      </div>

      <h1 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        No tienes permisos para ver esta sección
      </h1>

      <p className="mb-6 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
        Tu cuenta está identificada con el rol{' '}
        <span className="font-mono text-zinc-900 dark:text-zinc-200 font-semibold">
          {roleCode} ({roleLabel})
        </span>
        , el cual no cuenta con autorización para acceder a esta ruta.
      </p>

      <Button
        variant="outline"
        onClick={() => navigate(defaultPath, { replace: true })}
        className="flex items-center gap-2 text-xs"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver a mi módulo principal
      </Button>
    </div>
  );
}
