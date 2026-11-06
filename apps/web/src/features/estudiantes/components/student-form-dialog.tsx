import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCareers, useCreateStudent, useUpdateStudent } from '@sgia/api-client';
import type { Student } from '@sgia/types';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogCloseButton } from '@/components/ui/dialog';
import {
  studentFormSchema,
  type StudentFormValues,
} from '@/features/estudiantes/lib/student-form-schema';
import { normalizeStoredRun } from '@/features/usuarios/lib/run';
import { apiErrorToMessage, apiFieldErrors } from '@/lib/api-error';
import { toast } from '@/lib/toast';

const inputClasses =
  'w-full h-8.5 rounded-md border border-border bg-surface px-3 font-mono text-xs text-text focus:border-text-muted focus:outline-none focus:ring-1 focus:ring-info disabled:opacity-50 aria-invalid:border-danger';
const labelClasses =
  'text-xs font-semibold uppercase tracking-wider text-text-muted font-mono';
const errorClasses = 'mt-1 text-xs text-danger';

const empty: StudentFormValues = { rut: '', full_name: '', email: '', career_id: null };

export function StudentFormDialog({
  open,
  onClose,
  student,
}: {
  open: boolean;
  onClose: () => void;
  student: Student | null;
}) {
  const isEdit = student !== null;
  const create = useCreateStudent();
  const update = useUpdateStudent();
  const { data: careers } = useCareers({ per_page: 100 });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<StudentFormValues>({ resolver: zodResolver(studentFormSchema), defaultValues: empty });

  useEffect(() => {
    if (!open) return;
    reset(
      student
        ? {
            rut: student.rut,
            full_name: student.full_name ?? '',
            email: student.email ?? '',
            career_id: student.career_id ?? null,
          }
        : empty,
    );
  }, [open, student, reset]);

  const pending = create.isPending || update.isPending;

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      rut: normalizeStoredRun(values.rut),
      full_name: values.full_name || null,
      email: values.email || null,
      career_id: values.career_id,
    };
    try {
      if (student) {
        await update.mutateAsync({ id: student.id, payload });
        toast.success('Estudiante actualizado');
      } else {
        await create.mutateAsync(payload);
        toast.success('Estudiante registrado');
      }
      onClose();
    } catch (error) {
      const fields = apiFieldErrors(error);
      if (fields.rut) setError('rut', { message: fields.rut });
      if (fields.email) setError('email', { message: fields.email });
      toast.error(apiErrorToMessage(error));
    }
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      hasUnsavedChanges={isDirty}
      title={isEdit ? 'Editar estudiante' : 'Nuevo estudiante'}
      description="El RUT se guarda normalizado (sin puntos) y es único."
      className="max-w-md"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
        <div>
          <label htmlFor="st-rut" className={labelClasses}>
            RUT
          </label>
          <input
            id="st-rut"
            placeholder="12.345.678-5"
            autoComplete="off"
            disabled={pending}
            aria-invalid={Boolean(errors.rut) || undefined}
            className={`${inputClasses} mt-1.5`}
            {...register('rut')}
          />
          {errors.rut && <p className={errorClasses}>{errors.rut.message}</p>}
        </div>
        <div>
          <label htmlFor="st-name" className={labelClasses}>
            Nombre completo (opcional)
          </label>
          <input
            id="st-name"
            disabled={pending}
            className={`${inputClasses} mt-1.5 font-sans`}
            {...register('full_name')}
          />
          {errors.full_name && <p className={errorClasses}>{errors.full_name.message}</p>}
        </div>
        <div>
          <label htmlFor="st-email" className={labelClasses}>
            Correo (opcional)
          </label>
          <input
            id="st-email"
            type="email"
            disabled={pending}
            aria-invalid={Boolean(errors.email) || undefined}
            className={`${inputClasses} mt-1.5`}
            {...register('email')}
          />
          {errors.email && <p className={errorClasses}>{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="st-career" className={labelClasses}>
            Carrera (opcional)
          </label>
          <select
            id="st-career"
            disabled={pending}
            className={`${inputClasses} mt-1.5`}
            {...register('career_id', { setValueAs: (v) => (v ? Number(v) : null) })}
          >
            <option value="">Sin carrera</option>
            {(careers?.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.code ? `${c.code} · ` : ''}
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <DialogCloseButton disabled={pending}>Cancelar</DialogCloseButton>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Guardar cambios' : 'Registrar estudiante'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
