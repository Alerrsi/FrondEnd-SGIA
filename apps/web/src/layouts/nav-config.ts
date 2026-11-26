import {
  BarChart3,
  Bell,
  Boxes,
  CalendarClock,
  ClipboardCheck,
  ClipboardPlus,
  Cpu,
  FileSpreadsheet,
  FileWarning,
  GraduationCap,
  History,
  House,
  KeyRound,
  Layers,
  Map as MapIcon,
  PackageSearch,
  ReceiptText,
  ScanBarcode,
  ScrollText,
  ShieldCheck,
  ShoppingBag,
  UserPlus,
  Users,
  Warehouse,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

import { PURCHASE_NAV_LINKS, purchaseLinksFor } from '@/features/compras/lib/purchase-nav';
import { canAccessRoute, type WebRoleCode } from '@/features/auth/types/roles';

/*
 * Fuente única de la navegación web (rediseño «Trazo», docs/rediseno-interfaz.md §5). La leen el sidebar,
 * el header, el buscador `Ctrl K`, las migas de pan y los accesos de la página de inicio. Los permisos salen
 * de `ROUTE_PERMISSIONS`: aquí solo se decide orden, nombre, descripción e icono.
 */

export interface NavLinkEntry {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export interface NavEntry extends NavLinkEntry {
  /** Solo coincide con la ruta exacta (Inicio). */
  end?: boolean;
  /** Páginas del grupo (Compras), ya filtradas por rol en `navForRole`. */
  children?: NavLinkEntry[];
}

const NAV_ENTRIES: NavEntry[] = [
  { to: '/', label: 'Inicio', description: 'Lo que te toca hoy', icon: House, end: true },
  { to: '/analitica', label: 'Analítica', description: 'Métricas y gráficos', icon: BarChart3 },
  { to: '/inventario', label: 'Inventario', description: 'Productos y stock', icon: Boxes },
  { to: '/prestamos', label: 'Préstamos', description: 'Cola y mostrador', icon: CalendarClock },
  { to: '/ubicaciones', label: 'Ubicaciones', description: 'Salas y cajones', icon: Layers },
  { to: '/mapa-salas', label: 'Mapa de salas', description: 'Zonas y estantes de cada sala', icon: MapIcon },
  { to: '/equipos', label: 'Equipos', description: 'Fichas técnicas', icon: Cpu },
  { to: '/compras', label: 'Compras', description: 'Solicitudes, órdenes y facturas', icon: ShoppingBag },
  { to: '/novedades', label: 'Informes', description: 'Fallas reportadas', icon: FileWarning },
  { to: '/mantenciones', label: 'Mantenciones', description: 'Equipos en revisión', icon: Wrench },
  { to: '/estudiantes', label: 'Estudiantes', description: 'Préstamos a alumnos', icon: GraduationCap },
  { to: '/historial', label: 'Historial de préstamos', description: 'Bitácora completa', icon: History },
  { to: '/alertas', label: 'Alertas de stock', description: 'Bajo el mínimo', icon: Bell },
  { to: '/profesor/catalogo', label: 'Catálogo', description: 'Equipos disponibles', icon: PackageSearch },
  { to: '/profesor/solicitudes', label: 'Mis solicitudes', description: 'Estado de tus pedidos', icon: ClipboardPlus },
  { to: '/profesor/novedades', label: 'Mis informes', description: 'Fallas que reportaste', icon: FileWarning },
  { to: '/usuarios', label: 'Usuarios', description: 'Cuentas y roles', icon: Users },
  { to: '/panoles', label: 'Pañoles', description: 'Sedes y bodegas', icon: Warehouse },
  { to: '/auditoria', label: 'Auditoría', description: 'Registro de cambios', icon: ScrollText },
  { to: '/monitoreo', label: 'Monitoreo', description: 'Accesos y estado del sistema', icon: ShieldCheck },
  // Al final para los tres roles: después de las pantallas de las que salen sus reportes.
  { to: '/reportes', label: 'Reportes', description: 'Excel con vista previa', icon: FileSpreadsheet },
];

/** Menú del rol, en orden. Compras lleva sus páginas como `children`. */
export function navForRole(role: string | undefined): NavEntry[] {
  const r = (role ?? '') as WebRoleCode;
  return NAV_ENTRIES.filter((entry) => canAccessRoute(r, entry.to)).map((entry) =>
    entry.to === '/compras'
      ? {
          ...entry,
          children: purchaseLinksFor(r).map(({ to, label, description, icon }) => ({ to, label, description, icon })),
        }
      : entry,
  );
}

/** Todas las pantallas del rol en una lista plana (grupos expandidos), sin Inicio. */
export function screensForRole(role: string | undefined): NavLinkEntry[] {
  return navForRole(role).flatMap((entry) => {
    if (entry.end) return [];
    if (entry.children) return entry.children;
    const { to, label, description, icon } = entry;
    return [{ to, label, description, icon }];
  });
}

/** Nombre de la pantalla de una ruta (la más específica que coincida), para migas y títulos. */
export function findScreen(pathname: string): { entry: NavLinkEntry; group?: NavLinkEntry } | undefined {
  for (const entry of NAV_ENTRIES) {
    if (entry.to === '/compras') {
      const child = PURCHASE_NAV_LINKS.find((c) => pathname === c.to || pathname.startsWith(`${c.to}/`));
      if (child) return { entry: child, group: entry };
    }
  }
  const matches = NAV_ENTRIES.filter((e) =>
    e.end ? pathname === e.to : pathname === e.to || pathname.startsWith(`${e.to}/`),
  ).sort((a, b) => b.to.length - a.to.length);
  return matches[0] ? { entry: matches[0] } : undefined;
}

export interface QuickAction {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  /** Tecla de atajo en la página de inicio del rol. */
  key?: string;
}

const QUICK_ACTIONS: Record<WebRoleCode, QuickAction[]> = {
  'PAN-01': [
    { id: 'mostrador', label: 'Abrir mostrador', to: '/prestamos/mostrador', icon: ScanBarcode, key: 'm' },
    { id: 'cola', label: 'Revisar cola de solicitudes', to: '/prestamos/cola', icon: CalendarClock },
    { id: 'inventario', label: 'Buscar en inventario', to: '/inventario', icon: Boxes },
  ],
  'DIR-01': [
    { id: 'solicitud', label: 'Nueva solicitud de compra', to: '/compras/solicitudes', icon: ClipboardCheck, key: 'n' },
    { id: 'factura', label: 'Registrar factura', to: '/compras/facturas', icon: ReceiptText },
    { id: 'analitica', label: 'Ver analítica', to: '/analitica', icon: BarChart3 },
  ],
  'AD-01': [
    { id: 'usuario', label: 'Crear usuario', to: '/usuarios', icon: UserPlus, key: 'u' },
    { id: 'monitoreo', label: 'Ver accesos fallidos', to: '/monitoreo', icon: KeyRound },
    { id: 'auditoria', label: 'Revisar auditoría', to: '/auditoria', icon: ScrollText },
  ],
  'PRO-01': [
    { id: 'solicitar', label: 'Solicitar equipo', to: '/profesor/catalogo', icon: PackageSearch, key: 'n' },
    { id: 'informe', label: 'Reportar una falla', to: '/profesor/novedades', icon: FileWarning },
    { id: 'mis-solicitudes', label: 'Ver mis solicitudes', to: '/profesor/solicitudes', icon: ClipboardPlus },
  ],
};

/** Acciones frecuentes del rol: la primera es la acción principal de su inicio. */
export function quickActionsForRole(role: string | undefined): QuickAction[] {
  return QUICK_ACTIONS[role as WebRoleCode] ?? [];
}
