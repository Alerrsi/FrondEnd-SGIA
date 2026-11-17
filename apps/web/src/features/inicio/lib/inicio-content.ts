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

/** Módulo que se ofrece en los accesos rápidos de la portada. */
export interface InicioModule {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Tono de la ficha del módulo (solo decorativo). */
  tone: 'amber' | 'sky' | 'emerald' | 'violet' | 'zinc';
}

/** Texto principal de la portada según el rol. */
export interface InicioHero {
  eyebrow: string;
  title: string;
  titleStrong: string;
  description: string;
  cta: { to: string; label: string };
  tip: { label: string; to: string; linkLabel: string };
}

const MODULES: InicioModule[] = [
  { to: '/dashboard', label: 'Panel de analítica', description: 'Métricas y gráficos', icon: LayoutDashboard, tone: 'violet' },
  { to: '/inventario', label: 'Inventario', description: 'Productos y stock', icon: Boxes, tone: 'amber' },
  { to: '/prestamos', label: 'Préstamos', description: 'Cola y mostrador', icon: CalendarClock, tone: 'sky' },
  { to: '/ubicaciones', label: 'Ubicaciones', description: 'Salas y cajones', icon: Layers, tone: 'emerald' },
  { to: '/equipos', label: 'Equipos', description: 'Fichas técnicas', icon: Cpu, tone: 'zinc' },
  { to: '/alertas', label: 'Alertas de stock', description: 'Bajo el mínimo', icon: Bell, tone: 'amber' },
  { to: '/compras/solicitudes', label: 'Solicitudes de compra', description: 'Flujo de compras', icon: ClipboardCheck, tone: 'sky' },
  { to: '/compras/ordenes', label: 'Órdenes de compra', description: 'Trazabilidad', icon: ShoppingCart, tone: 'emerald' },
  { to: '/compras/presupuestos', label: 'Presupuestos', description: 'Saldo por área', icon: Wallet, tone: 'violet' },
  { to: '/compras/proveedores', label: 'Proveedores', description: 'Contactos y rubros', icon: Building2, tone: 'zinc' },
  { to: '/novedades', label: 'Informes', description: 'Fallas reportadas', icon: FileWarning, tone: 'amber' },
  { to: '/mantenciones', label: 'Mantenciones', description: 'Equipos en revisión', icon: Wrench, tone: 'sky' },
  { to: '/historial', label: 'Historial de préstamos', description: 'Bitácora completa', icon: History, tone: 'zinc' },
  { to: '/profesor/catalogo', label: 'Catálogo', description: 'Equipos disponibles', icon: PackageSearch, tone: 'amber' },
  { to: '/profesor/solicitudes', label: 'Mis solicitudes', description: 'Estado de tus pedidos', icon: ClipboardPlus, tone: 'sky' },
  { to: '/profesor/novedades', label: 'Mis informes', description: 'Fallas que reportaste', icon: FileWarning, tone: 'emerald' },
  { to: '/usuarios', label: 'Usuarios', description: 'Cuentas y roles', icon: Users, tone: 'violet' },
  { to: '/panoles', label: 'Pañoles', description: 'Sedes y bodegas', icon: Warehouse, tone: 'emerald' },
  { to: '/auditoria', label: 'Auditoría', description: 'Registro de cambios', icon: ScrollText, tone: 'zinc' },
];

const HEROES: Record<WebRoleCode, InicioHero> = {
  'AD-01': {
    eyebrow: 'Administración',
    title: 'Todo el sistema',
    titleStrong: 'en un solo lugar',
    description: 'Gestiona cuentas, pañoles y la auditoría de SGIA, y revisa la operación de cada sede.',
    cta: { to: '/usuarios', label: 'Ir a usuarios' },
    tip: { label: 'Revisión sugerida', to: '/auditoria', linkLabel: 'Ver la auditoría' },
  },
  'DIR-01': {
    eyebrow: 'Dirección de carrera',
    title: 'Compras y analítica',
    titleStrong: 'con datos del pañol',
    description: 'Aprueba solicitudes de compra, controla presupuestos y sigue el uso de los equipos.',
    cta: { to: '/dashboard', label: 'Abrir el panel' },
    tip: { label: 'Pendiente del día', to: '/compras/solicitudes', linkLabel: 'Ver solicitudes de compra' },
  },
  'PAN-01': {
    eyebrow: 'Operación del pañol',
    title: 'Préstamos y stock',
    titleStrong: 'siempre al día',
    description: 'Atiende el mostrador con la pistola Code128, ordena los cajones y vigila el stock crítico.',
    cta: { to: '/prestamos/mostrador', label: 'Abrir mostrador' },
    tip: { label: 'Recomendación del pañol', to: '/alertas', linkLabel: 'Ver alertas de stock' },
  },
  'PRO-01': {
    eyebrow: 'Docencia',
    title: 'Equipos para tu clase',
    titleStrong: 'pedidos en minutos',
    description: 'Elige equipos del catálogo, solicita el préstamo para tu sala y reporta cualquier falla.',
    cta: { to: '/profesor/catalogo', label: 'Ver catálogo' },
    tip: { label: 'Recomendación del pañol', to: '/profesor/solicitudes', linkLabel: 'Revisar mis solicitudes' },
  },
};

/** Contenido principal de la portada; los roles no web reciben el de profesor. */
export function getInicioHero(role: string): InicioHero {
  return HEROES[role as WebRoleCode] ?? HEROES['PRO-01'];
}

/** Módulos que el rol puede abrir, en el orden del menú. */
export function getInicioModules(role: string): InicioModule[] {
  return MODULES.filter((m) => canAccessRoute(role as WebRoleCode, m.to));
}
