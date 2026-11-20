import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useUpdateLocation } from '@sgia/api-client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogCloseButton, DialogFooter } from '@/components/ui/dialog';
import { FORM_CONTROL_CLASS } from '@/components/ui/form-control';
import { FIELD_LABEL_CLASS } from '@/components/ui/typography';
import { apiErrorToMessage, apiFieldErrors } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import { cmToMeters, metersToCm, salaDimensionesSchema, type SalaDimensionesValues } from '../lib/map-forms';
import { FieldError } from './field-error';

export interface SalaDimensionesDialogProps {
  open: boolean;
  onClose: () => void;
  locationId: number;
  nombre: string;
  widthCm: number;
  heightCm: number;
}

/** Medidas reales de la sala en metros (la API las guarda en cm). Achicar con muebles afuera responde 422. */
export function SalaDimensionesDialog({ open, onClose, locationId, nombre, widthCm, heightCm }: SalaDimensionesDialogProps) {
  const updateLocation = useUpdateLocation();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<SalaDimensionesValues>({ resolver: zodResolver(salaDimensionesSchema) });

  useEffect(() => {
    if (open) reset({ width: cmToMeters(widthCm), height: cmToMeters(heightCm) });
  }, [open, widthCm, heightCm, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateLocation.mutateAsync({
        id: locationId,
        payload: { map_width_cm: metersToCm(values.width), map_height_cm: metersToCm(values.height) },
      });
      toast.success(`Medidas de ${nombre} guardadas`);
      onClose();
    } catch (error) {
      const fields = apiFieldErrors(error);
      if (fields.map_width_cm) setError('width', { message: fields.map_width_cm });
      if (fields.map_height_cm) setError('height', { message: fields.map_height_cm });
      toast.error(apiErrorToMessage(error));
    }
  });

  return (
    <Dialog open={open} onClose={onClose} size="sm" hasUnsavedChanges={isDirty} title="Medidas de la sala" description={`Ancho y largo interior de ${nombre}, en metros.`}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="sala-width" className={FIELD_LABEL_CLASS}>Ancho (m) *</label>
            <input id="sala-width" type="number" inputMode="decimal" step={0.1} min={1} max={100} className={FORM_CONTROL_CLASS} {...register('width', { valueAsNumber: true })} />
            <FieldError message={errors.width?.message} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="sala-height" className={FIELD_LABEL_CLASS}>Largo (m) *</label>
            <input id="sala-height" type="number" inputMode="decimal" step={0.1} min={1} max={100} className={FORM_CONTROL_CLASS} {...register('height', { valueAsNumber: true })} />
            <FieldError message={errors.height?.message} />
          </div>
        </div>
        <DialogFooter>
          <DialogCloseButton disabled={updateLocation.isPending}>Cancelar</DialogCloseButton>
          <Button type="submit" size="sm" disabled={updateLocation.isPending}>
            {updateLocation.isPending && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
            Guardar medidas
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
