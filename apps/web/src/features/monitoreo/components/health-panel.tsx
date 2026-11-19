import { useSystemHealth } from '@sgia/api-client';
import { Activity, Database, HardDrive, ListChecks } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { SectionTitle } from '@/components/ui/section-title';
import { Skeleton } from '@/components/ui/skeleton';
import { apiErrorToMessage } from '@/lib/api-error';
import { timeAgo } from '../lib/monitoring-format';

interface ServiceProps {
  icon: LucideIcon;
  name: string;
  ok: boolean;
  detail: string;
}

function Service({ icon: Icon, name, ok, detail }: ServiceProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-zinc-400" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{name}</p>
        <p className="truncate font-mono text-[11px] text-zinc-500 dark:text-zinc-400">{detail}</p>
      </div>
      <Badge tone={ok ? 'success' : 'critical'} dot>
        {ok ? 'Operativo' : 'Con fallas'}
      </Badge>
    </div>
  );
}

/** Semáforo de base de datos, almacenamiento de archivos y cola de trabajos (se refresca cada 30 s). */
export function HealthPanel() {
  const { data, isLoading, isError, error } = useSystemHealth();

  return (
    <section className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
        <SectionTitle icon={Activity}>Estado del sistema</SectionTitle>
        {data && (
          <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
            Revisado {timeAgo(data.checked_at).toLowerCase()}
          </span>
        )}
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
          <Skeleton label="Revisando servicios…" className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      ) : isError || !data ? (
        <p role="alert" className="p-4 text-xs text-rose-600 dark:text-rose-400">
          No se pudo consultar el estado: {apiErrorToMessage(error)}
        </p>
      ) : (
        <div className="grid grid-cols-1 divide-y divide-zinc-100 md:grid-cols-3 md:divide-x md:divide-y-0 dark:divide-zinc-800">
          <Service
            icon={Database}
            name="Base de datos"
            ok={data.checks.database.ok}
            detail={data.checks.database.ok ? `Responde en ${data.checks.database.latency_ms ?? '—'} ms` : 'No responde'}
          />
          <Service
            icon={HardDrive}
            name="Almacenamiento de archivos"
            ok={data.checks.storage.ok}
            detail={data.checks.storage.ok ? 'Lectura y escritura correctas' : 'No se puede escribir'}
          />
          <Service
            icon={ListChecks}
            name="Cola de trabajos"
            ok={data.checks.queue.ok}
            detail={
              data.checks.queue.error
                ? 'No responde'
                : `${data.checks.queue.pending ?? 0} pendientes · ${data.checks.queue.failed ?? 0} fallidos`
            }
          />
        </div>
      )}
    </section>
  );
}
