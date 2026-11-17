import { useMyLoanRequests } from '@sgia/api-client';
import { LoanStatus } from '@sgia/types';
import { CalendarX, Clock, PackageCheck } from 'lucide-react';

import { TodayTask } from './today-task';

/** Estado de las solicitudes del docente: en revisión, listas para retirar y atrasadas. */
export function MyLoanRequestsTasks() {
  // shortcut: cuenta sobre las 100 más recientes; pedir totales por estado a la API si un docente supera eso.
  const { data, isLoading } = useMyLoanRequests({ per_page: 100 });
  const count = (estado: string) => data?.filter((loan) => (loan.status ?? loan.estado) === estado).length;
  const common = { to: '/profesor/solicitudes', isLoading };

  return (
    <>
      <TodayTask
        {...common}
        icon={Clock}
        title="En revisión"
        description="Solicitudes que el pañol aún no prepara."
        count={count(LoanStatus.PENDIENTE)}
        pendingLabel="esperando al pañol"
      />
      <TodayTask
        {...common}
        icon={PackageCheck}
        title="Listas para retirar"
        description="El pañol ya las preparó."
        count={count(LoanStatus.PREPARADO)}
        pendingLabel="por retirar"
      />
      <TodayTask
        {...common}
        icon={CalendarX}
        title="Atrasadas"
        description="Equipos que debiste devolver."
        count={count(LoanStatus.ATRASADO)}
        pendingLabel="por devolver"
      />
    </>
  );
}
