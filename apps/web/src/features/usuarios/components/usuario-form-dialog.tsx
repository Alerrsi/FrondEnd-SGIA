import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateUsuario, useUpdateUsuario } from '@sgia/api-client';
import {
  ROLES,
  ROLE_LABELS,
  type CreateUsuarioPayload,
  type RoleCode,
  type UsuarioSinPassword,
} from '@sgia/types';
import { Loader2, Lock, Shield, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import { normalizeStoredRun, validateRun } from '../lib/run';

interface FormValues {
  run: string;
  nombre: string;
  email: string;
  rol: RoleCode;
  area: string;
  password: string;
}

const inputClasses =
  'w-full h-8.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 font-mono text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-colors focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 disabled:opacity-50';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="mt-1 block text-xs text-red-600 dark:text-red-400 font-medium">{message}</span>;
}

function Label({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
    >
      {children}
    </label>
  );
}

export function UsuarioFormDialog({
  open,
  onClose,
  usuario,
}: {
  open: boolean;
  onClose: () => void;
  usuario: UsuarioSinPassword | null;
}) {
  const esEdicion = usuario !== null;
  const createUsuario = useCreateUsuario();
  const updateUsuario = useUpdateUsuario();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      run: '',
      nombre: '',
      email: '',
      rol: 'AD-01',
      area: '',
      password: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        run: usuario?.run ?? '',
        nombre: usuario?.nombre ?? usuario?.name ?? '',
        email: usuario?.email ?? '',
        rol: usuario?.rol ?? usuario?.role ?? 'AD-01',
        area: usuario?.area ?? '',
        password: '',
      });
    }
  }, [open, usuario, reset]);

  const isPending = createUsuario.isPending || updateUsuario.isPending;

  const onSubmit = handleSubmit(
    async (values) => {
      try {
        if (esEdicion && usuario) {
          const updatePayload: Record<string, any> = {
            nombre: values.nombre.trim(),
            name: values.nombre.trim(),
            email: values.email.trim(),
            rol: values.rol,
            role: values.rol,
            area: values.area.trim() || null,
          };
          if (values.password && values.password.trim()) {
            updatePayload.password = values.password;
            updatePayload.password_confirmation = values.password;
          }
          await updateUsuario.mutateAsync({
            id: usuario.id,
            payload: updatePayload,
          });
          toast.success('Usuario actualizado correctamente');
        } else {
          const payload: CreateUsuarioPayload = {
            run: normalizeStoredRun(values.run.trim()),
            nombre: values.nombre.trim(),
            name: values.nombre.trim(),
            email: values.email.trim(),
            rol: values.rol,
            role: values.rol,
            area: values.area.trim() || undefined,
            password: values.password,
            password_confirmation: values.password,
          };
          await createUsuario.mutateAsync(payload);
          toast.success('Usuario creado correctamente');
        }
        onClose();
      } catch (error) {
        toast.error(apiErrorToMessage(error));
      }
    },
    (formErrors) => {
      const firstError = Object.values(formErrors)[0];
      if (firstError?.message) {
        toast.error(String(firstError.message));
      }
    },
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={esEdicion ? 'Editar usuario' : 'Nuevo usuario'}
      description={
        esEdicion
          ? 'Actualiza los datos del usuario. El RUN no se puede modificar.'
          : 'Crea una cuenta de acceso para el panel web o la app móvil.'
      }
      className="max-w-lg"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4 text-zinc-900 dark:text-zinc-100" noValidate>
        {/* Fieldset: Identificación Personal */}
        <fieldset className="rounded-md border border-zinc-200 dark:border-zinc-800 p-3 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/50">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 inline-flex items-center gap-1.5 font-mono">
            <User className="h-3.5 w-3.5 text-zinc-400" />
            Identificación de Usuario
          </legend>

          <div>
            <Label htmlFor="usuario-run">RUN</Label>
            <input
              id="usuario-run"
              type="text"
              inputMode="text"
              autoComplete="off"
              disabled={isPending || esEdicion}
              placeholder="12.345.678-9"
              className={inputClasses}
              {...register('run', {
                validate: (value) => {
                  if (esEdicion) return true;
                  const trimmed = (value ?? '').trim();
                  if (!trimmed) return 'El RUN es obligatorio';
                  return validateRun(trimmed) || 'Ingresa un RUN chileno válido, ej. 12.345.678-9';
                },
              })}
            />
            <FieldError message={errors.run?.message} />
            {esEdicion && (
              <span className="mt-1 block text-xs text-zinc-400 dark:text-zinc-500 font-mono">
                El RUN se mantiene como identificación única del usuario.
              </span>
            )}
          </div>

          <div>
            <Label htmlFor="usuario-nombre">Nombre completo</Label>
            <input
              id="usuario-nombre"
              type="text"
              autoComplete="name"
              disabled={isPending}
              placeholder="Nombre Apellido"
              className={inputClasses}
              {...register('nombre', {
                required: 'El nombre es obligatorio',
                validate: (value) => {
                  const trimmed = (value ?? '').trim();
                  if (!trimmed) return 'El nombre es obligatorio';
                  if (trimmed.length < 2) return 'El nombre debe tener al menos 2 caracteres';
                  return true;
                },
              })}
            />
            <FieldError message={errors.nombre?.message} />
          </div>

          <div>
            <Label htmlFor="usuario-email">Correo institucional</Label>
            <input
              id="usuario-email"
              type="email"
              autoComplete="email"
              disabled={isPending}
              placeholder="usuario@inacap.cl"
              className={inputClasses}
              {...register('email', {
                required: 'El correo electrónico es obligatorio',
                validate: (value) => {
                  const trimmed = (value ?? '').trim();
                  if (!trimmed) return 'El correo electrónico es obligatorio';
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
                    return 'Formato de correo inválido (ejemplo: usuario@inacap.cl)';
                  }
                  return true;
                },
              })}
            />
            <FieldError message={errors.email?.message} />
          </div>
        </fieldset>

        {/* Fieldset: Rol y Dependencia */}
        <fieldset className="rounded-md border border-zinc-200 dark:border-zinc-800 p-3 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/50">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 inline-flex items-center gap-1.5 font-mono">
            <Shield className="h-3.5 w-3.5 text-zinc-400" />
            Rol y Dependencia Institucional
          </legend>

          <div>
            <Label htmlFor="usuario-rol">Rol</Label>
            <select
              id="usuario-rol"
              disabled={isPending}
              className={inputClasses}
              {...register('rol', { required: 'Selecciona un rol' })}
            >
              {ROLES.map((rol) => (
                <option key={rol} value={rol}>
                  {ROLE_LABELS[rol]}
                </option>
              ))}
            </select>
            <FieldError message={errors.rol?.message} />
          </div>

          <div>
            <Label htmlFor="usuario-area">Área o Departamento (opcional)</Label>
            <input
              id="usuario-area"
              type="text"
              disabled={isPending}
              placeholder="Informática, Telecomunicaciones, etc."
              className={inputClasses}
              {...register('area')}
            />
            <FieldError message={errors.area?.message} />
          </div>
        </fieldset>

        {/* Fieldset: Credenciales */}
        <fieldset className="rounded-md border border-zinc-200 dark:border-zinc-800 p-3 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/50">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 inline-flex items-center gap-1.5 font-mono">
            <Lock className="h-3.5 w-3.5 text-zinc-400" />
            Credenciales de Acceso
          </legend>

          {esEdicion ? (
            <div>
              <Label htmlFor="usuario-password">Nueva contraseña (opcional)</Label>
              <input
                id="usuario-password"
                type="password"
                autoComplete="new-password"
                disabled={isPending}
                placeholder="Dejar en blanco para mantener la actual"
                className={inputClasses}
                {...register('password', {
                  validate: (value) => {
                    if (!value) return true;
                    if (value.length < 8) return 'La nueva contraseña debe tener al menos 8 caracteres';
                    return true;
                  },
                })}
              />
              <FieldError message={errors.password?.message} />
            </div>
          ) : (
            <div>
              <Label htmlFor="usuario-password">Contraseña inicial</Label>
              <input
                id="usuario-password"
                type="password"
                autoComplete="new-password"
                disabled={isPending}
                placeholder="Mínimo 8 caracteres"
                className={inputClasses}
                {...register('password', {
                  required: 'La contraseña es obligatoria',
                  minLength: { value: 8, message: 'La contraseña debe tener al menos 8 caracteres' },
                })}
              />
              <FieldError message={errors.password?.message} />
            </div>
          )}
        </fieldset>

        <div className="mt-1 flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending} className="text-xs">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isPending} className="min-w-28 text-xs">
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {esEdicion ? 'Guardar cambios' : 'Crear usuario'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
