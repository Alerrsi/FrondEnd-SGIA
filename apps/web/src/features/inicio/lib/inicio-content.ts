import {
  Bell,
  Boxes,
  Building2,
  CalendarClock,
  ClipboardCheck,
  ClipboardPlus,
  Cpu,
  FileWarning,
  History,
  Layers,
  LayoutDashboard,
  PackageSearch,
  ScrollText,
  ShoppingCart,
  Users,
  Wallet,
  Warehouse,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

import { canAccessRoute, type WebRoleCode } from '@/features/auth/types/roles';

/** Módulo que se ofrece en los accesos de la página de inicio. */
export interface InicioModule {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

const MODULES: InicioModule[] = [
  { to: '/dashboard', label: 'Panel de analítica', description: 'Métricas y gráficos', icon: LayoutDashboard },
  { to: '/inventario', label: 'Inventario', description: 'Productos y stock', icon: Boxes },
  { to: '/prestamos', label: 'Préstamos', description: 'Cola y mostrador', icon: CalendarClock },
  { to: '/ubicaciones', label: 'Ubicaciones', description: 'Salas y cajones', icon: Layers },
  { to: '/equipos', label: 'Equipos', description: 'Fichas técnicas', icon: Cpu },
  { to: '/alertas', label: 'Alertas de stock', description: 'Bajo el mínimo', icon: Bell },
  { to: '/compras/solicitudes', label: 'Solicitudes de compra', description: 'Flujo de compras', icon: ClipboardCheck },
  { to: '/compras/ordenes', label: 'Órdenes de compra', description: 'Trazabilidad', icon: ShoppingCart },
  { to: '/compras/presupuestos', label: 'Presupuestos', description: 'Saldo por área', icon: Wallet },
  { to: '/compras/proveedores', label: 'Proveedores', description: 'Contactos y rubros', icon: Building2 },
  { to: '/novedades', label: 'Informes', description: 'Fallas reportadas', icon: FileWarning },
  { to: '/mantenciones', label: 'Mantenciones', description: 'Equipos en revisión', icon: Wrench },
  { to: '/historial', label: 'Historial de préstamos', description: 'Bitácora completa', icon: History },
  { to: '/profesor/catalogo', label: 'Catálogo', description: 'Equipos disponibles', icon: PackageSearch },
  { to: '/profesor/solicitudes', label: 'Mis solicitudes', description: 'Estado de tus pedidos', icon: ClipboardPlus },
  { to: '/profesor/novedades', label: 'Mis informes', description: 'Fallas que reportaste', icon: FileWarning },
  { to: '/usuarios', label: 'Usuarios', description: 'Cuentas y roles', icon: Users },
  { to: '/panoles', label: 'Pañoles', description: 'Sedes y bodegas', icon: Warehouse },
  { to: '/auditoria', label: 'Auditoría', description: 'Registro de cambios', icon: ScrollText },
];

/** Módulos que el rol puede abrir, en el orden del menú. */
export function getInicioModules(role: string): InicioModule[] {
  return MODULES.filter((m) => canAccessRoute(role as WebRoleCode, m.to));
}
