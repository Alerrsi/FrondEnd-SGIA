import { useEffect, useState } from 'react';
import { usePurchaseRequests } from '@sgia/api-client';
import { PurchaseRequestStatus } from '@sgia/types';
import { AlertCircle, ClipboardCheck, Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/context/auth-context';
import { canDo } from '@/features/auth/types/roles';
import { PurchaseRequestFormDialog } from '@/features/solicitudes-compra/components/purchase-request-form-dialog';
import { PurchaseRequestsTable } from '@/features/solicitudes-compra/components/purchase-requests-table';
import { PURCHASE_REQUEST_STATUS_LABEL } from '@/features/solicitudes-compra/lib/purchase-request-status';
import { PageHeading } from '@/components/ui/page-heading';
import { FILTER_CONTROL_CLASS } from '@/components/ui/form-control';
import { STATE_TEXT_CLASS } from '@/components/ui/typography';

const STATUS_FILTERS: Array<PurchaseRequestStatus | ''> = ['', ...Object.values(PurchaseRequestStatus)];

const inputClasses =
  FILTER_CONTROL_CLASS;

export default function SolicitudesCompraPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canManage = canDo(user?.rol, 'managePurchaseRequests');

  const [status, setStatus] = useState<PurchaseRequestStatus | ''>('');
  const [code, setCode] = useState('');
  const [debouncedCode, setDebouncedCode] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCode(code.trim().toUpperCase());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [code]);

  const { data, isLoading, isError, isFetching } = usePurchaseRequests({
    status: status || undefined,
    code: debouncedCode || undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    per_page: 25,
  });

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const pendingAction = rows.filter(
    (r) =>
      r.status === PurchaseRequestStatus.BORRADOR ||
      r.status === PurchaseRequestStatus.APROBADA ||
      r.status === PurchaseRequestStatus.COTIZADA,
  ).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeading icon={ClipboardCheck} title="Solicitudes de compra">
          Solicitud → aprobación → envío por áreas → cotizaciones (mín. 3) → OC → factura.
        </PageHeading>
        {canManage && (
          <Button onClick={() => setFormOpen(true)} className="text-xs">
            <Plus className="h-4 w-4" />
            Nueva solicitud
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-md border border-zinc-200 bg-white px-4 py-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
        <span className="text-zinc-500 dark:text-zinc-400">
          Resultados:{' '}
          <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
            {meta?.total ?? rows.length}
          </span>
        </span>
        <span className="h-3 w-px bg-zinc-200 dark:bg-zinc-800" aria-hidden="true" />
        <span className="text-zinc-500 dark:text-zinc-400">
          Esperan acción en esta página:{' '}
          <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
            {pendingAction}
          </span>
        </span>
      </div>

      <div className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 p-2.5 dark:border-zinc-800">
          <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              aria-label="Buscar por código"
              placeholder="SC-2026-0001"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`${inputClasses} w-full pl-8`}
            />
          </div>
          <select
            aria-label="Filtrar por estado"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as PurchaseRequestStatus | '');
              setPage(1);
            }}
            className={inputClasses}
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s || 'all'} value={s}>
                {s ? PURCHASE_REQUEST_STATUS_LABEL[s] : 'Todos los estados'}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1 text-[11px] text-zinc-500">
            Desde
            <input
              type="date"
              aria-label="Desde"
              value={from}
              max={to || undefined}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
              className={inputClasses}
            />
          </label>
          <label className="flex items-center gap-1 text-[11px] text-zinc-500">
            Hasta
            <input
              type="date"
              aria-label="Hasta"
              value={to}
              min={from || undefined}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
              className={inputClasses}
            />
          </label>
          {isFetching && !isLoading && (
            <span className="animate-pulse font-mono text-xs text-zinc-400">Buscando…</span>
          )}
        </div>

        {isLoading ? (
          <div className={`py-12 ${STATE_TEXT_CLASS}`}>
            Cargando solicitudes de compra…
          </div>
        ) : isError ? (
          <div className="m-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            No se pudieron cargar las solicitudes de compra desde el servidor.
          </div>
        ) : (
          <PurchaseRequestsTable
            rows={rows}
            onOpen={(r) => navigate(`/solicitudes-compra/${r.id}`)}
          />
        )}

        {meta && meta.lastPage > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-200 px-3 py-2 text-xs dark:border-zinc-800">
            <span className="font-mono text-zinc-500">
              Página {meta.currentPage} de {meta.lastPage}
            </span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={meta.currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={meta.currentPage >= meta.lastPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      {canManage && (
        <PurchaseRequestFormDialog
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSaved={(r) => navigate(`/solicitudes-compra/${r.id}`)}
        />
      )}
    </div>
  );
}
