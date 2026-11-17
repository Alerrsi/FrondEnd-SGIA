import { useLoans } from '@sgia/api-client';
import { CalendarX } from 'lucide-react';

import { TodayTask } from './today-task';

/** Préstamos entregados, sin devolver y vencidos (`GET /loans?atrasado=1`). */
export function OverdueLoansTask({ to }: { to: string }) {
  const { data, isLoading } = useLoans({ atrasado: true, per_page: 1 });
  return (
    <TodayTask
      to={to}
      icon={CalendarX}
      title="Préstamos atrasados"
      description="Entregados que pasaron su fecha de devolución."
      count={data?.meta.total}
      isLoading={isLoading}
      pendingLabel="sin devolver"
    />
  );
}
