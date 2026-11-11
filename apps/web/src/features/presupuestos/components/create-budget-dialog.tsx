import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCareers, useCreateBudget } from '@sgia/api-client';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogCloseButton } from '@/components/ui/dialog';
import { formatCLP } from '@/features/compras/lib/format';
import {
  createBudgetSchema,
  type CreateBudgetValues,
} from '@/features/presupuestos/lib/budget-form-schema';
import { careerLabel } from '@/features/presupuestos/lib/budget-label';
import { apiErrorToMessage, apiFieldErrors } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import { FIELD_LABEL_CLASS } from '@/components/ui/typography';
import { FORM_CONTROL_CLASS } from '@/components/ui/form-control';

const inputClasses =
  FORM_CONTROL_CLASS;
const labelClasses = FIELD_LABEL_CLASS;
const errorClasses = 'mt-1 text-[11px] text-rose-600 dark:text-rose-400';

const toNumber = (v: unknown) =>
  v === '' || v === null || v === undefined ? Number.NaN : Number(v);

export function CreateBudgetDialog({
  open,
  onClose,
  defaultYear,
}: {
  open: boolean;
  onClose: () => void;
  defaultYear: number;
}) {
  const createBudget = useCreateBudget();
  const { data: careers } = useCareers({ per_page: 100 });
  const defaults: CreateBudgetValues = {
    career_id: Number.NaN,
    year: defaultYear,
    initial_amount: Number.NaN,
  };
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<CreateBudgetValues>({
    resolver: zodResolver(createBudgetSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (open)
      reset({
        career_id: Number.NaN,
        year: defaultYear,
        initial_amount: Number.NaN,
      });
  }, [open, defaultYear, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createBudget.mutateAsync(values);
      toast.success(`Presupuesto ${values.year} creado por ${formatCLP(values.initial_amount)}.`);
      onClose();
    } catch (error) {
      const fields = apiFieldErrors(error);
      // El duplicado carrera + año llega como 422; se muestra en el campo correspondiente.
      if (fields.career_id) setError('career_id', { message: fields.career_id });
      if (fields.year) setError('year', { message: fields.year });
      if (fields.initial_amount) setError('initial_amount', { message: fields.initial_amount });
      toast.error(apiErrorToMessage(error));
    }
  });

  const pending = createBudget.isPending;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      hasUnsavedChanges={isDirty}
      title="Nuevo presupuesto anual"
      description="Asigna el monto inicial de una carrera para el año. Las compras reservan contra él y las facturas lo consumen."
      className="max-w-md"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
        <div>
          <label htmlFor="budget-career" className={labelClasses}>
            Carrera
          </label>
          <select
            id="budget-career"
            {...register('career_id', { setValueAs: toNumber })}
            aria-invalid={Boolean(errors.career_id) || undefined}
            disabled={pending}
            className={`${inputClasses} mt-1.5`}
          >
            <option value="">Selecciona una carrera…</option>
            {(careers?.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {careerLabel({ career: c, career_id: c.id })}
              </option>
            ))}
          </select>
          {errors.career_id && <p className={errorClasses}>{errors.career_id.message}</p>}
        </div>
        <div className="grid grid-cols-[6rem_1fr] gap-3">
          <div>
            <label htmlFor="budget-year" className={labelClasses}>
              Año
            </label>
            <input
              id="budget-year"
              type="number"
              {...register('year', { setValueAs: toNumber })}
              aria-invalid={Boolean(errors.year) || undefined}
              disabled={pending}
              className={`${inputClasses} mt-1.5`}
            />
            {errors.year && <p className={errorClasses}>{errors.year.message}</p>}
          </div>
          <div>
            <label htmlFor="budget-amount" className={labelClasses}>
              Monto inicial (CLP)
            </label>
            <input
              id="budget-amount"
              type="number"
              min={1}
              placeholder="0"
              {...register('initial_amount', { setValueAs: toNumber })}
              aria-invalid={Boolean(errors.initial_amount) || undefined}
              disabled={pending}
              className={`${inputClasses} mt-1.5 text-right`}
            />
            {errors.initial_amount && (
              <p className={errorClasses}>{errors.initial_amount.message}</p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
          <DialogCloseButton disabled={pending}>Cancelar</DialogCloseButton>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Crear presupuesto
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
