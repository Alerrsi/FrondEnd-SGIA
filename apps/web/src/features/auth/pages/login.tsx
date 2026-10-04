import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
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
import { canAccessRoute, getRoleDefaultPath } from '../types/roles';

interface LoginFormValues {
  email: string;
  password: string;
}

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header / Logo */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface shadow-inner">
            <Boxes className="h-6 w-6 text-accent" />
          </div>
          <h1 className="font-mono-tabular text-xl font-bold tracking-tight text-text">
            SGIA
          </h1>
          <p className="mt-1 text-sm font-medium text-text-muted">
            Sistema de Gestión de Inventario y Activos
          </p>
          <p className="text-xs text-text-muted/70">
            Área de Informática y Ciberseguridad · INACAP Sede Temuco
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-2xl backdrop-blur-sm">
          <div className="mb-5 border-b border-border pb-4">
            <h2 className="text-base font-semibold text-text">Iniciar Sesión</h2>
            <p className="text-xs text-text-muted">
              Ingresa tus credenciales institucionales para acceder al panel.
            </p>
          </div>

          {authError && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            {/* Email Field */}
            <div>
              <label
                htmlFor="email-input"
                className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text"
              >
                <Mail className="h-3.5 w-3.5 text-text-muted" />
                <span>Correo institucional</span>
              </label>
              <input
                id="email-input"
                type="email"
                autoComplete="email"
                disabled={isSubmitting}
                placeholder="admin@sgia.cl"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted/60 transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
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
                <span className="mt-1 block text-xs text-danger">
                  {errors.email.message}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password-input"
                className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text"
              >
                <Lock className="h-3.5 w-3.5 text-text-muted" />
                <span>Contraseña</span>
              </label>
              <div className="relative">
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm text-text placeholder:text-text-muted/60 transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                  {...register('password', {
                    required: 'La contraseña es obligatoria',
                  })}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text focus:outline-none transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="mt-1 block text-xs text-danger">
                  {errors.password.message}
                </span>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full py-2.5 text-sm font-semibold tracking-wide"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Iniciando sesión…</span>
                </>
              ) : (
                'Acceder'
              )}
            </Button>
          </form>

          {/* Quick fill test accounts */}
          <div className="mt-5 rounded-lg border border-border bg-background/50 p-3 text-[11px] text-text-muted">
            <div className="flex items-center gap-1.5 mb-2 font-medium text-text">
              <KeyRound className="h-3.5 w-3.5 text-accent" />
              <span>Accesos rápidos de prueba:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 font-mono-tabular">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@sgia.cl')}
                className="rounded border border-border bg-surface px-2 py-1 text-[11px] hover:border-accent hover:text-text transition-colors"
              >
                AD-01 (Admin)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('director@sgia.cl')}
                className="rounded border border-border bg-surface px-2 py-1 text-[11px] hover:border-accent hover:text-text transition-colors"
              >
                DIR-01 (Director)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('panol@sgia.cl')}
                className="rounded border border-border bg-surface px-2 py-1 text-[11px] hover:border-accent hover:text-text transition-colors"
              >
                PAN-01 (Pañol)
              </button>
            </div>
          </div>

          {/* Role access guidance */}
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex items-center justify-between text-[11px] text-text-muted mb-2">
              <span>Roles autorizados en web:</span>
              <div className="flex gap-1.5 font-mono-tabular">
                <span className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] text-text border border-border">
                  AD-01
                </span>
                <span className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] text-text border border-border">
                  DIR-01
                </span>
                <span className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] text-text border border-border">
                  PAN-01
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-[11px] text-text-muted">
              <Smartphone className="h-3.5 w-3.5 shrink-0 text-accent" />
              <span>
                Docentes (<span className="font-mono-tabular text-text">PRO-01</span>):
                deben usar la app móvil para préstamos e informes.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
