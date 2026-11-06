import { Fragment, useState } from 'react';
import { useAuditLogs, useUsers } from '@sgia/api-client';
import { AUDIT_ACTIONS, AUDITABLE_TYPES, type AuditableType } from '@sgia/types';
import { AlertCircle, ChevronLeft, ChevronRight, ScrollText } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AUDITABLE_TYPE_LABELS,
  auditActionLabel,
  auditDetails,
} from '@/features/administracion/lib/audit-labels';

const controlClasses =
  'h-8 rounded-md border border-border bg-background px-2 font-mono text-xs text-text focus:outline-none focus:ring-1 focus:ring-info';

/** Prefijos por entidad (`user.`) además de cada acción exacta. */
const ACTION_GROUPS = Array.from(new Set(AUDIT_ACTIONS.map((a) => a.split('.')[0]!)));

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'America/Santiago',
  }).format(new Date(iso));

export default function AuditoriaPage() {
  const [action, setAction] = useState('');
  const [type, setType] = useState<AuditableType | ''>('');
  const [userId, setUserId] = useState<number | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);

  const { data: users } = useUsers({ per_page: 100 });
  const { data, isLoading, isError } = useAuditLogs({
    action: action || undefined,
    auditable_type: type || undefined,
    user_id: userId === '' ? undefined : userId,
    from: from || undefined,
    to: to || undefined,
    page,
    per_page: 20,
  });
  const meta = data?.meta;
  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
          <ScrollText aria-hidden="true" className="h-5 w-5 text-text" />
          Auditoría
        </h1>
        <p className="text-xs text-text-muted">
          Registro de eventos críticos del sistema (solo lectura, REQ-NF-01). Horas en America/Santiago.
        </p>
      </div>

      <div className="rounded-md border border-border bg-surface overflow-hidden shadow-xs">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-2.5">
          <select aria-label="Filtrar por acción" value={action} onChange={(e) => reset(setAction)(e.target.value)} className={controlClasses}>
            <option value="">Todas las acciones</option>
            {ACTION_GROUPS.map((g) => (
              <optgroup key={g} label={AUDITABLE_TYPE_LABELS[g] ?? g}>
                <option value={`${g}.`}>Todas de {AUDITABLE_TYPE_LABELS[g] ?? g}</option>
                {AUDIT_ACTIONS.filter((a) => a.startsWith(`${g}.`)).map((a) => (
                  <option key={a} value={a}>
                    {auditActionLabel(a)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <select aria-label="Filtrar por tipo" value={type} onChange={(e) => reset(setType)(e.target.value as AuditableType | '')} className={controlClasses}>
            <option value="">Todos los tipos</option>
            {AUDITABLE_TYPES.map((t) => (
              <option key={t} value={t}>
                {AUDITABLE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar por autor"
            value={userId}
            onChange={(e) => reset(setUserId)(e.target.value ? Number(e.target.value) : '')}
            className={controlClasses}
          >
            <option value="">Todos los autores</option>
            {(users?.data ?? []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
          <input type="date" aria-label="Desde" value={from} onChange={(e) => reset(setFrom)(e.target.value)} className={controlClasses} />
          <input type="date" aria-label="Hasta" value={to} onChange={(e) => reset(setTo)(e.target.value)} className={controlClasses} />
        </div>

        {isLoading ? (
          <div className="py-12 text-center font-mono text-xs text-text-muted">Cargando registros…</div>
        ) : isError ? (
          <div className="m-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            <AlertCircle aria-hidden="true" className="h-5 w-5 shrink-0" />
            No se pudo cargar la auditoría.
          </div>
        ) : (
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-background font-mono text-xs uppercase tracking-wider text-text-muted">
                {['Fecha', 'Acción', 'Entidad', 'Autor', ''].map((h) => (
                  <th key={h || 'd'} className="px-4 py-2.5 font-medium">
                    {h || <span className="sr-only">Detalle</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {(data?.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-text-muted">
                    No hay eventos para el filtro seleccionado.
                  </td>
                </tr>
              )}
              {data?.data.map((log) => {
                const details = auditDetails(log);
                const open = openId === log.id;
                return (
                  <Fragment key={log.id}>
                    <tr className="hover:bg-surface-raised">
                      <td className="px-4 py-2.5 font-mono text-text-muted">{formatDateTime(log.created_at)}</td>
                      <td className="px-4 py-2.5">
                        <Badge tone={log.action.endsWith('deleted') || log.action.endsWith('written_off') || log.action.endsWith('cancelled') ? 'danger' : 'neutral'}>
                          {auditActionLabel(log.action)}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        {AUDITABLE_TYPE_LABELS[log.auditable_type] ?? log.auditable_type}{' '}
                        <span className="font-mono text-text-muted">#{log.auditable_id ?? '—'}</span>
                      </td>
                      <td className="px-4 py-2.5">{log.user?.name ?? log.user?.nombre ?? '—'}</td>
                      <td className="px-4 py-2.5 text-right">
                        {details.length > 0 && (
                          <Button size="sm" variant="ghost" aria-expanded={open} onClick={() => setOpenId(open ? null : log.id)}>
                            {open ? 'Ocultar' : 'Detalle'}
                          </Button>
                        )}
                      </td>
                    </tr>
                    {open && (
                      <tr>
                        <td colSpan={5} className="bg-background px-4 py-2">
                          {details.map(([label, value]) => (
                            <div key={label} className="mb-1">
                              <span className="font-mono text-xs uppercase text-text-muted">{label}</span>
                              <pre className="overflow-x-auto font-mono text-xs text-text">
                                {JSON.stringify(value, null, 2)}
                              </pre>
                            </div>
                          ))}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}

        {meta && meta.lastPage > 1 && (
          <div className="flex items-center justify-end gap-2 border-t border-border p-2 text-xs text-text-muted">
            <span className="font-mono">
              {meta.currentPage} / {meta.lastPage} · {meta.total} eventos
            </span>
            <Button size="icon" variant="outline" aria-label="Página anterior" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="outline" aria-label="Página siguiente" disabled={page >= meta.lastPage} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
