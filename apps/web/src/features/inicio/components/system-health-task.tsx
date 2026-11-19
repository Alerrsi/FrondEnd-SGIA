import { useSystemHealth } from '@sgia/api-client';
import { Activity } from 'lucide-react';

import { TodayTask } from './today-task';

/** Servicios con fallas: base de datos, almacenamiento o cola de trabajos. */
export function SystemHealthTask() {
  const { data, isLoading } = useSystemHealth();
  return (
    <TodayTask
      to="/monitoreo"
      icon={Activity}
      title="Estado del sistema"
      description="Base de datos, archivos y cola de trabajos."
      count={data ? Object.values(data.checks).filter((check) => !check.ok).length : undefined}
      isLoading={isLoading}
      pendingLabel="con fallas"
    />
  );
}
