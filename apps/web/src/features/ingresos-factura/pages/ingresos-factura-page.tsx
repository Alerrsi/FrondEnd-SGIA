import { useState } from 'react';
import { useInvoiceIntakes } from '@sgia/api-client';
import { InvoiceIntakeStatus } from '@sgia/types';
import { ChevronLeft, ChevronRight, ReceiptText, Upload } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { InvoiceIntakeReviewSheet } from '@/features/ingresos-factura/components/invoice-intake-review-sheet';
import { InvoiceIntakesTable } from '@/features/ingresos-factura/components/invoice-intakes-table';
import { UploadInvoiceIntakeDialog } from '@/features/ingresos-factura/components/upload-invoice-intake-dialog';
import { BudgetSelect } from '@/features/presupuestos/components/budget-select';
import { isPurchaseRequestCode } from '@/features/solicitudes-compra/lib/purchase-request-code';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/ui/page-header';
import { TableFrame } from '@/components/ui/table-frame';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { SegmentedFilter } from '@/components/shared/segmented-filter';
import { InvoiceIntakeMobileList } from '@/features/ingresos-factura/components/invoice-intake-mobile-list';
import { FILTER_CONTROL_CLASS } from '@/components/ui/form-control';
import { SkeletonList } from '@/components/ui/skeleton-list';

const STATUS_FILTERS: Array<{
  value: InvoiceIntakeStatus | '';
  label: string;
}> = [
  { value: '', label: 'Todos' },
  { value: InvoiceIntakeStatus.BORRADOR, label: 'Borradores' },
  { value: InvoiceIntakeStatus.CONFIRMADO, label: 'Confirmados' },
  { value: InvoiceIntakeStatus.ANULADO, label: 'Anulados' },
];

const controlClasses = FILTER_CONTROL_CLASS;

const positiveParam = (value: string | null) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

export default function IngresosFacturaPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  // Desde una compra: /compras/facturas?compra=12&presupuesto=3. Desde el ledger: ?ingreso=5.
  const purchaseParam = positiveParam(searchParams.get('compra'));
  const budgetParam = positiveParam(searchParams.get('presupuesto'));
  const intakeParam = positiveParam(searchParams.get('ingreso'));
  // Desde una solicitud de compra con OC: ?solicitud=SC-2026-0001.
  const rawRequestParam = searchParams.get('solicitud') ?? '';
  const requestParam = isPurchaseRequestCode(rawRequestParam)
    ? rawRequestParam.trim().toUpperCase()
    : undefined;

  const [status, setStatus] = useState<InvoiceIntakeStatus | ''>('');
  const [budgetId, setBudgetId] = useState<number | undefined>(undefined);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [uploadOpen, setUploadOpen] = useState(
    purchaseParam !== undefined || requestParam !== undefined,
  );
  const [selectedId, setSelectedId] = useState<number | null>(intakeParam ?? null);

  const { data, isLoading, isError } = useInvoiceIntakes({
    status: status || undefined,
    annual_budget_id: budgetId,
    from: from || undefined,
    to: to || undefined,
    page,
    per_page: 20,
  });

  const clearParams = () => {
    if (purchaseParam || budgetParam || intakeParam || requestParam)
      setSearchParams({}, { replace: true });
  };

  const meta = data?.meta;

  const rows = data?.data ?? [];

  const toolbar = (
    <TableToolbar>
      <SegmentedFilter
        label="Filtrar por estado"
        options={STATUS_FILTERS}
        value={status}
        onChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
      />
      <BudgetSelect
        aria-label="Filtrar por presupuesto"
        value={budgetId}
        onChange={(id) => {
          setBudgetId(id);
          setPage(1);
        }}
        className={`${controlClasses} sm:max-w-xs`}
      />
      <input
        type="date"
        aria-label="Recibidas desde"
        value={from}
        onChange={(e) => {
          setFrom(e.target.value);
          setPage(1);
        }}
        className={controlClasses}
      />
      <input
        type="date"
        aria-label="Recibidas hasta"
        value={to}
        onChange={(e) => {
          setTo(e.target.value);
          setPage(1);
        }}
        className={controlClasses}
      />
    </TableToolbar>
  );

  const footer =
    meta && meta.lastPage > 1 ? (
      <>
        <span className="font-mono">
          {meta.currentPage} / {meta.lastPage} · {meta.total} ingresos
        </span>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="secondary"
            aria-label="Página anterior"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            aria-label="Página siguiente"
            disabled={page >= meta.lastPage}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Button>
        </div>
      </>
    ) : undefined;

  const mobile =
    !isLoading && !isError && rows.length > 0 ? (
      <InvoiceIntakeMobileList rows={rows} onOpen={(intake) => setSelectedId(intake.id)} />
    ) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={ReceiptText}
        title="Ingresos de factura"
        description="Sube la factura, revisa el borrador del OCR y confírmalo para descontar presupuesto e ingresar stock."
        actions={
          <Button onClick={() => setUploadOpen(true)}>
            <Upload aria-hidden="true" className="h-4 w-4" />
            Subir factura
          </Button>
        }
      />

      <TableFrame toolbar={toolbar} footer={footer} mobile={mobile}>
        {isLoading ? (
          <SkeletonList label="Cargando ingresos de factura…" columns={5} />
        ) : isError ? (
          <div className="p-3">
            <ErrorState>No se pudieron cargar los ingresos de factura desde el servidor.</ErrorState>
          </div>
        ) : (
          <InvoiceIntakesTable rows={rows} onOpen={(intake) => setSelectedId(intake.id)} />
        )}
      </TableFrame>

      <UploadInvoiceIntakeDialog
        open={uploadOpen}
        initialRequestCode={requestParam}
        initialPurchaseId={purchaseParam}
        initialBudgetId={budgetParam}
        onClose={() => {
          setUploadOpen(false);
          clearParams();
        }}
        onUploaded={(intake) => {
          setUploadOpen(false);
          clearParams();
          setSelectedId(intake.id);
        }}
      />

      <InvoiceIntakeReviewSheet
        intakeId={selectedId}
        onClose={() => {
          setSelectedId(null);
          clearParams();
        }}
      />
    </div>
  );
}
