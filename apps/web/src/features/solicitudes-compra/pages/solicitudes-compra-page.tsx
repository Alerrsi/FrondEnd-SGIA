import { useEffect, useState } from 'react';
import { usePurchaseRequests } from '@sgia/api-client';
import { PurchaseRequestStatus } from '@sgia/types';
import { ClipboardCheck, Plus } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ExportExcelButton } from '@/components/shared/export-excel-button';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/context/auth-context';
import { canDo } from '@/features/auth/types/roles';
import { PurchaseRequestFormDialog } from '@/features/solicitudes-compra/components/purchase-request-form-dialog';
import { PurchaseRequestsTable } from '@/features/solicitudes-compra/components/purchase-requests-table';
import { PURCHASE_REQUEST_STATUS_LABEL } from '@/features/solicitudes-compra/lib/purchase-request-status';
import { Cell } from '@/components/ui/cell';
import { CellGrid } from '@/components/ui/cell-grid';
import { ErrorState } from '@/components/ui/error-state';
import { Metric } from '@/components/ui/metric';
import { PageHeader } from '@/components/ui/page-header';
import { TableFrame } from '@/components/ui/table-frame';
import { TableSearch } from '@/components/ui/table-search';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { PurchaseRequestMobileList } from '@/features/solicitudes-compra/components/purchase-request-mobile-list';
import { FILTER_CONTROL_CLASS } from '@/components/ui/form-control';
import { SkeletonList } from '@/components/ui/skeleton-list';

const STATUS_FILTERS: Array<PurchaseRequestStatus | ''> = ['', ...Object.values(PurchaseRequestStatus)];

const inputClasses = FILTER_CONTROL_CLASS;
const dateLabelClasses = 'flex items-center gap-2 text-[13px] text-zinc-500 dark:text-zinc-400';

export default function SolicitudesCompraPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canManage = canDo(user?.rol, 'managePurchaseRequests');

  const [searchParams] = useSearchParams();
  // El hub de Compras enlaza con `?status=` para abrir la lista ya filtrada por etapa.
  const [status, setStatus] = useState<PurchaseRequestStatus | ''>(() => {
    const initial = searchParams.get('status');
    return STATUS_FILTERS.find((s) => s === initial) ?? '';
  });
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

  const openRequest = (r: { id: number }) => navigate(`/compras/solicitudes/${r.id}`);

  const toolbar = (
    <TableToolbar>
      <TableSearch value={code} onChange={setCode} placeholder="SC-2026-0001" label="Buscar por código" />
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
      <label className={dateLabelClasses}>
        <span className="w-11 shrink-0 sm:w-auto">Desde</span>
        <input
          type="date"
          aria-label="Desde"
          value={from}
          max={to || undefined}
          onChange={(e) => {
            setFrom(e.target.value);
            setPage(1);
          }}
          className={`${inputClasses} min-w-0 flex-1 sm:flex-none`}
        />
      </label>
      <label className={dateLabelClasses}>
        <span className="w-11 shrink-0 sm:w-auto">Hasta</span>
        <input
          type="date"
          aria-label="Hasta"
          value={to}
          min={from || undefined}
          onChange={(e) => {
            setTo(e.target.value);
            setPage(1);
          }}
          className={`${inputClasses} min-w-0 flex-1 sm:flex-none`}
        />
      </label>
      {isFetching && !isLoading && (
        <span className="text-[13px] text-zinc-500 dark:text-zinc-400">Buscando…</span>
      )}
    </TableToolbar>
  );

  const footer =
    meta && meta.lastPage > 1 ? (
      <>
        <span className="font-mono">
          Página {meta.currentPage} de {meta.lastPage}
        </span>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="secondary"
            disabled={meta.currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={meta.currentPage >= meta.lastPage}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      </>
    ) : undefined;

  const mobile =
    !isLoading && !isError && rows.length > 0 ? (
      <PurchaseRequestMobileList rows={rows} onOpen={openRequest} />
    ) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={ClipboardCheck}
        title="Solicitudes de compra"
        description="Solicitud → aprobación → envío por áreas → cotizaciones (mín. 3) → OC → factura."
        actions={
          <>
            <ExportExcelButton
              path="/purchase-requests/export"
              params={{
                status: status || undefined,
                code: debouncedCode || undefined,
                from: from || undefined,
                to: to || undefined,
              }}
              filenamePrefix="solicitudes-compra"
            />
            {canManage && (
              <Button onClick={() => setFormOpen(true)}>
                <Plus aria-hidden="true" className="h-4 w-4" />
                Nueva solicitud
              </Button>
            )}
          </>
        }
      />

      <CellGrid columns={2} aria-label="Resumen de solicitudes">
        <Cell>
          <Metric label="Resultados" value={meta?.total ?? rows.length} hint="Con los filtros actuales" />
        </Cell>
        <Cell>
          <Metric
            label="Esperan acción en esta página"
            value={pendingAction}
            hint="Por aprobar, por enviar o por subir OC"
            tone={pendingAction > 0 ? 'warning' : 'neutral'}
          />
        </Cell>
      </CellGrid>

      <TableFrame toolbar={toolbar} footer={footer} mobile={mobile}>
        {isLoading ? (
          <SkeletonList label="Cargando solicitudes de compra…" columns={5} />
        ) : isError ? (
          <div className="p-3">
            <ErrorState>No se pudieron cargar las solicitudes de compra desde el servidor.</ErrorState>
          </div>
        ) : (
          <PurchaseRequestsTable rows={rows} onOpen={openRequest} />
        )}
      </TableFrame>

      {canManage && (
        <PurchaseRequestFormDialog
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSaved={(r) => navigate(`/compras/solicitudes/${r.id}`)}
        />
      )}
    </div>
  );
}
