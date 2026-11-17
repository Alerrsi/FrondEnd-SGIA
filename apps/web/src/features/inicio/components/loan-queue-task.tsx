import { usePendingLoans } from '@sgia/api-client';
import { Inbox } from 'lucide-react';

import { TodayTask } from './today-task';

/** Solicitudes remotas que esperan despacho en la cola del pañol. */
export function LoanQueueTask() {
  const { data, isLoading } = usePendingLoans({ per_page: 1 });
  return (
    <TodayTask
      to="/prestamos/cola"
      icon={Inbox}
      title="Cola de solicitudes"
      description="Préstamos pedidos por docentes que esperan despacho."
      count={data?.meta.total}
      isLoading={isLoading}
      pendingLabel="por despachar"
    />
  );
}
