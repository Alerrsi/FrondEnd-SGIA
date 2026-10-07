import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Boxes,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Smartphone,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/context/auth-context';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import { canAccessRoute, getRoleDefaultPath } from '../types/roles';

interface LoginFormValues {
  email: string;
  password: string;
}

const inputClasses =
  'w-full h-8.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 font-mono text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-colors focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 disabled:opacity-50';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setAuthError(null);
    try {
      const usuario = await login({
        email: values.email.trim(),
        password: values.password,
        device_name: 'web',
      });
      toast.success(`Bienvenido/a, ${usuario.nombre}`);

      const stateFrom = (location.state as { from?: { pathname?: string } })?.from?.pathname;
      const destination =
        stateFrom && stateFrom !== '/login' && canAccessRoute(usuario.rol, stateFrom)
          ? stateFrom
          : getRoleDefaultPath(usuario.rol);

      navigate(destination, { replace: true });
    } catch (error) {
      const message = apiErrorToMessage(error);
      setAuthError(message);
      toast.error(message);
    }
  });

  const handleQuickFill = (email: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', 'Admin1234!', { shouldValidate: true });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-950 px-4 py-8 text-zinc-900 dark:text-zinc-100">
      <div className="w-full max-w-sm">
        {/* Header / Logo */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
            <Boxes className="h-6 w-6 text-zinc-800 dark:text-zinc-200" />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-red-600 dark:text-red-400 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600 dark:bg-red-500 animate-pulse" />
            SEDE TEMUCO · PAÑOL TI
          </div>
          <h1 className="font-mono text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            SGIA
          </h1>
          <p className="mt-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Sistema de Gestión de Inventario y Activos
          </p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
            Área Informática y Ciberseguridad · INACAP
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs">
          <div className="mb-5 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Iniciar Sesión</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Ingresa tus credenciales institucionales para acceder al panel.
            </p>
          </div>

          {authError && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-md border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 p-2.5 text-xs text-red-700 dark:text-red-400"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="flex flex-col gap-3.5" noValidate>
            {/* Email Field */}
            <div>
              <label
                htmlFor="email-input"
                className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono"
              >
                <Mail className="h-3 w-3 text-zinc-400" />
                <span>Correo institucional</span>
              </label>
              <input
                id="email-input"
                type="email"
                autoComplete="email"
                disabled={isSubmitting}
                placeholder="admin@sgia.cl"
                className={inputClasses}
                {...register('email', {
                  required: 'El correo electrónico es obligatorio',
                  validate: (value) => {
                    const trimmed = (value ?? '').trim();
                    if (!trimmed) return 'El correo electrónico es obligatorio';
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
                      return 'Formato de correo inválido (ejemplo: admin@sgia.cl)';
                    }
                    return true;
                  },
                })}
              />
              {errors.email && (
                <span className="mt-1 block text-xs text-red-600 dark:text-red-400 font-medium">
                  {errors.email.message}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password-input"
                className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono"
              >
                <Lock className="h-3 w-3 text-zinc-400" />
                <span>Contraseña</span>
              </label>
              <div className="relative">
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  placeholder="••••••••"
                  className={`${inputClasses} pr-9`}
                  {...register('password', {
                    required: 'La contraseña es obligatoria',
                  })}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="mt-1 block text-xs text-red-600 dark:text-red-400 font-medium">
                  {errors.password.message}
                </span>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="mt-2 w-full py-2 text-xs font-semibold tracking-wide"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Iniciando sesión…</span>
                </>
              ) : (
                'Acceder'
              )}
            </Button>
          </form>

          {/* Quick fill test accounts */}
          <div className="mt-5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-2.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-1.5 mb-2 font-medium text-zinc-700 dark:text-zinc-300">
              <KeyRound className="h-3.5 w-3.5 text-zinc-400" />
              <span>Accesos rápidos de prueba:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 font-mono">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@sgia.cl')}
                className="rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 hover:text-zinc-900 transition-colors"
              >
                AD-01 (Admin)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('director@sgia.cl')}
                className="rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 hover:text-zinc-900 transition-colors"
              >
                DIR-01 (Director)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('panol@sgia.cl')}
                className="rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 hover:text-zinc-900 transition-colors"
              >
                PAN-01 (Pañol)
              </button>
            </div>
          </div>

          {/* Role access guidance */}
          <div className="mt-4 border-t border-zinc-100 dark:border-zinc-800 pt-3">
            <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-2">
              <span>Roles autorizados en web:</span>
              <div className="flex gap-1.5 font-mono">
                <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                  AD-01
                </span>
                <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                  DIR-01
                </span>
                <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                  PAN-01
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded border border-zinc-200/60 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 px-2.5 py-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              <Smartphone className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
              <span>
                Docentes (<span className="font-mono text-zinc-700 dark:text-zinc-300">PRO-01</span>): usan la app móvil.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
