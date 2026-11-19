import { useAuditLogs } from '@sgia/api-client';
import { ArrowRight, ScrollText } from 'lucide-react';
import { Link } from 'react-router-dom';

import { STATE_TEXT_CLASS } from '@/components/ui/typography';
import { auditActionLabel } from '@/features/administracion/lib/audit-labels';

const timeFormat = new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' });

/** Últimos eventos de la auditoría, con enlace al registro completo. */
export function RecentActivity() {
  const { data, isLoading, isError } = useAuditLogs({ per_page: 5 });
  const logs = data?.data ?? [];

  return (
    <div className="flex h-full flex-col rounded-md border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <p className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2.5 text-xs font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
        <ScrollText aria-hidden="true" className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
        Actividad reciente
      </p>
      {isLoading || isError || logs.length === 0 ? (
        <p className={`${STATE_TEXT_CLASS} py-4`}>
          {isLoading ? 'Cargando…' : isError ? 'No se pudo cargar la actividad.' : 'Sin actividad registrada.'}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {logs.map((log) => (
            <li key={log.id} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
              <span className="min-w-0 truncate">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{auditActionLabel(log.action)}</span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {' · '}
                  {log.user?.nombre ?? log.user?.name ?? 'Sistema'}
                </span>
              </span>
              <span className="shrink-0 font-mono text-[11px] text-zinc-400">{timeFormat.format(new Date(log.created_at))}</span>
            </li>
          ))}
        </ul>
      )}
      <Link
        to="/auditoria"
        className="group mt-auto flex items-center justify-end gap-1 border-t border-zinc-100 px-3 py-2 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        Ver la auditoría
        <ArrowRight aria-hidden="true" className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
