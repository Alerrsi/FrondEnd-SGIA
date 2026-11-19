import { useLoginActivity } from '@sgia/api-client';
import { ShieldAlert } from 'lucide-react';

import { TodayTask } from './today-task';

/** Intentos de inicio de sesión rechazados en las últimas 24 horas (incluye bloqueos por exceso). */
export function FailedLoginsTask() {
  const { data, isLoading } = useLoginActivity(24);
  return (
    <TodayTask
      to="/monitoreo"
      icon={ShieldAlert}
      title="Accesos rechazados"
      description={
        data?.flagged_accounts.length
          ? `${data.flagged_accounts.length} cuenta(s) con 5 o más fallos en 24 horas.`
          : 'Intentos fallidos de las últimas 24 horas.'
      }
      count={data ? data.totals.failed + data.totals.throttled : undefined}
      isLoading={isLoading}
      pendingLabel="en 24 h"
    />
  );
}
