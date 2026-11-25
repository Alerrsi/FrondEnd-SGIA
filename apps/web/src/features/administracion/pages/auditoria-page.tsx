import { Fragment, useState } from 'react';
import { useAuditLogs, useUsers } from '@sgia/api-client';
import { AUDIT_ACTIONS, AUDITABLE_TYPES, type AuditableType } from '@sgia/types';
import { ChevronLeft, ChevronRight, ScrollText } from 'lucide-react';

import { ExportExcelButton } from '@/components/shared/export-excel-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AUDITABLE_TYPE_LABELS,
  auditActionLabel,
  auditDetails,
} from '@/features/administracion/lib/audit-labels';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/ui/page-header';
import { TableFrame } from '@/components/ui/table-frame';
import { ROW_CLASS, STICKY_COL_CLASS, TD_CLASS, TH_CLASS } from '@/components/ui/table-styles';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { TABLE_HEAD_CLASS } from '@/components/ui/typography';
import { FILTER_CONTROL_CLASS } from '@/components/ui/form-control';
import { SkeletonList } from '@/components/ui/skeleton-list';

const controlClasses = FILTER_CONTROL_CLASS;

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

  const logs = data?.data ?? [];

  const toolbar = (
    <TableToolbar>
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
    </TableToolbar>
  );

  const footer =
    meta && meta.lastPage > 1 ? (
      <>
        <span className="font-mono">
          {meta.currentPage} / {meta.lastPage} · {meta.total} eventos
        </span>
        <div className="flex gap-1">
          <Button size="icon" variant="secondary" aria-label="Página anterior" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="secondary" aria-label="Página siguiente" disabled={page >= meta.lastPage} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Button>
        </div>
      </>
    ) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={ScrollText}
        title="Auditoría"
        description="Registro de eventos críticos del sistema, solo lectura. Horas en America/Santiago."
        actions={
          <ExportExcelButton
            path="/audit-logs/export"
            params={{
              action: action || undefined,
              auditable_type: type || undefined,
              user_id: userId === '' ? undefined : userId,
              from: from || undefined,
              to: to || undefined,
            }}
            filenamePrefix="auditoria"
          />
        }
      />

      <TableFrame toolbar={toolbar} footer={footer}>
        {isLoading ? (
          <SkeletonList label="Cargando registros…" rows={8} columns={4} />
        ) : isError ? (
          <div className="p-3">
            <ErrorState>No se pudo cargar la auditoría.</ErrorState>
          </div>
        ) : logs.length === 0 ? (
          <EmptyState icon={ScrollText} title="No hay eventos para el filtro seleccionado." />
        ) : (
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead className={TABLE_HEAD_CLASS}>
              <tr>
                {['Fecha', 'Acción', 'Entidad', 'Autor', ''].map((h, i) => (
                  <th key={h || 'd'} className={i === 0 ? `${TH_CLASS} ${STICKY_COL_CLASS} max-md:bg-zinc-50` : TH_CLASS}>
                    {h || <span className="sr-only">Detalle</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const details = auditDetails(log);
                const open = openId === log.id;
                return (
                  <Fragment key={log.id}>
                    <tr className={ROW_CLASS}>
                      <td className={`${TD_CLASS} ${STICKY_COL_CLASS} whitespace-nowrap font-mono text-zinc-500 dark:text-zinc-400`}>
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className={TD_CLASS}>
                        <Badge tone={log.action.endsWith('deleted') || log.action.endsWith('written_off') || log.action.endsWith('cancelled') ? 'danger' : 'neutral'}>
                          {auditActionLabel(log.action)}
                        </Badge>
                      </td>
                      <td className={TD_CLASS}>
                        {AUDITABLE_TYPE_LABELS[log.auditable_type] ?? log.auditable_type}{' '}
                        <span className="font-mono text-zinc-500 dark:text-zinc-400">#{log.auditable_id ?? '—'}</span>
                      </td>
                      <td className={TD_CLASS}>{log.user?.name ?? log.user?.nombre ?? '—'}</td>
                      <td className={`${TD_CLASS} text-right`}>
                        {details.length > 0 && (
                          <Button size="sm" variant="ghost" aria-expanded={open} onClick={() => setOpenId(open ? null : log.id)}>
                            {open ? 'Ocultar' : 'Detalle'}
                          </Button>
                        )}
                      </td>
                    </tr>
                    {open && (
                      <tr className="border-b border-zinc-200 dark:border-zinc-800">
                        <td colSpan={5} className="bg-zinc-50 px-4 py-3 dark:bg-zinc-950/40">
                          {details.map(([label, value]) => (
                            <div key={label} className="mb-2 last:mb-0">
                              <span className="text-[13px] text-zinc-500 dark:text-zinc-400">{label}</span>
                              <pre className="overflow-x-auto font-code text-xs text-zinc-700 dark:text-zinc-300">
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
      </TableFrame>
    </div>
  );
}
