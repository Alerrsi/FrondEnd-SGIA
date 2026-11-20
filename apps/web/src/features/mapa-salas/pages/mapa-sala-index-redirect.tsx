import { Link, Navigate } from 'react-router-dom';
import { Map as MapIcon } from 'lucide-react';
import { useLocations } from '@sgia/api-client';

import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/context/auth-context';
import { canAccessRoute } from '@/features/auth/types/roles';
import { apiErrorToMessage } from '@/lib/api-error';
import { readLastSala } from '../hooks/use-last-sala';

/** `/mapa-salas`: abre la última sala vista en este navegador o, si no hay, la primera. */
export default function MapaSalaIndexRedirect() {
  const lastSala = readLastSala();
  const salas = useLocations({ per_page: 100 });
  const { user } = useAuth();

  if (lastSala) return <Navigate to={`/mapa-salas/${lastSala}`} replace />;
  const first = salas.data?.data[0];
  if (first) return <Navigate to={`/mapa-salas/${first.id}`} replace />;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader icon={MapIcon} title="Mapa de salas" description="Distribución de zonas y estantes de cada sala." />
      {salas.isLoading && <Skeleton label="Cargando salas" className="h-40 w-full" />}
      {salas.isError && <ErrorState>{apiErrorToMessage(salas.error)}</ErrorState>}
      {salas.data && (
        <EmptyState
          icon={MapIcon}
          title="Todavía no hay salas"
          description="El mapa se dibuja por sala: primero hay que registrar una."
          action={
            user?.role && canAccessRoute(user.role, '/ubicaciones') ? (
              <Link to="/ubicaciones" className="text-sm font-medium text-accent hover:underline">Ir a Ubicaciones</Link>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
