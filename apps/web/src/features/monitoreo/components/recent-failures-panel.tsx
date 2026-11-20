import { useFailedLogins } from '@sgia/api-client';
import { ShieldAlert } from 'lucide-react';

import { SectionTitle } from '@/components/ui/section-title';
import { SkeletonRows } from '@/components/ui/skeleton-rows';
import { STATE_TEXT_CLASS, TABLE_HEAD_CLASS } from '@/components/ui/typography';
import { FAILED_REASON_LABELS, timeAgo } from '../lib/monitoring-format';

/** Últimos intentos de inicio de sesión rechazados. */
export function RecentFailuresPanel() {
  const { data, isLoading, isError } = useFailedLogins({ per_page: 10 });
  const rows = data?.data ?? [];

  return (
    <section className="flex flex-col rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
        <SectionTitle icon={ShieldAlert}>Últimos intentos rechazados</SectionTitle>
      </div>
      <div className="relative overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead className={TABLE_HEAD_CLASS}>
            <tr>
              <th className="px-3 py-2 text-left font-medium">Cuándo</th>
              <th className="px-3 py-2 text-left font-medium">Correo</th>
              <th className="px-3 py-2 text-left font-medium">Motivo</th>
              <th className="px-3 py-2 text-left font-medium">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {isLoading ? (
              <SkeletonRows columns={4} rows={5} label="Cargando intentos rechazados…" cellClassName="px-3 py-2" />
            ) : isError ? (
              <tr>
                <td colSpan={4} role="alert" className="px-3 py-4 text-center text-xs text-danger">
                  No se pudieron cargar los intentos.
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className={`px-3 py-4 ${STATE_TEXT_CLASS}`}>
                  Sin intentos rechazados.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-zinc-500">{timeAgo(r.attempted_at)}</td>
                  <td className="max-w-48 truncate px-3 py-2 font-mono">{r.email}</td>
                  <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">{FAILED_REASON_LABELS[r.reason] ?? r.reason}</td>
                  <td className="px-3 py-2 font-mono">{r.ip_address ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
