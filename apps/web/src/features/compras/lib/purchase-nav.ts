import { Archive, Building2, ClipboardCheck, ReceiptText, ShoppingCart, Wallet } from 'lucide-react';

import { ROUTE_PERMISSIONS, type WebRoleCode } from '@/features/auth/types/roles';

export interface PurchaseNavLink {
  to: string;
  label: string;
  description: string;
  icon: typeof ShoppingCart;
  roles: WebRoleCode[];
}

/** Páginas del módulo Compras en el orden del flujo; las de apoyo van al final. */
export const PURCHASE_NAV_LINKS: PurchaseNavLink[] = [
  {
    to: '/compras/solicitudes',
    label: 'Solicitudes de compra',
    description: 'Crear, aprobar, enviar a proveedores y elegir cotización.',
    icon: ClipboardCheck,
  },
  {
    to: '/compras/ordenes',
    label: 'Órdenes de compra',
    description: 'OC emitidas, reserva de presupuesto y trazabilidad.',
    icon: ShoppingCart,
  },
  {
    to: '/compras/facturas',
    label: 'Facturas',
    description: 'Ingreso de facturas con OCR: stock y consumo de presupuesto.',
    icon: ReceiptText,
  },
  {
    to: '/compras/presupuestos',
    label: 'Presupuestos',
    description: 'Disponible, reservado y consumido por carrera y año.',
    icon: Wallet,
  },
  {
    to: '/compras/proveedores',
    label: 'Proveedores',
    description: 'Proveedores y sus áreas para el envío de solicitudes.',
    icon: Building2,
  },
  {
    // Flujo antiguo en solo lectura (Fase 7).
    to: '/compras/cotizaciones',
    label: 'Historial cotizaciones',
    description: 'Cotizaciones del flujo anterior, solo lectura.',
    icon: Archive,
  },
].map((link) => ({ ...link, roles: ROUTE_PERMISSIONS[link.to] ?? [] }));

export function purchaseLinksFor(role: string | undefined): PurchaseNavLink[] {
  return PURCHASE_NAV_LINKS.filter((link) => link.roles.includes(role as WebRoleCode));
}
