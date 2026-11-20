import { useId, useState, type FormEvent } from 'react';
import type { LoanReviewItem, LoanReviewUnit } from '@sgia/types';
import { MapPin, ScanLine } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { scanUnit, type ReviewSelection } from '@/features/prestamos/lib/loan-review-selection';
import { playScannerBeep } from '@/lib/audio';
import { FORM_CONTROL_CLASS } from '@/components/ui/form-control';
import { FIELD_LABEL_CLASS } from '@/components/ui/typography';

interface LoanReviewScanPanelProps {
  item: LoanReviewItem;
  selection: ReviewSelection;
  /** Recibe las unidades al completar la cantidad solicitada. */
  onComplete: (unitIds: number[]) => void;
  onCancel: () => void;
}

/** Reemplaza los elementos de un ítem: se escanea exactamente la cantidad solicitada. */
export function LoanReviewScanPanel({
  item,
  selection,
  onComplete,
  onCancel,
}: LoanReviewScanPanelProps) {
  const fieldId = useId();
  const errorId = useId();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [scanned, setScanned] = useState<LoanReviewUnit[]>([]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const scannedIds = scanned.map((unit) => unit.id);
    const result = scanUnit(item, selection, scannedIds, code);
    setCode('');

    if (!result.ok) {
      playScannerBeep('error');
      setError(result.error);
      return;
    }

    playScannerBeep('success');
    setError(null);
    if (scanned.length + 1 >= item.quantity) {
      onComplete([...scannedIds, result.unit.id]);
      return;
    }
    setScanned([...scanned, result.unit]);
  };

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-950/60">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
        <span className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200">
          <ScanLine aria-hidden="true" className="h-3.5 w-3.5 text-zinc-400" />
          Escanea las {item.quantity} unidades que se entregan
        </span>
        <span aria-live="polite" className="font-mono text-zinc-600 dark:text-zinc-400">
          {scanned.length} de {item.quantity}
        </span>
      </div>

      {scanned.length > 0 && (
        <ul className="flex flex-col gap-1 text-[13px]">
          {scanned.map((unit) => (
            <li key={unit.id} className="flex flex-wrap items-center gap-x-2 text-zinc-700 dark:text-zinc-300">
              <span className="font-code text-xs text-zinc-900 dark:text-zinc-100">{unit.code}</span>
              <span className="flex items-center gap-1">
                <MapPin aria-hidden="true" className="h-3 w-3 shrink-0 text-zinc-400" />
                {unit.location?.nombre ?? 'Sala sin registrar'} ·{' '}
                <span className="font-code text-xs">{unit.cajon?.codigo ?? 'Cajón sin registrar'}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-1">
        <label htmlFor={fieldId} className={FIELD_LABEL_CLASS}>
          Código de la unidad
        </label>
        <div className="flex flex-col gap-1.5 sm:flex-row">
          <input
            id={fieldId}
            type="text"
            value={code}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            placeholder="Escanea o escribe el código"
            aria-invalid={error !== null}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => {
              setCode(event.target.value);
              if (error) setError(null);
            }}
            className={`${FORM_CONTROL_CLASS} min-w-0 flex-1 font-code`}
          />
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
        {error && (
          <span id={errorId} role="alert" className="text-xs text-danger">
            {error}
          </span>
        )}
      </form>
    </div>
  );
}
