import { useAuditLogs } from '@sgia/api-client';
import { ArrowRight, UserCog } from 'lucide-react';
import { Link } from 'react-router-dom';

import { SectionTitle } from '@/components/ui/section-title';
import { SkeletonList } from '@/components/ui/skeleton-list';
import { STATE_TEXT_CLASS } from '@/components/ui/typography';
import { auditActionLabel } from '@/features/administracion/lib/audit-labels';
import { timeAgo } from '../lib/monitoring-format';

/** Cambios sensibles sobre cuentas (roles, activaciones, contraseñas, sesiones cerradas), desde la auditoría. */
export function SensitiveChangesPanel() {
  const { data, isLoading, isError } = useAuditLogs({ action: 'user.', per_page: 10 });
  const logs = data?.data ?? [];

  return (
    <section className="flex flex-col rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
        <SectionTitle icon={UserCog}>Cambios sensibles en cuentas</SectionTitle>
      </div>
      {isLoading ? (
        <SkeletonList label="Cargando cambios…" rows={5} columns={3} />
      ) : isError ? (
        <p role="alert" className="p-4 text-xs text-rose-600 dark:text-rose-400">
          No se pudieron cargar los cambios.
        </p>
      ) : logs.length === 0 ? (
        <p className={`py-6 ${STATE_TEXT_CLASS}`}>Sin cambios registrados.</p>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {logs.map((log) => (
            <li key={log.id} className="flex items-center justify-between gap-3 px-4 py-2 text-xs">
              <span className="min-w-0 truncate">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{auditActionLabel(log.action)}</span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {' · por '}
                  {log.user?.nombre ?? log.user?.name ?? 'Sistema'}
                </span>
              </span>
              <span className="shrink-0 font-mono text-[11px] text-zinc-400">{timeAgo(log.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
      <Link
        to="/auditoria"
        className="group mt-auto flex items-center justify-end gap-1 border-t border-zinc-100 px-4 py-2 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        Ver la auditoría completa
        <ArrowRight aria-hidden="true" className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </section>
  );
}
