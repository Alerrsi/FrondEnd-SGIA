import type { RoleCode } from '@sgia/types';

export type WebRoleCode = 'AD-01' | 'DIR-01' | 'PAN-01' | 'PRO-01';

export const WEB_ROLES: readonly WebRoleCode[] = ['AD-01', 'DIR-01', 'PAN-01', 'PRO-01'] as const;

export const ROLE_DEFAULT_PATH: Record<WebRoleCode, string> = {
  'AD-01': '/',
  'DIR-01': '/',
  'PAN-01': '/',
  'PRO-01': '/',
};

export const ROUTE_PERMISSIONS: Record<string, WebRoleCode[]> = {
  '/': ['AD-01', 'DIR-01', 'PAN-01', 'PRO-01'],
  '/analitica': ['DIR-01'],
  '/inventario': ['PAN-01', 'DIR-01'],
  '/prestamos': ['PAN-01'],
  '/prestamos/cola': ['PAN-01'],
  '/prestamos/mostrador': ['PAN-01'],
  '/prestamos/historial': ['PAN-01', 'DIR-01'],
  '/ubicaciones': ['PAN-01'],
  '/historial': ['PAN-01', 'DIR-01'],
  '/equipos': ['DIR-01', 'PAN-01'],
  '/alertas': ['DIR-01', 'PAN-01'],
  // Módulo Compras: solo DIR-01 (el pañol no accede a ninguna página de compras).
  '/compras': ['DIR-01'],
  '/compras/solicitudes': ['DIR-01'],
  '/compras/ordenes': ['DIR-01'],
  '/compras/facturas': ['DIR-01'],
  '/compras/presupuestos': ['DIR-01'],
  '/compras/proveedores': ['DIR-01'],
  '/compras/cotizaciones': ['DIR-01'],
  '/novedades': ['PAN-01', 'DIR-01'],
  '/mantenciones': ['PAN-01', 'DIR-01'],
  '/estudiantes': ['PAN-01'],
  '/profesor': ['PRO-01'],
  '/profesor/catalogo': ['PRO-01'],
  '/profesor/solicitudes': ['PRO-01'],
  '/profesor/novedades': ['PRO-01'],
  // AD-01 administra el sistema (usuarios, pañoles, auditoría, monitoreo); no opera el negocio.
  '/usuarios': ['AD-01'],
  '/panoles': ['AD-01'],
  '/auditoria': ['AD-01'],
  '/monitoreo': ['AD-01'],
};

/** Acciones (botones) por rol; espejo de `routes/api.php` y las policies del backend. */
export const ACTION_ROLES = {
  /** Crear, aprobar, enviar, subir cotizaciones/OC y cancelar solicitudes de compra. */
  managePurchaseRequests: ['DIR-01'],
  cancelPurchase: ['DIR-01'],
  manageBudgets: ['DIR-01'],
  authorizeOverBudget: ['DIR-01'],
  scanInvoice: ['DIR-01'],
  deleteProduct: ['DIR-01'],
} as const satisfies Record<string, readonly WebRoleCode[]>;

export function canDo(role: string | undefined, action: keyof typeof ACTION_ROLES): boolean {
  return (ACTION_ROLES[action] as readonly string[]).includes(role ?? '');
}

export function isWebRole(role: string): role is WebRoleCode {
  if ((WEB_ROLES as readonly string[]).includes(role as WebRoleCode)) {
    return true;
  }
  const r = role.toLowerCase();
  if (r.includes('admin')) return true;
  if (r.includes('director') || r.includes('coordinador')) return true;
  if (r.includes('pañol') || r.includes('panol')) return true;
  return false;
}

export function getRoleDefaultPath(role: RoleCode): string {
  if (isWebRole(role)) {
    return ROLE_DEFAULT_PATH[role];
  }
  return '/login';
}

/** Roles que pueden abrir `pathname` (coincidencia exacta o por prefijo); `undefined` si la ruta no tiene regla. */
export function rolesForRoute(pathname: string): WebRoleCode[] | undefined {
  const exact = ROUTE_PERMISSIONS[pathname];
  if (exact) return exact;
  // El prefijo más largo gana: `/compras/facturas/x` no hereda los roles de `/compras`.
  const prefix = Object.keys(ROUTE_PERMISSIONS)
    .filter((route) => route !== '/' && pathname.startsWith(`${route}/`))
    .sort((a, b) => b.length - a.length)[0];
  return prefix ? ROUTE_PERMISSIONS[prefix] : undefined;
}

export function canAccessRoute(role: RoleCode, pathname: string): boolean {
  if (!isWebRole(role)) return false;
  const allowed = rolesForRoute(pathname);
  return allowed ? allowed.includes(role) : true;
}
