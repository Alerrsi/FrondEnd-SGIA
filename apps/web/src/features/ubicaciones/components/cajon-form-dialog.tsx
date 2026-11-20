import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useCreateCajon, useEstantes } from '@sgia/api-client';
import type { LocationEntity } from '@sgia/types';

import { Button } from '@/components/ui/button';
import { Dialog, DialogCloseButton, DialogFooter } from '@/components/ui/dialog';
import { FORM_CONTROL_CLASS } from '@/components/ui/form-control';
import { CODE_CHIP_CLASS, FIELD_LABEL_CLASS } from '@/components/ui/typography';
import { apiErrorToMessage, apiFieldErrors } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import {
  CAJON_CODE_MAX,
  cajonFullCode,
  normalizeCajonCode,
} from '@/features/ubicaciones/lib/location-code';

const cajonFormSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(1, 'El código del cajón es obligatorio')
    .refine((value) => normalizeCajonCode(value) !== '', 'El código debe tener letras o números')
    .refine(
      (value) => normalizeCajonCode(value).length <= CAJON_CODE_MAX,
      `El código del cajón no puede pasar de ${CAJON_CODE_MAX} caracteres`,
    ),
  descripcion: z.string(),
  /** REQ-22: estante del mapa de la sala (opcional). */
  estante_id: z.string(),
});

type CajonFormValues = z.infer<typeof cajonFormSchema>;

const EMPTY: CajonFormValues = { codigo: '', descripcion: '', estante_id: '' };

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="text-xs font-medium text-danger">{message}</span>;
}

/** Alta de un cajón o gaveta en la sala, con la vista previa del código que irá en su etiqueta. */
export function CajonFormDialog({
  open,
  onClose,
  location,
}: {
  open: boolean;
  onClose: () => void;
  location: LocationEntity;
}) {
  const createCajon = useCreateCajon();
  const estantes = useEstantes({ location_id: location.id, per_page: 200 }, open);
  const isPending = createCajon.isPending;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<CajonFormValues>({
    resolver: zodResolver(cajonFormSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  const codigo = useWatch({ control, name: 'codigo' });
  const normalized = normalizeCajonCode(codigo);
  const tooLong = normalized.length > CAJON_CODE_MAX;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createCajon.mutateAsync({
        location_id: location.id,
        codigo: values.codigo.trim(),
        descripcion: values.descripcion.trim() || undefined,
        estante_id: values.estante_id ? Number(values.estante_id) : undefined,
      });
      toast.success('Cajón / gaveta agregada');
      onClose();
    } catch (error) {
      const fieldErrors = apiFieldErrors(error);
      if (fieldErrors.codigo) setError('codigo', { message: fieldErrors.codigo });
      if (fieldErrors.estante_id) setError('estante_id', { message: fieldErrors.estante_id });
      toast.error(apiErrorToMessage(error));
    }
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      hasUnsavedChanges={isDirty}
      title="Nuevo cajón / gaveta"
      description={`Añade un compartimiento a ${location.nombre}.`}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1">
          <label htmlFor="cajon-codigo" className={FIELD_LABEL_CLASS}>
            Código / identificador del cajón *
          </label>
          <input
            id="cajon-codigo"
            placeholder="Ej. rack R1, gaveta B-4, estante 1…"
            autoComplete="off"
            className={FORM_CONTROL_CLASS}
            aria-invalid={errors.codigo || tooLong ? true : undefined}
            aria-describedby="cajon-codigo-preview"
            {...register('codigo')}
          />
          <div id="cajon-codigo-preview" className="flex flex-col gap-1" aria-live="polite">
            {normalized !== '' && (
              <span className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                Código:
                <span className={CODE_CHIP_CLASS} data-testid="cajon-code-preview">
                  {cajonFullCode(location.code, codigo)}
                </span>
              </span>
            )}
            {tooLong ? (
              <span className="text-xs font-medium text-danger" role="alert">
                El código del cajón tiene {normalized.length} caracteres; el máximo es {CAJON_CODE_MAX}{' '}
                para que quepa en la etiqueta.
              </span>
            ) : (
              <FieldError message={errors.codigo?.message} />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="cajon-descripcion" className={FIELD_LABEL_CLASS}>
            Descripción (opcional)
          </label>
          <input
            id="cajon-descripcion"
            placeholder="Ej. cables HDMI y adaptadores VGA"
            className={FORM_CONTROL_CLASS}
            {...register('descripcion')}
          />
        </div>

        {(estantes.data?.data.length ?? 0) > 0 && (
          <div className="flex flex-col gap-1">
            <label htmlFor="cajon-estante" className={FIELD_LABEL_CLASS}>
              Estante del mapa (opcional)
            </label>
            <select id="cajon-estante" className={FORM_CONTROL_CLASS} {...register('estante_id')}>
              <option value="">Sin estante</option>
              {estantes.data?.data.map((estante) => (
                <option key={estante.id} value={estante.id}>
                  {estante.nombre ? `${estante.codigo} · ${estante.nombre}` : estante.codigo}
                </option>
              ))}
            </select>
            <FieldError message={errors.estante_id?.message} />
          </div>
        )}

        <DialogFooter>
          <DialogCloseButton disabled={isPending}>Cancelar</DialogCloseButton>
          <Button type="submit" size="sm" disabled={isPending || tooLong}>
            {isPending && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
            Guardar cajón
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
