import { useEffect, useState } from 'react';
import {
  useCancelMaintenanceRecord,
  useFinishMaintenanceRecord,
  useMaintenanceRecord,
  useUpdateMaintenanceRecord,
} from '@sgia/api-client';
import type { MaintenanceRecord, UpdateMaintenanceRecordPayload } from '@sgia/types';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { MaintenanceStatusBadge } from '@/features/mantenciones/components/maintenance-status-badge';
import {
  EXECUTION_MODE_LABELS,
  MAINTENANCE_RESULT_LABELS,
  MAINTENANCE_TYPE_LABELS,
  checklistMissing,
} from '@/features/mantenciones/lib/maintenance-labels';
import { apiErrorToMessage, apiFieldErrors } from '@/lib/api-error';
import { toast } from '@/lib/toast';

type Checklist = Required<
  Pick<
    UpdateMaintenanceRecordPayload,
    | 'rev_a_approved'
    | 'rev_b_approved'
    | 'rev_c_approved'
    | 'pfg_approved'
    | 'requires_additional_maintenance'
    | 'applies_recf'
  >
>;

const inputClasses =
  'w-full rounded-md border border-border bg-surface px-3 text-xs text-text focus:border-text-muted focus:outline-none focus:ring-1 focus:ring-info disabled:opacity-50';

function toForm(r: MaintenanceRecord) {
  return {
    checks: {
      rev_a_approved: r.rev_a_approved ?? false,
      rev_b_approved: r.rev_b_approved ?? false,
      rev_c_approved: r.rev_c_approved,
      pfg_approved: r.pfg_approved ?? false,
      requires_additional_maintenance: r.requires_additional_maintenance ?? false,
      applies_recf: r.applies_recf ?? false,
    } as Checklist,
    cost: r.repair_cost === null ? '' : String(r.repair_cost),
    parts: r.spare_parts_used ?? '',
    notes: r.technical_notes ?? '',
  };
}

