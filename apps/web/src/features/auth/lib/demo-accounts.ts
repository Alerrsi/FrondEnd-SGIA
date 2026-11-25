import type { WebRoleCode } from '../types/roles';

/** Cuenta sembrada por `DatabaseSeeder` del backend, una por rol (docs/accesos-demo.md). */
export interface DemoAccount {
  role: WebRoleCode;
  email: string;
  label: string;
}

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { role: 'AD-01', email: 'admin@sgia.cl', label: 'Administrador' },
  { role: 'DIR-01', email: 'director@sgia.cl', label: 'Director' },
  { role: 'PAN-01', email: 'panol@sgia.cl', label: 'Pañolero' },
  { role: 'PRO-01', email: 'docente@sgia.cl', label: 'Docente' },
];

/**
 * Contraseña de las cuentas de demostración, o `undefined` si los accesos no están activos.
 * En `vite dev` sale de `VITE_DEV_QUICK_LOGIN_PASSWORD`; en un build, solo si se compiló con
 * `VITE_DEMO_LOGIN_PASSWORD` (despliegue de presentación). Vite elimina la rama que no aplica.
 */
export function demoLoginPassword(): string | undefined {
  const password = import.meta.env.DEV
    ? import.meta.env.VITE_DEV_QUICK_LOGIN_PASSWORD
    : import.meta.env.VITE_DEMO_LOGIN_PASSWORD;
  return password || undefined;
}
