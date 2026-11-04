import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateBudget } from '@sgia/api-client';
import type { BudgetSummaryRow } from '@sgia/types';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogCloseButton } from '@/components/ui/dialog';
import { formatCLP } from '@/features/compras/lib/format';
import {
  buildUpdateBudgetSchema,
  type UpdateBudgetValues,
} from '@/features/presupuestos/lib/budget-form-schema';
import { careerLabel } from '@/features/presupuestos/lib/budget-label';
import { apiErrorToMessage, apiFieldErrors } from '@/lib/api-error';
import { toast } from '@/lib/toast';

const inputClasses =
  'w-full h-8.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 font-mono text-xs text-zinc-800 dark:text-zinc-200 transition-colors focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 disabled:opacity-50 aria-invalid:border-rose-400 dark:aria-invalid:border-rose-700';
const labelClasses =
  'text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono';
const errorClasses = 'mt-1 text-[11px] text-rose-600 dark:text-rose-400';

const toNumber = (v: unknown) =>
  v === '' || v === null || v === undefined ? Number.NaN : Number(v);

export function EditBudgetDialog({
  open,
  onClose,
  budget,
}: {
  open: boolean;
  onClose: () => void;
  budget: BudgetSummaryRow;
}) {
  const updateBudget = useUpdateBudget();
  const committed = budget.consumed_amount + budget.reserved_amount;
  const schema = useMemo(() => buildUpdateBudgetSchema(committed), [committed]);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<UpdateBudgetValues>({
    resolver: zodResolver(schema),
    defaultValues: { initial_amount: budget.initial_amount },
  });

  useEffect(() => {
    if (open) reset({ initial_amount: budget.initial_amount });
  }, [open, budget.initial_amount, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateBudget.mutateAsync({ id: budget.id, payload: values });
      toast.success(`Monto inicial actualizado a ${formatCLP(values.initial_amount)}.`);
      onClose();
    } catch (error) {
      setError('initial_amount', {
        message: apiFieldErrors(error).initial_amount ?? apiErrorToMessage(error),
      });
      toast.error(apiErrorToMessage(error));
    }
  });

  const pending = updateBudget.isPending;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      hasUnsavedChanges={isDirty}
      title={`Editar presupuesto ${budget.year}`}
      description={`${careerLabel(budget)}. Se registrará un movimiento de ajuste en el historial.`}
      className="max-w-md"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
        <dl className="grid grid-cols-2 gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 p-3 text-xs">
          <div>
            <dt className="text-zinc-500">Consumido</dt>
            <dd className="font-mono">{formatCLP(budget.consumed_amount)}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Reservado</dt>
            <dd className="font-mono">{formatCLP(budget.reserved_amount)}</dd>
          </div>
        </dl>
        <div>
          <label htmlFor="budget-edit-amount" className={labelClasses}>
            Monto inicial (CLP)
          </label>
          <input
            id="budget-edit-amount"
            type="number"
            min={committed}
            {...register('initial_amount', { setValueAs: toNumber })}
            aria-invalid={Boolean(errors.initial_amount) || undefined}
            disabled={pending}
            className={`${inputClasses} mt-1.5 text-right`}
          />
          {errors.initial_amount && <p className={errorClasses}>{errors.initial_amount.message}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
          <DialogCloseButton disabled={pending}>Cancelar</DialogCloseButton>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
