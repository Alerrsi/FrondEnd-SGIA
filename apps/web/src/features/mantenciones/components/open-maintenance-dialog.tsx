import { useEffect, useState } from 'react';
import { useCreateMaintenanceRecord, useSuppliers } from '@sgia/api-client';
import type { EquipmentUnit, MaintenanceExecutionMode, MaintenanceType } from '@sgia/types';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogCloseButton } from '@/components/ui/dialog';
import {
  EXECUTION_MODE_LABELS,
  MAINTENANCE_TYPE_LABELS,
} from '@/features/mantenciones/lib/maintenance-labels';
import { apiErrorToMessage, apiFieldErrors } from '@/lib/api-error';
import { toast } from '@/lib/toast';

const controlClasses =
  'w-full h-8.5 rounded-md border border-border bg-surface px-3 text-xs text-text focus:border-text-muted focus:outline-none focus:ring-1 focus:ring-info disabled:opacity-50';
const labelClasses = 'text-xs font-semibold uppercase tracking-wider text-text-muted font-mono';
const errorClasses = 'mt-1 text-xs text-danger';

/** "Enviar a mantención": abre una mantención `en_curso` (la unidad pasa a `en_reparacion`). */
export function OpenMaintenanceDialog({
  unit,
  incidentReportId,
  onClose,
  onOpened,
}: {
  unit: EquipmentUnit | null;
  /** Informe de novedades de origen, si el flujo parte desde uno. */
  incidentReportId?: number;
  onClose: () => void;
  onOpened?: (recordId: number) => void;
}) {
  const create = useCreateMaintenanceRecord();
  const [type, setType] = useState<MaintenanceType>('preventiva');
  const [mode, setMode] = useState<MaintenanceExecutionMode>('medios_propios');
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { data: suppliers } = useSuppliers({ is_active: true, per_page: 100 });

  useEffect(() => {
    if (!unit) return;
    setType(incidentReportId ? 'correctiva' : 'preventiva');
    setMode('medios_propios');
    setSupplierId('');
    setNotes('');
    setErrors({});
  }, [unit, incidentReportId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unit) return;
    if (mode === 'externa' && !supplierId) {
      setErrors({ external_supplier_id: 'Selecciona el proveedor externo.' });
      return;
    }
    try {
      const record = await create.mutateAsync({
        unitId: unit.id,
        payload: {
          maintenance_type: type,
          execution_mode: mode,
          ...(mode === 'externa' ? { external_supplier_id: Number(supplierId) } : {}),
          ...(incidentReportId ? { incident_report_id: incidentReportId } : {}),
          technical_notes: notes.trim() || null,
        },
      });
      toast.success(`Mantención abierta para ${unit.code}`);
      onOpened?.(record.id);
      onClose();
    } catch (error) {
      // 422: unidad prestada / dada de baja / ya tiene una mantención en curso (equipment_unit_id).
      setErrors(apiFieldErrors(error));
      toast.error(apiErrorToMessage(error));
    }
  };

  const pending = create.isPending;
  return (
    <Dialog
      open={unit !== null}
      onClose={onClose}
      title="Enviar a mantención"
      description={unit ? `${unit.code} · pasará a "En reparación" mientras dure.` : undefined}
      className="max-w-md"
    >
      <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
        <div>
          <label htmlFor="mt-type" className={labelClasses}>
            Tipo
          </label>
          <select
            id="mt-type"
            value={type}
            disabled={pending}
            onChange={(e) => setType(e.target.value as MaintenanceType)}
            className={`${controlClasses} mt-1.5`}
          >
            {Object.entries(MAINTENANCE_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="mt-mode" className={labelClasses}>
            Ejecución
          </label>
          <select
            id="mt-mode"
            value={mode}
            disabled={pending}
            onChange={(e) => setMode(e.target.value as MaintenanceExecutionMode)}
            className={`${controlClasses} mt-1.5`}
          >
            {Object.entries(EXECUTION_MODE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        {mode === 'externa' && (
          <div>
            <label htmlFor="mt-supplier" className={labelClasses}>
              Proveedor externo
            </label>
            <select
              id="mt-supplier"
              value={supplierId}
              disabled={pending}
              onChange={(e) => setSupplierId(e.target.value)}
              className={`${controlClasses} mt-1.5`}
            >
              <option value="">Selecciona un proveedor…</option>
              {(suppliers?.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.external_supplier_id && <p className={errorClasses}>{errors.external_supplier_id}</p>}
          </div>
        )}
        <div>
          <label htmlFor="mt-notes" className={labelClasses}>
            Notas técnicas (opcional)
          </label>
          <textarea
            id="mt-notes"
            rows={3}
            value={notes}
            disabled={pending}
            onChange={(e) => setNotes(e.target.value)}
            className={`${controlClasses} mt-1.5 h-auto py-2`}
          />
        </div>
        {errors.equipment_unit_id && <p role="alert" className={errorClasses}>{errors.equipment_unit_id}</p>}
        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <DialogCloseButton disabled={pending}>Cancelar</DialogCloseButton>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Abrir mantención
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
