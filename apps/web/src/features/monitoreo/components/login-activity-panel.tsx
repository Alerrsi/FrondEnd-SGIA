import { useState } from 'react';
import { useLoginActivity } from '@sgia/api-client';
import { KeyRound } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SectionTitle } from '@/components/ui/section-title';
import { Skeleton } from '@/components/ui/skeleton';
import { STATE_TEXT_CLASS, TABLE_HEAD_CLASS } from '@/components/ui/typography';
import { apiErrorToMessage } from '@/lib/api-error';
import { timeAgo } from '../lib/monitoring-format';
import { LoginActivityChart } from './login-activity-chart';

const WINDOWS = [
  { hours: 24, label: '24 horas' },
  { hours: 168, label: '7 días' },
] as const;

/** Intentos de conexión: correctos y rechazados por hora, cuentas atacadas e IP con más fallos. */
export function LoginActivityPanel() {
  const [hours, setHours] = useState<number>(24);
  const { data, isLoading, isError, error } = useLoginActivity(hours);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
        <SectionTitle icon={KeyRound}>Intentos de conexión</SectionTitle>
        <div role="group" aria-label="Periodo" className="flex gap-1">
          {WINDOWS.map((w) => (
            <Button
              key={w.hours}
              size="sm"
              variant={hours === w.hours ? 'outline' : 'ghost'}
              aria-pressed={hours === w.hours}
              onClick={() => setHours(w.hours)}
            >
              {w.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3 p-4">
          <Skeleton label="Cargando intentos de conexión…" className="h-5 w-80 max-w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : isError || !data ? (
        <p role="alert" className="p-4 text-xs text-danger">
          No se pudo cargar la actividad: {apiErrorToMessage(error)}
        </p>
      ) : (
        <div className="flex flex-col gap-4 p-4">
          <p className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-zinc-600 dark:text-zinc-300">
            <span>
              <strong className="text-zinc-900 dark:text-zinc-100">{data.totals.successful}</strong> correctos
            </span>
            <span>
              <strong className="text-zinc-900 dark:text-zinc-100">{data.totals.failed}</strong> rechazados
            </span>
            <span>
              <strong className="text-zinc-900 dark:text-zinc-100">{data.totals.throttled}</strong> bloqueados por exceso de intentos
            </span>
          </p>

          <LoginActivityChart hours={data.by_hour} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="relative overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
              <table className="w-full border-collapse text-xs">
                <caption className="px-3 py-2 text-left text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Cuentas con 5 o más fallos
                </caption>
                <thead className={TABLE_HEAD_CLASS}>
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Correo</th>
                    <th className="px-3 py-2 text-right font-medium">Fallos</th>
                    <th className="px-3 py-2 text-right font-medium">Último</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {data.flagged_accounts.length === 0 ? (
                    <tr>
                      <td colSpan={3} className={`px-3 py-4 ${STATE_TEXT_CLASS}`}>
                        Ninguna cuenta bajo ataque en este periodo.
                      </td>
                    </tr>
                  ) : (
                    data.flagged_accounts.map((a) => (
                      <tr key={a.email}>
                        <td className="px-3 py-2 font-mono">{a.email}</td>
                        <td className="px-3 py-2 text-right">
                          <Badge tone="critical">{a.failed}</Badge>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-zinc-500">{timeAgo(a.last_attempt_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="relative overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
              <table className="w-full border-collapse text-xs">
                <caption className="px-3 py-2 text-left text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  IP con más intentos rechazados
                </caption>
                <thead className={TABLE_HEAD_CLASS}>
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">IP</th>
                    <th className="px-3 py-2 text-right font-medium">Fallos</th>
                    <th className="px-3 py-2 text-right font-medium">Último</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {data.top_ips.length === 0 ? (
                    <tr>
                      <td colSpan={3} className={`px-3 py-4 ${STATE_TEXT_CLASS}`}>
                        Sin intentos rechazados en este periodo.
                      </td>
                    </tr>
                  ) : (
                    data.top_ips.map((ip) => (
                      <tr key={ip.ip_address ?? 'sin-ip'}>
                        <td className="px-3 py-2 font-mono">{ip.ip_address ?? 'Desconocida'}</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">{ip.failed}</td>
                        <td className="px-3 py-2 text-right font-mono text-zinc-500">{timeAgo(ip.last_attempt_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
