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
  'h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2 font-mono text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-400';

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
            className="sede-badge inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-red-600 dark:text-red-400"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-red-600 dark:bg-red-500 animate-pulse" />
            SEDE TEMUCO · ADQUISICIONES
          </span>
          <span className="text-zinc-400 text-xs font-mono">/</span>
          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Ingresos de factura
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
              Ingresos de factura
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
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

      <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 p-2.5">
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
          <div className="py-12 text-center font-mono text-xs text-zinc-500">
            Cargando ingresos de factura…
          </div>
        ) : isError ? (
          <div className="m-3 flex items-center gap-2 rounded-md border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 p-4 text-xs font-medium text-red-700 dark:text-red-400">
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
          <div className="flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 p-2 text-xs text-zinc-500">
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
        initialBudgetId={budgetParam}
        initialPurchaseId={purchaseParam}
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
