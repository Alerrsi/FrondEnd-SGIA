import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useChangePassword } from '@sgia/api-client';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogCloseButton } from '@/components/ui/dialog';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';

const schema = z
  .object({
    current_password: z.string().min(1, 'Ingresa tu contraseña actual.'),
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres.')
      .regex(/[A-Za-z]/, 'Debe incluir letras.')
      .regex(/\d/, 'Debe incluir números.'),
    password_confirmation: z.string(),
  })
  .refine((v) => v.password === v.password_confirmation, {
    path: ['password_confirmation'],
    message: 'La confirmación no coincide.',
  });

type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = { current_password: '', password: '', password_confirmation: '' };

const inputClasses =
  'w-full h-8.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 font-mono text-xs text-zinc-800 dark:text-zinc-200 transition-colors focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 disabled:opacity-50';

const FIELDS: Array<{ name: keyof FormValues; label: string; autoComplete: string }> = [
  { name: 'current_password', label: 'Contraseña actual', autoComplete: 'current-password' },
  { name: 'password', label: 'Contraseña nueva', autoComplete: 'new-password' },
  { name: 'password_confirmation', label: 'Confirmar contraseña nueva', autoComplete: 'new-password' },
];

export function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const changePassword = useChangePassword();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await changePassword.mutateAsync(values);
      toast.success('Contraseña actualizada. Se cerraron tus otras sesiones.');
      onClose();
    } catch (error) {
      const message = apiErrorToMessage(error);
      setError('current_password', { message });
      toast.error(message);
    }
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      hasUnsavedChanges={isDirty}
      title="Cambiar contraseña"
      description="Mínimo 8 caracteres con letras y números. Se cerrarán tus sesiones en otros dispositivos."
      className="max-w-md"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3 text-zinc-900 dark:text-zinc-100" noValidate>
        {FIELDS.map(({ name, label, autoComplete }) => (
          <div key={name}>
            <label
              htmlFor={`pw-${name}`}
              className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
            >
              {label}
            </label>
            <input
              id={`pw-${name}`}
              type="password"
              autoComplete={autoComplete}
              disabled={changePassword.isPending}
              aria-invalid={Boolean(errors[name])}
              className={inputClasses}
              {...register(name)}
            />
            {errors[name]?.message && (
              <span className="mt-1 block text-xs font-medium text-red-600 dark:text-red-400" role="alert">
                {errors[name]?.message}
              </span>
            )}
          </div>
        ))}

        <div className="mt-1 flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
          <DialogCloseButton disabled={changePassword.isPending} className="text-xs">
            Cancelar
          </DialogCloseButton>
          <Button type="submit" variant="primary" disabled={changePassword.isPending} className="min-w-28 text-xs">
            {changePassword.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Cambiar contraseña
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
