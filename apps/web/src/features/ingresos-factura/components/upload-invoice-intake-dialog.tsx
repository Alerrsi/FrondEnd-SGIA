import { useEffect, useRef, useState } from 'react';
import { ApiRequestError, usePurchases, useUploadInvoiceIntake } from '@sgia/api-client';
import { PurchaseStatus, type InvoiceIntake } from '@sgia/types';
import { FileText, FileUp, Loader2, UploadCloud, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogCloseButton } from '@/components/ui/dialog';
import { formatCLP } from '@/features/compras/lib/format';
import { BudgetSelect } from '@/features/presupuestos/components/budget-select';
import { apiErrorToMessage, apiFieldErrors } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

const inputClasses =
  'w-full h-8.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 font-mono text-xs text-zinc-800 dark:text-zinc-200 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 disabled:opacity-50';
const labelClasses =
  'text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono';
const errorClasses = 'mt-1 text-[11px] text-rose-600 dark:text-rose-400';

interface UploadInvoiceIntakeDialogProps {
  open: boolean;
  onClose: () => void;
  initialBudgetId?: number;
  initialPurchaseId?: number;
  onUploaded: (intake: InvoiceIntake) => void;
}

/** Paso 1: archivo + presupuesto (+ compra opcional). El backend corre el OCR y crea el borrador. */
export function UploadInvoiceIntakeDialog({
  open,
  onClose,
  initialBudgetId,
  initialPurchaseId,
  onUploaded,
}: UploadInvoiceIntakeDialogProps) {
  const upload = useUploadInvoiceIntake();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [budgetId, setBudgetId] = useState<number | undefined>(initialBudgetId);
  const [purchaseId, setPurchaseId] = useState<number | undefined>(initialPurchaseId);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: purchasesPage } = usePurchases({ per_page: 100 });
  // Solo compras del mismo presupuesto, no canceladas y con reserva vigente (el backend lo valida igual).
  const purchases = (purchasesPage?.data ?? []).filter(
    (p) =>
      p.annual_budget_id === budgetId &&
      p.status !== PurchaseStatus.CANCELADA &&
      ((p.reserved_amount ?? 0) > 0 || p.id === purchaseId),
  );

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setBudgetId(initialBudgetId);
    setPurchaseId(initialPurchaseId);
    setErrors({});
    if (fileRef.current) fileRef.current.value = '';
  }, [open, initialBudgetId, initialPurchaseId]);

  const pickFile = (f: File | undefined) => {
    if (!f) return;
    if (f.size > MAX_BYTES) {
      setErrors((e) => ({ ...e, file: 'El archivo no puede superar 10 MB.' }));
      return;
    }
    if (!ACCEPTED.includes(f.type)) {
      setErrors((e) => ({
        ...e,
        file: 'Formato no soportado: usa PDF, PNG, JPG o WEBP.',
      }));
      return;
    }
    setErrors(({ file: _omit, ...rest }) => rest);
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!file) next.file = 'Selecciona el archivo de la factura.';
    if (!budgetId) next.annual_budget_id = 'Selecciona el presupuesto a descontar.';
    setErrors(next);
    if (!file || !budgetId) return;

    try {
      const intake = await upload.mutateAsync({
        file,
        annual_budget_id: budgetId,
        purchase_id: purchaseId ?? null,
      });
      toast.success(
        intake.raw_ocr_payload.ocr_available
          ? `Borrador creado: ${intake.raw_ocr_payload.items.length} ítem(s) detectados para revisar.`
          : 'Borrador creado sin lectura OCR: carga los ítems a mano.',
      );
      onUploaded(intake);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 429) {
        toast.error('Demasiadas facturas en poco tiempo. Espera un minuto e inténtalo de nuevo.');
        return;
      }
      setErrors(apiFieldErrors(error));
      toast.error(apiErrorToMessage(error));
    }
  };

  const pending = upload.isPending;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      hasUnsavedChanges={Boolean(file) && !pending}
      title="Subir factura"
      description="Se guarda el archivo, se lee con OCR y se crea un borrador. Nada se descuenta hasta que lo confirmes."
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pickFile(e.dataTransfer.files[0]);
          }}
          className={cn(
            'flex flex-col items-center justify-center rounded-md border-2 border-dashed p-6 text-center transition-colors',
            dragging
              ? 'border-zinc-400 bg-zinc-100 dark:bg-zinc-800'
              : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/40',
            pending && 'pointer-events-none opacity-60',
          )}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            aria-label="Archivo de factura"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
          {pending ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="h-7 w-7 animate-spin text-zinc-500" />
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Leyendo la factura con OCR…
              </span>
            </div>
          ) : file ? (
            <div className="flex items-center gap-2 text-xs">
              <FileText className="h-5 w-5 text-zinc-400" />
              <span className="font-mono text-zinc-800 dark:text-zinc-200">{file.name}</span>
              <span className="text-zinc-400">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
              <button
                type="button"
                aria-label="Quitar archivo"
                onClick={() => {
                  setFile(null);
                  if (fileRef.current) fileRef.current.value = '';
                }}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <>
              <UploadCloud className="mb-2 h-6 w-6 text-zinc-400" />
              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                Arrastra la factura aquí
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-zinc-500">
                PDF, PNG, JPG o WEBP · máx. 10 MB
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 text-xs"
                onClick={() => fileRef.current?.click()}
              >
                <FileUp className="h-3.5 w-3.5" />
                Seleccionar archivo
              </Button>
            </>
          )}
        </div>
        {errors.file && <p className={errorClasses}>{errors.file}</p>}

        <div>
          <label htmlFor="ii-budget" className={labelClasses}>
            Presupuesto
          </label>
          <BudgetSelect
            id="ii-budget"
            value={budgetId}
            onChange={(id) => {
              setBudgetId(id);
              setPurchaseId(undefined);
            }}
            invalid={Boolean(errors.annual_budget_id)}
            disabled={pending}
            className={`${inputClasses} mt-1.5`}
          />
          {errors.annual_budget_id && <p className={errorClasses}>{errors.annual_budget_id}</p>}
        </div>

        <div>
          <label htmlFor="ii-purchase" className={labelClasses}>
            Orden de compra (opcional)
          </label>
          <select
            id="ii-purchase"
            value={purchaseId ?? ''}
            onChange={(e) => setPurchaseId(e.target.value ? Number(e.target.value) : undefined)}
            disabled={pending || !budgetId}
            className={`${inputClasses} mt-1.5`}
          >
            <option value="">
              {budgetId ? 'Sin compra ligada' : 'Elige primero el presupuesto'}
            </option>
            {purchases.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code ?? `#${p.id}`} · {p.supplier?.name ?? 'Proveedor'} · reservado{' '}
                {formatCLP(p.reserved_amount)}
              </option>
            ))}
          </select>
          {errors.purchase_id && <p className={errorClasses}>{errors.purchase_id}</p>}
          <p className="mt-1 text-[11px] text-zinc-400">
            Ligarla libera su reserva al confirmar y descuenta el monto real de la factura.
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
          <DialogCloseButton disabled={pending}>Cancelar</DialogCloseButton>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Subir y leer factura
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
