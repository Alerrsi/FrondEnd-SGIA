import { useState } from 'react';
import { useInvoiceIntakes } from '@sgia/api-client';
import { InvoiceIntakeStatus } from '@sgia/types';
import { AlertCircle, ChevronLeft, ChevronRight, ReceiptText, Upload } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { InvoiceIntakeReviewSheet } from '@/features/ingresos-factura/components/invoice-intake-review-sheet';
import { InvoiceIntakesTable } from '@/features/ingresos-factura/components/invoice-intakes-table';
import { UploadInvoiceIntakeDialog } from '@/features/ingresos-factura/components/upload-invoice-intake-dialog';
import { BudgetSelect } from '@/features/presupuestos/components/budget-select';

const STATUS_FILTERS: Array<{
  value: InvoiceIntakeStatus | '';
  label: string;
}> = [
  { value: '', label: 'Todos' },
  { value: InvoiceIntakeStatus.BORRADOR, label: 'Borradores' },
  { value: InvoiceIntakeStatus.CONFIRMADO, label: 'Confirmados' },
  { value: InvoiceIntakeStatus.ANULADO, label: 'Anulados' },
];

const controlClasses =
  'h-8 rounded-md border border-border bg-background px-2 font-mono text-xs text-text focus:outline-none focus:ring-1 focus:ring-info';

const positiveParam = (value: string | null) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

export default function IngresosFacturaPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  // Desde una compra: /ingresos-factura?compra=12&presupuesto=3. Desde el ledger: ?ingreso=5.
  const purchaseParam = positiveParam(searchParams.get('compra'));
  const budgetParam = positiveParam(searchParams.get('presupuesto'));
  const intakeParam = positiveParam(searchParams.get('ingreso'));

  const [status, setStatus] = useState<InvoiceIntakeStatus | ''>('');
  const [budgetId, setBudgetId] = useState<number | undefined>(undefined);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [uploadOpen, setUploadOpen] = useState(purchaseParam !== undefined);
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
    if (purchaseParam || budgetParam || intakeParam) setSearchParams({}, { replace: true });
  };

  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span
            data-sede-badge="true"
            className="sede-badge inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-soft px-2 py-0.5 text-xs font-mono font-medium text-brand-strong"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
            SEDE TEMUCO · ADQUISICIONES
          </span>
          <span className="text-text-muted text-xs font-mono">/</span>
          <span className="font-mono text-xs text-text-muted uppercase tracking-wider">
            Ingresos de factura
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-text" />
              Ingresos de factura
            </h1>
            <p className="text-xs text-text-muted">
              Sube la factura, revisa el borrador del OCR y confírmalo para descontar presupuesto e
              ingresar stock (REQ-17).
            </p>
          </div>
          <Button onClick={() => setUploadOpen(true)} className="text-xs">
            <Upload className="h-4 w-4" />
            Subir factura
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-border bg-surface overflow-hidden shadow-xs">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-2.5">
          <div className="flex gap-1" role="group" aria-label="Filtrar por estado">
            {STATUS_FILTERS.map((f) => (
              <Button
                key={f.value || 'all'}
                size="sm"
                variant={status === f.value ? 'primary' : 'outline'}
                aria-pressed={status === f.value}
                onClick={() => {
                  setStatus(f.value);
                  setPage(1);
                }}
              >
                {f.label}
              </Button>
            ))}
          </div>
          <BudgetSelect
            aria-label="Filtrar por presupuesto"
            value={budgetId}
            onChange={(id) => {
              setBudgetId(id);
              setPage(1);
            }}
            className={`${controlClasses} max-w-xs`}
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
        </div>

        {isLoading ? (
          <div className="py-12 text-center font-mono text-xs text-text-muted">
            Cargando ingresos de factura…
          </div>
        ) : isError ? (
          <div className="m-3 flex items-center gap-2 rounded-md border border-danger/30 bg-danger-bg p-4 text-xs font-medium text-danger">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>No se pudieron cargar los ingresos de factura desde el servidor.</span>
          </div>
        ) : (
          <InvoiceIntakesTable
            rows={data?.data ?? []}
            onOpen={(intake) => setSelectedId(intake.id)}
          />
        )}

        {meta && meta.lastPage > 1 && (
          <div className="flex items-center justify-end gap-2 border-t border-border p-2 text-xs text-text-muted">
            <span className="font-mono">
              {meta.currentPage} / {meta.lastPage} · {meta.total} ingresos
            </span>
            <Button
              size="icon"
              variant="outline"
              aria-label="Página anterior"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              aria-label="Página siguiente"
              disabled={page >= meta.lastPage}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      <UploadInvoiceIntakeDialog
        open={uploadOpen}
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
