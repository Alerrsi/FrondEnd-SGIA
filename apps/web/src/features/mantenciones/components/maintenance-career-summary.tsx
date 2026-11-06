import { useMaintenanceSummary } from '@sgia/api-client';
import type { MaintenanceStatus } from '@sgia/types';
import { AlertCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { MAINTENANCE_STATUS_META } from '@/features/mantenciones/lib/maintenance-labels';

const nf = new Intl.NumberFormat('es-CL');
const STATUSES = Object.keys(MAINTENANCE_STATUS_META) as MaintenanceStatus[];

/** Total de mantenciones por carrera (ISD, II, IC, AP, Sin carrera) con desglose por estado. */
export function MaintenanceCareerSummary() {
  const { data, isLoading, isError } = useMaintenanceSummary();
  const rows = data
    ? [...data.careers, { career_id: -1, name: 'Total', code: null, ...data.total }]
    : [];

  return (
    <section
      aria-label="Mantenciones por carrera"
      className="rounded-md border border-border bg-surface shadow-xs"
    >
      <h2 className="border-b border-border px-4 py-2.5 text-sm font-semibold text-text">
        Mantenciones por carrera
      </h2>
      {isLoading ? (
        <p className="py-6 text-center font-mono text-xs text-text-muted">Cargando resumen…</p>
      ) : isError ? (
        <p className="m-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          No se pudo cargar el resumen por carrera.
        </p>
      ) : !data || data.total.total === 0 ? (
        <p className="py-6 text-center text-xs text-text-muted">
          Aún no hay mantenciones registradas.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border font-mono text-xs uppercase tracking-wider text-text-muted">
                <th className="px-4 py-2 font-medium">Carrera</th>
                <th className="px-4 py-2 text-right font-medium">Total</th>
                {STATUSES.map((s) => (
                  <th key={s} className="px-4 py-2 font-medium">
                    {MAINTENANCE_STATUS_META[s].label}
                  </th>
                ))}
                <th className="px-4 py-2 text-right font-medium">Unidades</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((r) => (
                <tr
                  key={r.career_id ?? 'none'}
                  className={r.name === 'Total' ? 'font-semibold' : undefined}
                >
                  <td className="px-4 py-2">
                    {r.code && <span className="mr-1.5 font-mono text-text-muted">{r.code}</span>}
                    {r.name}
                  </td>
                  <td className="px-4 py-2 text-right font-mono">{nf.format(r.total)}</td>
                  {STATUSES.map((s) => (
                    <td key={s} className="px-4 py-2">
                      <Badge tone={MAINTENANCE_STATUS_META[s].tone} mono>
                        {nf.format(r.by_status[s])}
                      </Badge>
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right font-mono">{nf.format(r.units)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