/** Checklist técnico (REV-A/B/C, PFG), costos y cierre de la mantención. */
export function MaintenanceChecklistSheet({
  recordId,
  onClose,
}: {
  recordId: number | null;
  onClose: () => void;
}) {
  const { data: record, isLoading } = useMaintenanceRecord(recordId ?? undefined);
  const update = useUpdateMaintenanceRecord();
  const finish = useFinishMaintenanceRecord();
  const cancel = useCancelMaintenanceRecord();
  const [form, setForm] = useState<ReturnType<typeof toForm> | null>(null);
  const [confirm, setConfirm] = useState<'baja' | 'cancel' | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [checklistError, setChecklistError] = useState<string | null>(null);

  useEffect(() => {
    if (record) setForm(toForm(record));
    setChecklistError(null);
  }, [record]);

  const editable = record?.status === 'en_curso';
  const busy = update.isPending || finish.isPending || cancel.isPending;

  const buildPayload = (): UpdateMaintenanceRecordPayload | null => {
    if (!form) return null;
    const cost = form.cost.trim() === '' ? null : Number(form.cost);
    return {
      ...form.checks,
      repair_cost: cost !== null && Number.isFinite(cost) ? cost : null,
      spare_parts_used: form.parts.trim() || null,
      technical_notes: form.notes.trim() || null,
    };
  };

  const save = async (): Promise<boolean> => {
    const payload = buildPayload();
    if (!record || !payload) return false;
    if (payload.repair_cost !== null && (payload.repair_cost as number) < 0) {
      toast.error('El costo no puede ser negativo.');
      return false;
    }
    try {
      await update.mutateAsync({ id: record.id, payload });
      return true;
    } catch (error) {
      toast.error(apiErrorToMessage(error));
      return false;
    }
  };

  const close = async (result: 'operativo' | 'baja') => {
    if (!record || !form) return;
    if (result === 'operativo') {
      const missing = checklistMissing({ ...form.checks });
      if (missing.length > 0) {
        setChecklistError(`Falta aprobar: ${missing.join(', ')}.`);
        return;
      }
    }
    if (!(await save())) return;
    try {
      await finish.mutateAsync({ id: record.id, payload: { result } });
      toast.success(result === 'operativo' ? 'Unidad operativa y disponible' : 'Unidad dada de baja');
      onClose();
    } catch (error) {
      // 422 en `checklist`: el backend manda el detalle.
      setChecklistError(apiFieldErrors(error).checklist ?? null);
      toast.error(apiErrorToMessage(error));
    } finally {
      setConfirm(null);
    }
  };

  const doCancel = async () => {
    if (!record) return;
    try {
      await cancel.mutateAsync({ id: record.id, payload: { reason: cancelReason.trim() || null } });
      toast.success('Mantención anulada; la unidad volvió a su estado anterior');
      onClose();
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    } finally {
      setConfirm(null);
      setCancelReason('');
    }
  };

  const check = (key: keyof Checklist, label: string) =>
    form && (
      <label key={key} className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          disabled={!editable || busy}
          checked={Boolean(form.checks[key])}
          onChange={(e) =>
            setForm({ ...form, checks: { ...form.checks, [key]: e.target.checked } })
          }
        />
        {label}
      </label>
    );

  return (
    <Sheet open={recordId !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Mantención {record ? `#${record.id}` : ''}</SheetTitle>
          <SheetDescription>
            {record?.equipment_unit
              ? `${record.equipment_unit.code} · ${record.equipment_unit.product?.name ?? ''}`
              : 'Cargando…'}
          </SheetDescription>
        </SheetHeader>

        {isLoading || !record || !form ? (
          <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <MaintenanceStatusBadge status={record.status} />
              <span>{MAINTENANCE_TYPE_LABELS[record.maintenance_type]}</span>
              <span className="text-text-muted">·</span>
              <span>{EXECUTION_MODE_LABELS[record.execution_mode]}</span>
              {record.external_supplier && <span>({record.external_supplier.name})</span>}
              {record.result && (
                <span className="font-semibold">{MAINTENANCE_RESULT_LABELS[record.result]}</span>
              )}
            </div>

            <fieldset className="flex flex-col gap-2 rounded-md border border-border p-3">
              <legend className="px-1 font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
                Checklist
              </legend>
              {check('rev_a_approved', 'REV-A aprobada')}
              {check('rev_b_approved', 'REV-B aprobada')}
              <div className="flex items-center gap-2 text-xs">
                <label htmlFor="rev-c">REV-C</label>
                <select
                  id="rev-c"
                  disabled={!editable || busy}
                  value={form.checks.rev_c_approved === null ? 'na' : String(form.checks.rev_c_approved)}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      checks: {
                        ...form.checks,
                        rev_c_approved: e.target.value === 'na' ? null : e.target.value === 'true',
                      },
                    })
                  }
                  className={`${inputClasses} h-7 w-auto`}
                >
                  <option value="na">No aplica</option>
                  <option value="true">Aprobada</option>
                  <option value="false">No aprobada</option>
                </select>
              </div>
              {check('pfg_approved', 'PFG aprobada')}
              {check('requires_additional_maintenance', 'Requiere mantención adicional')}
              {check('applies_recf', 'Aplica RECF')}
              {checklistError && (
                <p role="alert" className="text-xs text-danger">
                  {checklistError}
                </p>
              )}
            </fieldset>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="mt-cost" className="font-mono text-xs text-text-muted">
                  Costo de reparación (CLP)
                </label>
                <input
                  id="mt-cost"
                  type="number"
                  min={0}
                  disabled={!editable || busy}
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  className={`${inputClasses} h-8.5 mt-1 font-mono`}
                />
              </div>
              <div>
                <label htmlFor="mt-parts" className="font-mono text-xs text-text-muted">
                  Repuestos usados
                </label>
                <input
                  id="mt-parts"
                  disabled={!editable || busy}
                  value={form.parts}
                  onChange={(e) => setForm({ ...form, parts: e.target.value })}
                  className={`${inputClasses} h-8.5 mt-1`}
                />
              </div>
            </div>
            <div>
              <label htmlFor="mt-tech-notes" className="font-mono text-xs text-text-muted">
                Notas técnicas
              </label>
              <textarea
                id="mt-tech-notes"
                rows={3}
                disabled={!editable || busy}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className={`${inputClasses} mt-1 py-2`}
              />
            </div>

            {editable && (
              <div className="mt-auto flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                <Button variant="ghost" disabled={busy} onClick={() => setConfirm('cancel')}>
                  Anular
                </Button>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={async () => {
                    if (await save()) toast.success('Checklist guardado');
                  }}
                >
                  Guardar
                </Button>
                <Button variant="danger" disabled={busy} onClick={() => setConfirm('baja')}>
                  Dar de baja
                </Button>
                <Button disabled={busy} onClick={() => close('operativo')}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Marcar operativa
                </Button>
              </div>
            )}
          </>
        )}

        <ConfirmDialog
          open={confirm === 'baja'}
          title="Dar de baja la unidad"
          description="La unidad quedará como dada de baja (estado final) y se cerrará la mantención."
          confirmLabel="Dar de baja"
          variant="danger"
          loading={busy}
          onConfirm={() => close('baja')}
          onCancel={() => setConfirm(null)}
        />
        <ConfirmDialog
          open={confirm === 'cancel'}
          title="Anular mantención"
          description="La unidad y el informe asociado volverán al estado que tenían al abrirla."
          confirmLabel="Anular mantención"
          variant="danger"
          loading={busy}
          onConfirm={doCancel}
          onCancel={() => setConfirm(null)}
        />
      </SheetContent>
    </Sheet>
  );
}
