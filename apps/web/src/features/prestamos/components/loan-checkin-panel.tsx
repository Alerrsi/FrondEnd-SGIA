import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchCajonByCode, useCheckinLoan } from '@sgia/api-client';
import type { Prestamo } from '@sgia/types';
import { CheckCircle2, Loader2, PackageX, ScanLine, Undo2, Wrench } from 'lucide-react';

import { Badge, LoanStatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FORM_CONTROL_BASE_CLASS, FORM_CONTROL_CLASS } from '@/components/ui/form-control';
import { FIELD_LABEL_CLASS } from '@/components/ui/typography';
import { apiErrorToMessage } from '@/lib/api-error';
import { playScannerBeep } from '@/lib/audio';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';
import {
  buildCheckinPayload,
  cajonProblem,
  matchProductScan,
  missingCajon,
  pendingTargets,
  type ReturnEntry,
  type ReturnTarget,
} from '../lib/checkin-scan';

interface LoanCheckinPanelProps {
  loan: Prestamo;
  soundEnabled: boolean;
  onCancel: () => void;
  onDone: () => void;
}

type Feedback = { tone: 'ok' | 'error'; text: string } | null;

/**
 * Devolución con escaneo (`BackEnd-SGIA/docs/codigos-ubicacion.md`): por cada cosa que vuelve se
 * escanea el producto (unidad o insumo) y luego el cajón donde se guarda. Lo extraviado se marca
 * a mano. Solo se envía lo escaneado o marcado: el resto queda pendiente (devolución parcial).
 */
