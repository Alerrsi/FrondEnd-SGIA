import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useCreatePrestamo, useLocations, useStorerooms } from '@sgia/api-client';
import { Loader2, Send, Trash2 } from 'lucide-react';

import { CareerSelect } from '@/components/shared/career-select';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/context/auth-context';
import { CatalogPanel } from '@/features/profesor/components/catalog-panel';
import {
  initialLoanRequestValues,
  LOAN_REQUEST_SERVER_FIELDS,
  loanRequestSchema,
  toLoanRequestPayload,
  todayIso,
  type LoanRequestValues,
} from '@/features/profesor/lib/loan-request-schema';
import { apiErrorToMessage, apiFieldErrors } from '@/lib/api-error';
import { toast } from '@/lib/toast';

const inputClasses =
  'w-full h-8.5 rounded-md border border-border bg-surface px-3 font-mono text-xs text-text focus:border-text-muted focus:outline-none focus:ring-1 focus:ring-info disabled:opacity-50 aria-invalid:border-rose-400 dark:aria-invalid:border-rose-700';
const labelClasses =
  'text-xs font-semibold uppercase tracking-wider text-text-muted font-mono';
const errorClasses = 'mt-1 text-xs text-danger';
const toId = (v: unknown) => (v === '' || v == null ? Number.NaN : Number(v));

