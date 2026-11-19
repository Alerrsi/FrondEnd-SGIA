import { useAuditLogs } from '@sgia/api-client';
import { ArrowRight, ScrollText } from 'lucide-react';
import { Link } from 'react-router-dom';

import { SectionTitle } from '@/components/ui/section-title';
import { STATE_TEXT_CLASS } from '@/components/ui/typography';
import { auditActionLabel } from '@/features/administracion/lib/audit-labels';
import { SkeletonList } from '@/components/ui/skeleton-list';

const timeFormat = new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' });

/** Últimos eventos de la auditoría, con enlace al registro completo. */
export function RecentActivity() {
  const { data, isLoading, isError } = useAuditLogs({ per_page: 8 });
  const logs = data?.data ?? [];

  return (
    <section aria-label="Actividad reciente" className="flex h-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <SectionTitle icon={ScrollText}>Actividad reciente</SectionTitle>
      </div>
      {isLoading ? (
        <SkeletonList label="Cargando actividad…" rows={6} columns={2} />
      ) : isError || logs.length === 0 ? (
        <p className={`${STATE_TEXT_CLASS} py-4`}>
          {isError ? 'No se pudo cargar la actividad.' : 'Sin actividad registrada.'}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {logs.map((log) => (
            <li key={log.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
              <span className="min-w-0 truncate">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{auditActionLabel(log.action)}</span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {' · '}
                  {log.user?.nombre ?? log.user?.name ?? 'Sistema'}
                </span>
              </span>
              <span className="shrink-0 font-mono text-xs text-zinc-500 dark:text-zinc-400">{timeFormat.format(new Date(log.created_at))}</span>
            </li>
          ))}
        </ul>
      )}
      <Link
        to="/auditoria"
        className="group mt-auto flex items-center justify-end gap-1 border-t border-zinc-200 px-4 py-2.5 text-[13px] font-medium text-zinc-500 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 pointer-coarse:py-3.5"
      >
        Ver la auditoría
        <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-[3px]" />
      </Link>
    </section>
  );
}