export function LoanCheckinPanel({ loan, soundEnabled, onCancel, onDone }: LoanCheckinPanelProps) {
  const checkin = useCheckinLoan();
  const targets = useMemo(() => pendingTargets(loan), [loan]);
  const [entries, setEntries] = useState<ReturnEntry[]>([]);
  const [scan, setScan] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [generalNotes, setGeneralNotes] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Al cambiar de préstamo se parte de cero.
  useEffect(() => {
    setEntries([]);
    setFeedback(null);
    setGeneralNotes('');
    inputRef.current?.focus();
  }, [loan.id]);

  const beep = (type: 'success' | 'error' | 'warn') => {
    if (soundEnabled) playScannerBeep(type);
  };
  const fail = (text: string) => {
    setFeedback({ tone: 'error', text });
    beep('error');
  };

  const waiting = missingCajon(entries).at(-1) ?? null;
  const entryFor = (target: ReturnTarget) => entries.find((e) => e.target.key === target.key);
  const updateEntry = (key: string, patch: Partial<ReturnEntry>) =>
    setEntries((prev) => prev.map((e) => (e.target.key === key ? { ...e, ...patch } : e)));
  const removeEntry = (key: string) => setEntries((prev) => prev.filter((e) => e.target.key !== key));

  const handleScan = async (raw: string) => {
    const code = raw.trim();
    if (!code || busy) return;
    setScan('');

    const product = matchProductScan(code, targets, entries);
    if (product.ok || product.reason === 'already-scanned') {
      if (!product.ok) return fail(`${product.target.name} (${product.target.code}) ya fue escaneado.`);
      if (waiting) return fail(`Falta escanear el cajón de ${waiting.target.name} (${waiting.target.code}).`);
      setEntries((prev) => [...prev, { target: product.target, cajon: null, condition: 'bueno', notes: '' }]);
      setFeedback({ tone: 'ok', text: `${product.target.name} (${product.target.code}): escanea el cajón donde lo guardas.` });
      beep('success');
      return;
    }

    if (!waiting) return fail(`El código ${code} no pertenece a este préstamo.`);

    setBusy(true);
    try {
      const found = await fetchCajonByCode(code);
      const cajon = {
        id: found.id,
        code: found.barcode ?? found.codigo,
        storeroomId: found.location?.storeroom_id != null ? Number(found.location.storeroom_id) : null,
      };
      const problem = cajonProblem(waiting.target, cajon, loan.storeroom_id ?? null);
      if (problem) return fail(problem);
      updateEntry(waiting.target.key, { cajon });
      setFeedback({ tone: 'ok', text: `${waiting.target.name} (${waiting.target.code}) se guarda en ${cajon.code}.` });
      beep('success');
    } catch (error) {
      fail(apiErrorToMessage(error));
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const markLost = (target: ReturnTarget) => {
    setEntries((prev) => [...prev.filter((e) => e.target.key !== target.key), { target, cajon: null, condition: 'extraviado', notes: '' }]);
    setFeedback(null);
  };

  const pendingCajon = missingCajon(entries);
  const canSubmit = entries.length > 0 && pendingCajon.length === 0 && !checkin.isPending && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    try {
      await checkin.mutateAsync(buildCheckinPayload(loan.id, entries, generalNotes));
      const partial = entries.length < targets.length;
      toast.success(
        partial
          ? `Devolución parcial registrada en ${loan.codigo ?? `#${loan.id}`} (${entries.length} de ${targets.length}).`
          : `Préstamo ${loan.codigo ?? `#${loan.id}`} devuelto por completo.`,
      );
      onDone();
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    }
  };

  const prompt = waiting
    ? `Escanea el cajón donde guardas ${waiting.target.name} (${waiting.target.code})`
    : 'Escanea una unidad o insumo del préstamo';

  return (
    <div className="flex flex-col gap-4 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
        <div className="flex min-w-0 flex-col">
          <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
            Recepcionando préstamo {loan.codigo ?? `#${loan.id}`}
          </span>
          <span className="text-xs text-zinc-500">
            Docente: {loan.solicitanteNombre} {loan.solicitanteRun ? `(${loan.solicitanteRun})` : ''}
          </span>
        </div>
        <LoanStatusBadge estado={loan.estado} />
      </div>

      {/* Escaneo por pares: producto y luego cajón */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="checkin-scan" className={FIELD_LABEL_CLASS}>
          {prompt}
        </label>
        <div className="relative">
          <ScanLine className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            id="checkin-scan"
            ref={inputRef}
            autoFocus
            autoComplete="off"
            value={scan}
            disabled={checkin.isPending}
            onChange={(e) => setScan(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleScan(scan);
              }
            }}
            placeholder={waiting ? 'Código del cajón (ej. L206-RACK-R1)' : 'Código de la unidad o del insumo'}
            className={cn(FORM_CONTROL_CLASS, 'pl-8 uppercase', waiting && 'border-amber-400 dark:border-amber-600')}
          />
          {busy && <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-400" />}
        </div>
        {feedback && (
          <p
            role="status"
            className={cn(
              'text-xs font-medium',
              feedback.tone === 'ok' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
            )}
          >
            {feedback.text}
          </p>
        )}
      </div>

      {/* Lo que falta devolver */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
          Ítems por devolver ({entries.length} de {targets.length} registrados)
        </span>
        {targets.length === 0 ? (
          <p className="rounded border border-dashed border-zinc-200 dark:border-zinc-800 p-4 text-center text-xs text-zinc-500">
            Este préstamo no tiene ítems pendientes de devolución.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800 rounded border border-zinc-200 dark:border-zinc-800">
            {targets.map((target) => {
              const entry = entryFor(target);
              const isWaiting = entry && entry.condition !== 'extraviado' && entry.cajon === null;
              return (
                <li key={target.key} data-testid={`checkin-row-${target.code}`} className="flex flex-col gap-2 p-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-col">
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">{target.name}</span>
                      <span className="font-mono text-[11px] text-zinc-500">
                        {target.code || '—'}
                        {target.kind === 'supply' && ` · Cantidad: ${target.quantity}`}
                        {target.kind === 'supply' && target.registeredCajonCode && ` · Cajón: ${target.registeredCajonCode}`}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {!entry && <Badge tone="neutral">Pendiente</Badge>}
                      {isWaiting && <Badge tone="warning">Esperando cajón</Badge>}
                      {entry?.condition === 'extraviado' && <Badge tone="danger">Extraviado</Badge>}
                      {entry?.cajon && (
                        <Badge tone={entry.condition === 'dañado' ? 'maintenance' : 'available'}>
                          <span className="font-mono">{entry.cajon.code}</span>
                        </Badge>
                      )}
                      {entry && entry.condition !== 'extraviado' && (
                        <Button
                          size="sm"
                          variant={entry.condition === 'dañado' ? 'danger' : 'outline'}
                          aria-pressed={entry.condition === 'dañado'}
                          onClick={() => updateEntry(target.key, { condition: entry.condition === 'dañado' ? 'bueno' : 'dañado' })}
                        >
                          <Wrench className="h-3.5 w-3.5" />
                          Dañado
                        </Button>
                      )}
                      {!entry && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markLost(target)}
                          aria-label={`Marcar ${target.code || target.name} como extraviado`}
                        >
                          <PackageX className="h-3.5 w-3.5" />
                          Extraviado
                        </Button>
                      )}
                      {entry && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeEntry(target.key)}
                          aria-label={`Deshacer ${target.code || target.name}`}
                          title="Deshacer"
                        >
                          <Undo2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {entry?.condition === 'dañado' && (
                    <input
                      type="text"
                      value={entry.notes}
                      aria-label={`Detalle del daño de ${target.code || target.name}`}
                      onChange={(e) => updateEntry(target.key, { notes: e.target.value })}
                      placeholder="Detalle del daño (ej. cable cortado, lente rayado)…"
                      className={cn(FORM_CONTROL_CLASS, 'border-rose-300 dark:border-rose-800')}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div>
        <label htmlFor="checkin-notes" className={FIELD_LABEL_CLASS}>
          Observaciones generales de recepción
        </label>
        <textarea
          id="checkin-notes"
          rows={2}
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          placeholder="Comentarios adicionales opcionales…"
          className={cn(FORM_CONTROL_BASE_CLASS, 'mt-1 py-2')}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
        <span className="text-xs text-zinc-500">
          {pendingCajon.length > 0
            ? `Falta escanear el cajón de ${pendingCajon.length} ítem(s).`
            : entries.length < targets.length && entries.length > 0
              ? 'Lo no escaneado queda pendiente (devolución parcial).'
              : ''}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={checkin.isPending}>
            Cancelar
          </Button>
          <Button size="sm" onClick={() => void submit()} disabled={!canSubmit}>
            {checkin.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Registrar devolución ({entries.length})
          </Button>
        </div>
      </div>
    </div>
  );
}
