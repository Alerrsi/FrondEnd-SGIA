import { useState } from 'react';
import { useActiveSessions, useRevokeSession } from '@sgia/api-client';
import { ROLE_LABELS, type ActiveSession } from '@sgia/types';
import { MonitorSmartphone } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SectionTitle } from '@/components/ui/section-title';
import { SkeletonRows } from '@/components/ui/skeleton-rows';
import { STATE_TEXT_CLASS, TABLE_HEAD_CLASS } from '@/components/ui/typography';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import { DEVICE_LABELS, timeAgo } from '../lib/monitoring-format';

/** Sesiones abiertas de todos los usuarios, con opción de cerrarlas (queda en auditoría). */
export function SessionsPanel() {
  const { data, isLoading, isError } = useActiveSessions({ per_page: 50 });
  const revoke = useRevokeSession();
  const [toRevoke, setToRevoke] = useState<ActiveSession | null>(null);
  const sessions = data?.data ?? [];

  const confirmRevoke = async () => {
    if (!toRevoke) return;
    try {
      await revoke.mutateAsync(toRevoke.id);
      toast.success('Sesión cerrada');
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    } finally {
      setToRevoke(null);
    }
  };

  return (
    <section className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
        <SectionTitle icon={MonitorSmartphone}>Sesiones activas</SectionTitle>
        {data && (
          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{data.meta.total} abiertas</span>
        )}
      </div>
      <div className="relative overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead className={TABLE_HEAD_CLASS}>
            <tr>
              <th className="px-3 py-2 text-left font-medium">Usuario</th>
              <th className="px-3 py-2 text-left font-medium">Rol</th>
              <th className="px-3 py-2 text-left font-medium">Dispositivo</th>
              <th className="px-3 py-2 text-left font-medium">Último uso</th>
              <th className="px-3 py-2 text-left font-medium">Vence</th>
              <th className="px-3 py-2">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {isLoading ? (
              <SkeletonRows columns={6} rows={5} label="Cargando sesiones…" cellClassName="px-3 py-2" />
            ) : isError ? (
              <tr>
                <td colSpan={6} role="alert" className="px-3 py-4 text-center text-xs text-rose-600 dark:text-rose-400">
                  No se pudieron cargar las sesiones.
                </td>
              </tr>
            ) : sessions.length === 0 ? (
              <tr>
                <td colSpan={6} className={`px-3 py-4 ${STATE_TEXT_CLASS}`}>
                  No hay sesiones abiertas.
                </td>
              </tr>
            ) : (
              sessions.map((s) => (
                <tr key={s.id}>
                  <td className="px-3 py-2">
                    <span className="block font-medium text-zinc-900 dark:text-zinc-100">{s.user?.name ?? 'Usuario eliminado'}</span>
                    <span className="block font-mono text-xs text-zinc-500">{s.user?.email}</span>
                  </td>
                  <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">{s.user ? ROLE_LABELS[s.user.role] ?? s.user.role : '—'}</td>
                  <td className="px-3 py-2">{DEVICE_LABELS[s.device_name] ?? s.device_name}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-zinc-500">{timeAgo(s.last_used_at)}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-zinc-500">{s.expires_at ? timeAgo(s.expires_at) : 'Sin vencimiento'}</td>
                  <td className="px-3 py-2 text-right">
                    {s.is_current ? (
                      <Badge tone="neutral">Esta sesión</Badge>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setToRevoke(s)}>
                        Cerrar sesión
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={toRevoke !== null}
        title="Cerrar sesión"
        description={`${toRevoke?.user?.name ?? 'El usuario'} tendrá que volver a iniciar sesión en ${DEVICE_LABELS[toRevoke?.device_name ?? ''] ?? 'ese dispositivo'}. Queda registrado en la auditoría.`}
        confirmLabel="Cerrar sesión"
        variant="danger"
        loading={revoke.isPending}
        onConfirm={confirmRevoke}
        onCancel={() => setToRevoke(null)}
      />
    </section>
  );
}
