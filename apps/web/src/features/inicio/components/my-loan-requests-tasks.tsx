import { useMyLoanRequests } from '@sgia/api-client';
import { summarizeTeacherLoans } from '@sgia/api-client/loan-state';
import { CalendarX, Clock, PackageCheck } from 'lucide-react';

import { TodayTask } from './today-task';

/**
 * Estado de las solicitudes del docente: en revisión (`pendiente`), listas para retirar (`en_proceso`)
 * y atrasadas (entregadas, sin `returned_at` y con `diasAtraso`). Misma regla que la app móvil.
 */
export function MyLoanRequestsTasks() {
  // shortcut: cuenta sobre las 100 más recientes; pedir totales por estado a la API si un docente supera eso.
  const { data, isLoading } = useMyLoanRequests({ per_page: 100 });
  const summary = data ? summarizeTeacherLoans(data) : undefined;
  const common = { to: '/profesor/solicitudes', isLoading };

  return (
    <>
      <TodayTask
        {...common}
        icon={Clock}
        title="En revisión"
        description="Solicitudes que el pañol aún no aprueba."
        count={summary?.inReview}
        pendingLabel="esperando al pañol"
      />
      <TodayTask
        {...common}
        icon={PackageCheck}
        title="Listas para retirar"
        description="El pañol ya las preparó."
        count={summary?.readyToPickUp}
        pendingLabel="por retirar"
      />
      <TodayTask
        {...common}
        icon={CalendarX}
        title="Atrasadas"
        description="Equipos que debiste devolver."
        count={summary?.overdue}
        pendingLabel="por devolver"
      />
    </>
  );
}