/** Nueva solicitud remota de préstamo: datos de la actividad, pañol, laboratorio e insumos. */
export function LoanRequestForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const create = useCreatePrestamo();
  const defaultStoreroom = user?.storeroom_id != null ? Number(user.storeroom_id) : null;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<LoanRequestValues>({
    resolver: zodResolver(loanRequestSchema),
    defaultValues: initialLoanRequestValues(defaultStoreroom),
  });
  const items = useFieldArray({ control, name: 'items' });

  const careerId = watch('career_id');
  const storeroomId = watch('storeroom_id');
  const storerooms = useStorerooms({ per_page: 100 }).data?.data ?? [];
  const hasStoreroom = Number.isFinite(storeroomId);
  // Laboratorios = salas y talleres del pañol elegido (el backend rechaza otros tipos).
  const locations = (
    useLocations({
      storeroom_id: hasStoreroom ? storeroomId : undefined,
      per_page: 100,
    }).data?.data ?? []
  ).filter((l) => l.tipo === 'sala' || l.tipo === 'taller');

  // Al cambiar de pañol el laboratorio elegido deja de ser válido.
  useEffect(() => {
    setValue('location_id', Number.NaN);
  }, [storeroomId, setValue]);

  const addedIds = new Set(items.fields.map((f) => f.product_id));

  const onSubmit = handleSubmit(async (values) => {
    try {
      const loan = await create.mutateAsync(toLoanRequestPayload(values));
      toast.success(
        `Solicitud ${loan.codigo ?? loan.code ?? ''} enviada al pañol. Lo preparará antes de la actividad.`,
      );
      navigate('/profesor/solicitudes');
    } catch (error) {
      // 422: cada mensaje junto a su campo (`items.{i}.quantity` trae el stock del pañol).
      const fieldErrors = apiFieldErrors(error);
      for (const field of LOAN_REQUEST_SERVER_FIELDS) {
        if (fieldErrors[field]) setError(field, { message: fieldErrors[field] });
      }
      for (const [key, message] of Object.entries(fieldErrors)) {
        const match = /^items\.(\d+)\.(quantity|product_id)$/.exec(key);
        if (match) setError(`items.${Number(match[1])}.quantity`, { message });
        else if (key === 'items') setError('items', { message });
      }
      toast.error(apiErrorToMessage(error));
    }
  });

  const pending = create.isPending;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <CatalogPanel addedIds={addedIds} onAdd={(item) => items.append({ ...item, quantity: 1 })} />

      <form
        onSubmit={onSubmit}
        noValidate
        className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4"
      >
        <h2 className="text-sm font-semibold text-text">
          Datos de la actividad
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="lr-teacher" className={labelClasses}>
              Profesor
            </label>
            <input
              id="lr-teacher"
              readOnly
              value={user?.nombre ?? user?.name ?? ''}
              className={`${inputClasses} mt-1.5 bg-background`}
            />
          </div>
          <div>
            <label htmlFor="lr-career" className={labelClasses}>
              Carrera
            </label>
            <CareerSelect
              id="lr-career"
              value={Number.isFinite(careerId) ? careerId : undefined}
              onChange={(id) =>
                setValue('career_id', id ?? Number.NaN, {
                  shouldValidate: true,
                })
              }
              invalid={Boolean(errors.career_id)}
              disabled={pending}
              className={`${inputClasses} mt-1.5`}
            />
            {errors.career_id && <p className={errorClasses}>{errors.career_id.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="lr-subject" className={labelClasses}>
            Asignatura
          </label>
          <input
            id="lr-subject"
            {...register('subject')}
            aria-invalid={Boolean(errors.subject) || undefined}
            disabled={pending}
            className={`${inputClasses} mt-1.5`}
          />
          {errors.subject && <p className={errorClasses}>{errors.subject.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="lr-date" className={labelClasses}>
              Fecha de actividad
            </label>
            <input
              id="lr-date"
              type="date"
              min={todayIso()}
              {...register('loan_date')}
              aria-invalid={Boolean(errors.loan_date) || undefined}
              disabled={pending}
              className={`${inputClasses} mt-1.5`}
            />
            {errors.loan_date && <p className={errorClasses}>{errors.loan_date.message}</p>}
          </div>
          <div>
            <label htmlFor="lr-due" className={labelClasses}>
              Devolución (opcional)
            </label>
            <input
              id="lr-due"
              type="date"
              min={watch('loan_date') || todayIso()}
              {...register('due_date')}
              aria-invalid={Boolean(errors.due_date) || undefined}
              disabled={pending}
              className={`${inputClasses} mt-1.5`}
            />
            {errors.due_date ? (
              <p className={errorClasses}>{errors.due_date.message}</p>
            ) : (
              <p className="mt-1 text-xs text-text-muted">Si lo dejas vacío, el mismo día.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="lr-start" className={labelClasses}>
              Hora inicio
            </label>
            <input
              id="lr-start"
              type="time"
              {...register('start_time')}
              aria-invalid={Boolean(errors.start_time) || undefined}
              disabled={pending}
              className={`${inputClasses} mt-1.5`}
            />
            {errors.start_time && <p className={errorClasses}>{errors.start_time.message}</p>}
          </div>
          <div>
            <label htmlFor="lr-end" className={labelClasses}>
              Hora término
            </label>
            <input
              id="lr-end"
              type="time"
              {...register('end_time')}
              aria-invalid={Boolean(errors.end_time) || undefined}
              disabled={pending}
              className={`${inputClasses} mt-1.5`}
            />
            {errors.end_time && <p className={errorClasses}>{errors.end_time.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="lr-storeroom" className={labelClasses}>
              Pañol a solicitar
            </label>
            <select
              id="lr-storeroom"
              value={hasStoreroom ? storeroomId : ''}
              onChange={(e) =>
                setValue('storeroom_id', toId(e.target.value), {
                  shouldValidate: true,
                })
              }
              aria-invalid={Boolean(errors.storeroom_id) || undefined}
              disabled={pending}
              className={`${inputClasses} mt-1.5`}
            >
              <option value="">Selecciona…</option>
              {storerooms.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.storeroom_id && <p className={errorClasses}>{errors.storeroom_id.message}</p>}
          </div>
          <div>
            <label htmlFor="lr-location" className={labelClasses}>
              Laboratorio
            </label>
            <select
              id="lr-location"
              {...register('location_id', { setValueAs: toId })}
              aria-invalid={Boolean(errors.location_id) || undefined}
              disabled={pending || !hasStoreroom}
              className={`${inputClasses} mt-1.5`}
            >
              <option value="">{hasStoreroom ? 'Selecciona…' : 'Elige primero el pañol'}</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre}
                </option>
              ))}
            </select>
            {errors.location_id && <p className={errorClasses}>{errors.location_id.message}</p>}
          </div>
        </div>

        <fieldset className="flex flex-col gap-2 rounded-md border border-border p-3">
          <legend className={`${labelClasses} px-1`}>Lista de insumos</legend>
          {items.fields.length === 0 ? (
            <p className="text-xs text-text-muted">Agrega productos desde el catálogo.</p>
          ) : (
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="font-mono text-xs uppercase tracking-wider text-text-muted">
                  <th className="py-1 font-medium">Producto</th>
                  <th className="w-24 py-1 font-medium">Cantidad</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {items.fields.map((field, index) => {
                  const rowError = errors.items?.[index]?.quantity;
                  return (
                    <tr key={field.id} className="align-top">
                      <td className="py-1.5 pr-2 text-text">
                        {field.name}
                        <span className="ml-1 font-mono text-xs text-text-muted">
                          ({field.available} disp.)
                        </span>
                      </td>
                      <td className="py-1.5">
                        <input
                          type="number"
                          min={1}
                          max={field.available}
                          aria-label={`Cantidad de ${field.name}`}
                          {...register(`items.${index}.quantity`, {
                            valueAsNumber: true,
                          })}
                          aria-invalid={Boolean(rowError) || undefined}
                          disabled={pending}
                          className={inputClasses}
                        />
                        {rowError && <p className={errorClasses}>{rowError.message}</p>}
                      </td>
                      <td className="py-1.5 pl-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Quitar ${field.name}`}
                          disabled={pending}
                          onClick={() => items.remove(index)}
                        >
                          <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {errors.items?.message && <p className={errorClasses}>{errors.items.message}</p>}
          {errors.items?.root?.message && (
            <p className={errorClasses}>{errors.items.root.message}</p>
          )}
        </fieldset>

        <div>
          <label htmlFor="lr-notes" className={labelClasses}>
            Notas (opcional)
          </label>
          <textarea
            id="lr-notes"
            {...register('notes')}
            disabled={pending}
            rows={2}
            className={`${inputClasses} mt-1.5 h-auto py-1.5 font-sans`}
          />
          {errors.notes && <p className={errorClasses}>{errors.notes.message}</p>}
        </div>

        <div className="flex justify-end border-t border-border pt-3">
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Send aria-hidden="true" className="h-4 w-4" />}
            Enviar solicitud
          </Button>
        </div>
      </form>
    </div>
  );
}
