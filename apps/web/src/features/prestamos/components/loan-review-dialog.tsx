import { useState } from 'react';
import { ApiRequestError, useAprobarPrestamo, useLoanReview } from '@sgia/api-client';
import type { LoanReview, Prestamo } from '@sgia/types';
import { AlertTriangle, Ban, Check, MapPin, RefreshCw, RotateCcw, ScanLine } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogCloseButton } from '@/components/ui/dialog';
import { formatDateOnly } from '@/features/compras/lib/format';
import { LoanReviewScanPanel } from '@/features/prestamos/components/loan-review-scan-panel';
import { LoanReviewUnitRow } from '@/features/prestamos/components/loan-review-unit-row';
import {
  loanCareer,
  loanLaboratory,
  loanSchedule,
  loanStoreroom,
  loanSubject,
  loanTeacher,
} from '@/features/prestamos/lib/loan-display';
import {
  buildApprovePayload,
  initialSelection,
  isSelectionChanged,
  isUnitChanged,
  selectedUnits,
  type ReviewSelection,
} from '@/features/prestamos/lib/loan-review-selection';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';

interface LoanReviewDialogProps {
  /** Solicitud en revisión; `null` mantiene el diálogo cerrado. */
  loan: Prestamo | null;
  onClose: () => void;
  onReject: (loan: Prestamo) => void;
}

