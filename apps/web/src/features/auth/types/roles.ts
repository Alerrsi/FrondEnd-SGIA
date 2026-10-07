import type { RoleCode } from '@sgia/types';

export type WebRoleCode = 'AD-01' | 'DIR-01' | 'PAN-01';

export const WEB_ROLES: readonly WebRoleCode[] = ['AD-01', 'DIR-01', 'PAN-01'] as const;

export const ROLE_DEFAULT_PATH: Record<WebRoleCode, string> = {
  'AD-01': '/usuarios',
  'DIR-01': '/',
  'PAN-01': '/inventario',
};

export const ROUTE_PERMISSIONS: Record<string, WebRoleCode[]> = {
  '/': ['DIR-01'],
  '/inventario': ['PAN-01', 'DIR-01'],
  '/alertas': ['AD-01', 'DIR-01', 'PAN-01'],
  '/prestamos/cola': ['PAN-01'],
  '/prestamos/mostrador': ['PAN-01'],
  '/prestamos/historial': ['PAN-01', 'DIR-01', 'AD-01'],
  '/cotizaciones': ['DIR-01'],
  '/usuarios': ['AD-01'],
};

export function isWebRole(role: string): role is WebRoleCode {
  return (WEB_ROLES as readonly string[]).includes(role);
}

export function getRoleDefaultPath(role: RoleCode): string {
  if (isWebRole(role)) {
    return ROLE_DEFAULT_PATH[role];
  }
  return '/login';
}

export function canAccessRoute(role: RoleCode, pathname: string): boolean {
  if (!isWebRole(role)) return false;

  // Exact match
  const exact = ROUTE_PERMISSIONS[pathname];
  if (exact) {
    return exact.includes(role);
  }

  // Prefix match (e.g., /prestamos/...)
  const matchingPrefix = Object.keys(ROUTE_PERMISSIONS)
    .filter((route) => route !== '/')
    .find((route) => pathname.startsWith(route));

  if (matchingPrefix && ROUTE_PERMISSIONS[matchingPrefix]) {
    return ROUTE_PERMISSIONS[matchingPrefix].includes(role);
  }

  return true;
}
