import { login } from '@sgia/api-client';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { apiErrorToMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { tokenStorage } from '@/config/api';

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>();

  const onSubmit = handleSubmit(async (values) => {
    try {
      const usuario = await login(values, tokenStorage);
      toast.success(`Bienvenido, ${usuario.nombre}`);
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-lg border border-border bg-surface p-6"
      >
        <h1 className="mb-1 font-mono-tabular text-lg text-text">SGIA</h1>
        <p className="mb-6 text-sm text-text-muted">Ingresa tus credenciales</p>

        <label className="mb-4 block">
          <span className="mb-1 block text-sm text-text-muted">Correo</span>
          <input
            type="email"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
            placeholder="nombre@inacap.cl"
            {...register('email', { required: 'El correo es obligatorio' })}
          />
          {errors.email && <span className="mt-1 block text-xs text-danger">{errors.email.message}</span>}
        </label>

        <label className="mb-6 block">
          <span className="mb-1 block text-sm text-text-muted">Contraseña</span>
          <input
            type="password"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
            {...register('password', { required: 'La contraseña es obligatoria' })}
          />
          {errors.password && <span className="mt-1 block text-xs text-danger">{errors.password.message}</span>}
        </label>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </form>
    </div>
  );
}