export function LoanReviewDialog({ loan, onClose, onReject }: LoanReviewDialogProps) {
  const { data: review, error, isLoading, isFetching, refetch } = useLoanReview(loan?.id);
  const aprobarMutation = useAprobarPrestamo();

  const [selection, setSelection] = useState<ReviewSelection>({});
  const [loadedReview, setLoadedReview] = useState<LoanReview | undefined>(undefined);
  const [approveNotice, setApproveNotice] = useState<string | null>(null);
  const [scanningItemId, setScanningItemId] = useState<number | null>(null);

  // Cada revisión nueva del servidor reinicia la selección con su propuesta.
  if (review !== loadedReview) {
    setLoadedReview(review);
    setSelection(review ? initialSelection(review) : {});
    setScanningItemId(null);
  }

  const changed = review ? isSelectionChanged(review, selection) : false;
  const canApprove =
    review?.can_approve === true &&
    scanningItemId === null &&
    !isFetching &&
    !aprobarMutation.isPending;

  const handleApprove = async () => {
    if (!loan || !review) return;
    setApproveNotice(null);
    try {
      await aprobarMutation.mutateAsync({
        id: loan.id,
        payload: buildApprovePayload(review, selection),
      });
      toast.success(`Solicitud ${review.code} aprobada`);
      onClose();
    } catch (err) {
      const message = apiErrorToMessage(err);
      toast.error(message);
      if (err instanceof ApiRequestError && err.status === 422) {
        setApproveNotice(`${message} La propuesta pudo cambiar: revísala antes de aprobar.`);
        void refetch();
      } else {
        setApproveNotice(message);
      }
    }
  };

  const activity = loan
    ? [
        loan.loan_date ? formatDateOnly(loan.loan_date) : null,
        loanSchedule(loan) !== '—' ? loanSchedule(loan) : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : '';

  const facts = loan
    ? [
        { label: 'Docente', value: loanTeacher(loan) },
        { label: 'RUN', value: loan.solicitanteRun || '—', mono: true },
        { label: 'Asignatura', value: loanSubject(loan) },
        { label: 'Carrera', value: loanCareer(loan) },
        { label: 'Actividad', value: activity || 'Horario no informado', mono: true },
        { label: 'Laboratorio', value: loanLaboratory(loan) },
        { label: 'Pañol', value: review?.storeroom?.name ?? loanStoreroom(loan) },
        ...(loan.observaciones ? [{ label: 'Nota del docente', value: loan.observaciones }] : []),
      ]
    : [];

  return (
    <Dialog
      open={loan !== null}
      onClose={onClose}
      title={`Revisar solicitud ${loan?.codigo ?? (loan ? `#${loan.id}` : '')}`}
      description="El sistema propone las unidades disponibles del pañol. Si prefieres entregar otras, usa Cambiar elementos y escanéalas."
      className="max-w-3xl max-h-[90vh] overflow-y-auto"
      hasUnsavedChanges={changed || scanningItemId !== null}
      confirmExitTitle="¿Descartar los cambios de unidades?"
      confirmExitDescription="Cambiaste unidades de la propuesta del sistema. Si sales ahora, esos cambios se perderán."
    >
      {loan && (
        <dl className="grid grid-cols-1 gap-x-4 gap-y-1 rounded-md bg-zinc-50 dark:bg-zinc-950/60 p-2.5 text-[11px] text-zinc-600 dark:text-zinc-400 sm:grid-cols-2">
          {facts.map(({ label, value, mono }) => (
            <div key={label} className="flex min-w-0 gap-1.5">
              <dt className="shrink-0 font-semibold text-zinc-700 dark:text-zinc-300">{label}:</dt>
              <dd className={mono ? 'min-w-0 font-mono tabular-nums' : 'min-w-0'}>{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-3 flex flex-col gap-3">
        {isLoading && (
          <div className="flex h-24 items-center justify-center text-xs text-zinc-500" role="status">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin text-zinc-400" />
            <span>Buscando unidades disponibles…</span>
          </div>
        )}

        {!isLoading && !review && error && (
          <div
            role="alert"
            className="flex flex-col items-start gap-2 rounded border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 p-2.5 text-xs text-rose-700 dark:text-rose-300"
          >
            <span>{apiErrorToMessage(error)}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
              Reintentar
            </Button>
          </div>
        )}

        {approveNotice && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 p-2.5 text-xs text-amber-800 dark:text-amber-300"
          >
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{approveNotice}</span>
          </div>
        )}

        {review?.items.map((item) => (
          <section
            key={item.item_id}
            aria-label={item.name}
            className="rounded-md border border-zinc-200 dark:border-zinc-800 p-2.5"
          >
            <header className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</h3>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                  Solicitado: {item.quantity} · Disponible: {item.available_quantity}
                </span>
                {item.has_units && scanningItemId !== item.item_id && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setScanningItemId(item.item_id)}
                    disabled={item.available_quantity <= item.quantity}
                    title={
                      item.available_quantity <= item.quantity
                        ? 'No hay otras unidades disponibles en este pañol.'
                        : undefined
                    }
                    aria-label={`Cambiar elementos de ${item.name}`}
                    className="h-7 gap-1 px-2 text-xs"
                  >
                    <ScanLine className="h-3.5 w-3.5" />
                    <span>Cambiar elementos</span>
                  </Button>
                )}
              </div>
            </header>

            {item.shortage > 0 && (
              <p
                role="alert"
                className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400"
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {item.has_units
                    ? `Faltan ${item.shortage} unidad(es) en este pañol.`
                    : `Faltan ${item.shortage} en stock.`}
                </span>
              </p>
            )}

            {item.has_units ? (
              <>
                {scanningItemId === item.item_id && (
                  <LoanReviewScanPanel
                    item={item}
                    selection={selection}
                    onComplete={(unitIds) => {
                      setSelection({ ...selection, [item.item_id]: unitIds });
                      setScanningItemId(null);
                    }}
                    onCancel={() => setScanningItemId(null)}
                  />
                )}
                <ul className="mt-2 flex flex-col gap-1.5">
                  {selectedUnits(item, selection).map((unit) => (
                    <LoanReviewUnitRow
                      key={unit.id}
                      unit={unit}
                      changed={isUnitChanged(item, unit.id)}
                    />
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-zinc-700 dark:text-zinc-300">
                <MapPin className="h-3 w-3 shrink-0 text-zinc-400" />
                <span>
                  {item.location?.nombre ?? 'Sala sin registrar'} ·{' '}
                  <span className="font-mono">{item.cajon?.codigo ?? 'Cajón sin registrar'}</span>
                </span>
              </p>
            )}
          </section>
        ))}
      </div>

      <div className="mt-4 flex flex-col-reverse gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => loan && onReject(loan)}
            disabled={aprobarMutation.isPending}
            className="text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700"
          >
            <Ban className="mr-1 h-3.5 w-3.5" />
            <span>Rechazar</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => review && setSelection(initialSelection(review))}
            disabled={!changed}
            className="text-xs"
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            <span>Restablecer propuesta</span>
          </Button>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <DialogCloseButton variant="outline" size="sm">
            Cerrar
          </DialogCloseButton>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleApprove}
            disabled={!canApprove}
            className="gap-1 text-xs"
          >
            <Check className="h-3.5 w-3.5" />
            <span>{aprobarMutation.isPending ? 'Aprobando…' : 'Aprobar'}</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
