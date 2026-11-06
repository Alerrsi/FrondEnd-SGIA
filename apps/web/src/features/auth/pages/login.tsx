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
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useAuth } from '@/features/auth/context/auth-context';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import { canAccessRoute, getRoleDefaultPath } from '../types/roles';

interface LoginFormValues {
  email: string;
  password: string;
}

const inputClasses =
  'w-full h-8.5 rounded-md border border-border bg-surface px-3 font-mono text-xs text-text placeholder:text-text-muted transition-colors focus:border-text-muted focus:outline-none focus:ring-1 focus:ring-info disabled:opacity-50';

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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8 text-text">
      <div className="absolute top-4 right-4">
        <ThemeToggle variant="segmented" />
      </div>

      <div className="w-full max-w-sm">
        {/* Header / Logo */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-surface shadow-xs">
            <Boxes aria-hidden="true" className="h-6 w-6 text-text" />
          </div>
          <div data-sede-badge="true" className="sede-badge inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs font-mono font-medium text-danger mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
            SEDE TEMUCO · PAÑOL TI
          </div>
          <h1 className="font-mono text-xl font-bold tracking-tight text-text">
            SGIA
          </h1>
          <p className="mt-0.5 text-xs font-medium text-text-muted">
            Sistema de Gestión de Inventario y Activos
          </p>
          <p className="text-xs text-text-muted font-mono">
            Área Informática y Ciberseguridad · INACAP
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-lg border border-border bg-surface p-6 shadow-xs">
          <div className="mb-5 border-b border-border pb-3">
            <h2 className="text-sm font-semibold text-text">Iniciar Sesión</h2>
            <p className="text-xs text-text-muted">
              Ingresa tus credenciales institucionales para acceder al panel.
            </p>
          </div>

          {authError && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-md border border-danger/30 bg-danger-bg p-2.5 text-xs text-danger"
            >
              <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0 mt-0.5 text-danger" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="flex flex-col gap-3.5" noValidate>
            {/* Email Field */}
            <div>
              <label
                htmlFor="email-input"
                className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted font-mono"
              >
                <Mail aria-hidden="true" className="h-3 w-3 text-text-muted" />
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
                <span className="mt-1 block text-xs text-danger font-medium">
                  {errors.email.message}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password-input"
                className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted font-mono"
              >
                <Lock aria-hidden="true" className="h-3 w-3 text-text-muted" />
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" className="h-4 w-4" />
                  ) : (
                    <Eye aria-hidden="true" className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="mt-1 block text-xs text-danger font-medium">
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
                  <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                  <span>Iniciando sesión…</span>
                </>
              ) : (
                'Acceder'
              )}
            </Button>
          </form>

          {/* Quick fill test accounts */}
          <div className="mt-5 rounded-md border border-border bg-surface-raised p-2.5 text-xs text-text-muted">
            <div className="flex items-center gap-1.5 mb-2 font-medium text-text">
              <KeyRound aria-hidden="true" className="h-3.5 w-3.5 text-text-muted" />
              <span>Accesos rápidos de prueba:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 font-mono">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@sgia.cl')}
                className="rounded border border-border bg-surface px-2 py-0.5 text-xs text-text hover:border-text-muted hover:text-text transition-colors"
              >
                AD-01 (Admin)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('director@sgia.cl')}
                className="rounded border border-border bg-surface px-2 py-0.5 text-xs text-text hover:border-text-muted hover:text-text transition-colors"
              >
                DIR-01 (Director)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('panol@sgia.cl')}
                className="rounded border border-border bg-surface px-2 py-0.5 text-xs text-text hover:border-text-muted hover:text-text transition-colors"
              >
                PAN-01 (Pañol)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('docente@sgia.cl')}
                className="rounded border border-border bg-surface px-2 py-0.5 text-xs text-text hover:border-text-muted hover:text-text transition-colors"
              >
                PRO-01 (Profesor)
              </button>
            </div>
          </div>

          {/* Role access guidance */}
          <div className="mt-4 border-t border-border pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted mb-2">
              <span>Roles autorizados en web:</span>
              <div className="flex gap-1.5 font-mono">
                <span className="whitespace-nowrap rounded bg-surface-raised px-1.5 py-0.5 text-xs text-text border border-border">
                  AD-01
                </span>
                <span className="whitespace-nowrap rounded bg-surface-raised px-1.5 py-0.5 text-xs text-text border border-border">
                  DIR-01
                </span>
                <span className="whitespace-nowrap rounded bg-surface-raised px-1.5 py-0.5 text-xs text-text border border-border">
                  PAN-01
                </span>
                <span className="whitespace-nowrap rounded bg-surface-raised px-1.5 py-0.5 text-xs text-text border border-border">
                  PRO-01
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
