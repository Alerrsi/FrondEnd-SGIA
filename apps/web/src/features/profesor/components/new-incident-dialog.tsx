import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateIncidentReport, useEquipmentUnitByCode, useLocations } from '@sgia/api-client';
import { INCIDENT_PROBLEM_LABELS } from '@sgia/types';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogCloseButton } from '@/components/ui/dialog';
import { SignaturePad } from '@/features/profesor/components/signature-pad';
import {
  incidentFormSchema,
  initialIncidentValues,
  toIncidentPayload,
  todayIso,
  type IncidentFormValues,
} from '@/features/profesor/lib/incident-form-schema';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';

const inputClasses =
  'w-full h-8.5 rounded-md border border-border bg-surface px-3 font-mono text-xs text-text focus:border-text-muted focus:outline-none focus:ring-1 focus:ring-info disabled:opacity-50 aria-invalid:border-danger dark:aria-invalid:border-danger';
const labelClasses =
  'text-xs font-semibold uppercase tracking-wider text-text-muted font-mono';
const errorClasses = 'mt-1 text-xs text-danger';

interface NewIncidentDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (code: string | null | undefined) => void;
}

/** Informe de novedades del docente (réplica del formulario en papel). */
export function NewIncidentDialog({ open, onClose, onCreated }: NewIncidentDialogProps) {
  const create = useCreateIncidentReport();
  const locations = useLocations({ per_page: 100 }).data?.data ?? [];
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: initialIncidentValues(),
  });

  useEffect(() => {
    if (open) {
      reset(initialIncidentValues());
      setLookupCode(undefined);
    }
  }, [open, reset]);

  const problems = watch('problems');
  // Vista previa del equipo al salir del campo; si es un insumo (404) se envía igual.
  const [lookupCode, setLookupCode] = useState<string | undefined>();
  const unit = useEquipmentUnitByCode(lookupCode);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const report = await create.mutateAsync(toIncidentPayload(values));
      toast.success('Informe enviado al pañol.');
      onCreated(report.code);
      onClose();
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    }
  });

  const pending = create.isPending;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Nuevo informe de novedades"
      description="Reporta fallas, faltantes o problemas ocurridos en un laboratorio."
      className="max-h-[92vh] max-w-2xl overflow-y-auto"
      hasUnsavedChanges={() => isDirty}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="inc-subject" className={labelClasses}>
              Asignatura
            </label>
            <input
              id="inc-subject"
              {...register('subject')}
              aria-invalid={Boolean(errors.subject) || undefined}
              disabled={pending}
              className={`${inputClasses} mt-1.5`}
            />
            {errors.subject && <p className={errorClasses}>{errors.subject.message}</p>}
          </div>
          <div>
            <label htmlFor="inc-date" className={labelClasses}>
              Fecha
            </label>
            <input
              id="inc-date"
              type="date"
              max={todayIso()}
              {...register('report_date')}
              aria-invalid={Boolean(errors.report_date) || undefined}
              disabled={pending}
              className={`${inputClasses} mt-1.5`}
            />
            {errors.report_date && <p className={errorClasses}>{errors.report_date.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="inc-location" className={labelClasses}>
              Laboratorio
            </label>
            <select
              id="inc-location"
              {...register('location_id', {
                setValueAs: (v) => (v === '' || v == null ? Number.NaN : Number(v)),
              })}
              aria-invalid={Boolean(errors.location_id) || undefined}
              disabled={pending}
              className={`${inputClasses} mt-1.5`}
            >
              <option value="">Selecciona…</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre}
                </option>
              ))}
            </select>
            {errors.location_id && <p className={errorClasses}>{errors.location_id.message}</p>}
          </div>
          <div>
            <label htmlFor="inc-code" className={labelClasses}>
              Código del equipo (opcional)
            </label>
            <input
              id="inc-code"
              {...register('equipment_code', {
                onBlur: (e) => setLookupCode(e.target.value.trim() || undefined),
              })}
              disabled={pending}
              placeholder="PRO-ISD-000001"
              className={`${inputClasses} mt-1.5`}
            />
            {lookupCode && unit.data && (
              <p className="mt-1 text-xs text-text-muted">
                {unit.data.product?.name ?? 'Equipo'} · <span className="font-mono">{unit.data.code}</span>
              </p>
            )}
            {lookupCode && unit.isError && (
              <p className="mt-1 text-xs text-text-muted">
                Sin vista previa (puede ser un insumo); se enviará igual.
              </p>
            )}
          </div>
        </div>

        <fieldset className="flex flex-col gap-2 rounded-md border border-border p-3">
          <legend className={`${labelClasses} px-1`}>Problemas</legend>
          {problems.map((problem, index) => {
            const rowError = errors.problems?.[index]?.description;
            return (
              <div key={problem.type} className="flex flex-col gap-1">
                <label className="flex items-center gap-2 text-xs text-text">
                  <input
                    type="checkbox"
                    {...register(`problems.${index}.checked`)}
                    disabled={pending}
                  />
                  {INCIDENT_PROBLEM_LABELS[problem.type]}
                </label>
                {problem.checked && (
                  <>
                    <textarea
                      {...register(`problems.${index}.description`)}
                      aria-label={`Descripción: ${INCIDENT_PROBLEM_LABELS[problem.type]}`}
                      aria-invalid={Boolean(rowError) || undefined}
                      disabled={pending}
                      rows={2}
                      className={`${inputClasses} h-auto py-1.5 font-sans`}
                    />
                    {rowError && <p className={errorClasses}>{rowError.message}</p>}
                  </>
                )}
              </div>
            );
          })}
          {typeof errors.problems?.message === 'string' && (
            <p className={errorClasses}>{errors.problems.message}</p>
          )}
          {errors.problems?.root?.message && (
            <p className={errorClasses}>{errors.problems.root.message}</p>
          )}
        </fieldset>

        <div>
          <label htmlFor="inc-suggestion" className={labelClasses}>
            Sugerencia (opcional)
          </label>
          <textarea
            id="inc-suggestion"
            {...register('suggestion')}
            disabled={pending}
            rows={2}
            className={`${inputClasses} mt-1.5 h-auto py-1.5 font-sans`}
          />
        </div>

        <div>
          <label htmlFor="inc-photo" className={labelClasses}>
            Foto de evidencia (opcional)
          </label>
          <input
            id="inc-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={pending}
            onChange={(e) =>
              setValue('evidence_photo', e.target.files?.[0] ?? null, { shouldValidate: true })
            }
            className="mt-1.5 block w-full text-xs text-text-muted"
          />
          {errors.evidence_photo && (
            <p className={errorClasses}>{errors.evidence_photo.message}</p>
          )}
        </div>

        <div>
          <span className={labelClasses}>Firma del docente</span>
          <div className="mt-1.5">
            <Controller
              name="signature"
              control={control}
              render={({ field }) => (
                <SignaturePad
                  onChange={(dataUrl) => field.onChange(dataUrl)}
                  invalid={Boolean(errors.signature)}
                />
              )}
            />
          </div>
          {errors.signature && <p className={errorClasses}>{errors.signature.message}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <DialogCloseButton disabled={pending}>Cancelar</DialogCloseButton>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
            Enviar informe
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
