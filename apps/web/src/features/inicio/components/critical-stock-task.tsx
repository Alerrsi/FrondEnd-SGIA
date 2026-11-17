import { useCriticalStockAlerts } from '@sgia/api-client';
import { PackageX } from 'lucide-react';

import { TodayTask } from './today-task';

/** Productos con alerta crítica de stock sin resolver. */
export function CriticalStockTask({ description }: { description: string }) {
  const { data, isLoading } = useCriticalStockAlerts({ alert_type: 'critical', is_resolved: false, per_page: 1 });
  return (
    <TodayTask
      to="/alertas"
      icon={PackageX}
      title="Stock crítico"
      description={description}
      count={data?.meta.total}
      isLoading={isLoading}
      pendingLabel="productos bajo el mínimo"
    />
  );
}
