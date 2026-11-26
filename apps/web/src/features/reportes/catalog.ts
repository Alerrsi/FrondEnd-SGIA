import type { ReportParams } from '@sgia/api-client';

import type { WebRoleCode } from '@/features/auth/types/roles';

/*
 * Catálogo del centro de reportes (BackEnd-SGIA/docs/centro-reportes.md, decisión 3). Sin endpoint de
 * catálogo: cada reporte declara su ruta `/export`, los roles de esa ruta (ENDPOINTS.md §15; el backend los
 * vuelve a aplicar), sus hojas y sus filtros con los nombres de parámetro reales del backend.
 */

export type ReportGroup = 'Operación' | 'Compras' | 'Administración' | 'Paquetes';

export const REPORT_GROUPS: readonly ReportGroup[] = ['Operación', 'Compras', 'Administración', 'Paquetes'];

/** `snapshot`: estado actual («foto»). `period`: operaciones de un período («período»). */
export type ReportKind = 'snapshot' | 'period';

export interface ReportFilterOption {
  value: string;
  label: string;
  /** Parámetros que envía la opción cuando no basta con `{ [param]: value }` (estados de préstamos). */
  params?: ReportParams;
}

interface BaseFilter {
  /** Clave del valor en el estado de la página (el nombre del parámetro, salvo el período). */
  id: string;
  label: string;
}

export type ReportFilter =
  /** `from`/`to` (`YYYY-MM-DD`) desde el selector de período. */
  | (BaseFilter & { type: 'period'; required?: boolean })
  | (BaseFilter & { type: 'select'; param: string; options: ReportFilterOption[]; placeholder: string; defaultValue?: string })
  | (BaseFilter & { type: 'search'; param: string; placeholder: string })
  | (BaseFilter & { type: 'career'; param: 'career_id' })
  | (BaseFilter & { type: 'storeroom'; param: 'storeroom_id' })
  /** Año (`year`), por defecto el actual. */
  | (BaseFilter & { type: 'year'; param: 'year' });

export interface ReportDefinition {
  id: string;
  title: string;
  description: string;
  group: ReportGroup;
  kind: ReportKind;
  /** Ruta del export; puede traer parámetros fijos (`/loans/export?format=excel`). */
  path: string;
  /** Roles de la ruta del export (ENDPOINTS.md §15). */
  roles: WebRoleCode[];
  /** Hojas de datos del libro; la hoja «Info» va siempre al final. */
  sheets: string[];
  filters: ReportFilter[];
  /** Prefijo del archivo si el backend no envía `Content-Disposition`. */
  filenamePrefix: string;
  /** Texto de «Alcance» por rol cuando no es «todo lo visible para el rol» (decisión 11). */
  scope?: Partial<Record<WebRoleCode, string>>;
}

const OPS: WebRoleCode[] = ['DIR-01', 'PAN-01'];
const DIR: WebRoleCode[] = ['DIR-01'];
const ADMIN: WebRoleCode[] = ['AD-01'];

const PERIOD: ReportFilter = { id: 'period', type: 'period', label: 'Período' };
const CAREER: ReportFilter = { id: 'career_id', type: 'career', param: 'career_id', label: 'Carrera' };
const STOREROOM: ReportFilter = { id: 'storeroom_id', type: 'storeroom', param: 'storeroom_id', label: 'Pañol' };

function search(placeholder: string, param = 'search'): ReportFilter {
  return { id: param, type: 'search', param, label: 'Búsqueda', placeholder };
}

function select(
  param: string,
  label: string,
  placeholder: string,
  options: ReportFilterOption[],
  defaultValue?: string,
): ReportFilter {
  return { id: param, type: 'select', param, label, placeholder, options, defaultValue };
}

const ACTIVE_OPTIONS: ReportFilterOption[] = [
  { value: '1', label: 'Activos' },
  { value: '0', label: 'Inactivos' },
];

const LOANS_SCOPE_PAN = 'Los préstamos se limitan a tu pañol.';

export const REPORTS: ReportDefinition[] = [
  // ── Operación ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'inventario',
    title: 'Inventario',
    description: 'Productos con su stock, ubicación y proveedor, y las unidades de equipos y maquetas.',
    group: 'Operación',
    kind: 'snapshot',
    path: '/products/export',
    roles: OPS,
    sheets: ['Productos', 'Unidades'],
    filenamePrefix: 'inventario',
    filters: [
      search('Nombre o código del producto'),
      select('type', 'Tipo', 'Todos los tipos', [
        { value: 'insumo', label: 'Insumos' },
        { value: 'equipo', label: 'Equipos' },
        { value: 'maqueta', label: 'Maquetas' },
      ]),
      select('estado', 'Estado', 'Todos los estados', [
        { value: 'disponible', label: 'Disponible' },
        { value: 'en_reparacion', label: 'En reparación' },
        { value: 'dado_de_baja', label: 'Dado de baja' },
        { value: 'sin_stock', label: 'Sin stock' },
      ]),
      select('critical_only', 'Stock', 'Todo el stock', [{ value: '1', label: 'Solo bajo el mínimo' }]),
      select('is_active', 'Activo', 'Activos e inactivos', ACTIVE_OPTIONS),
    ],
  },
  {
    id: 'unidades',
    title: 'Unidades de equipos',
    description: 'Cada unidad de equipo o maqueta con su estado, pañol, cajón, mantenciones y préstamos.',
    group: 'Operación',
    kind: 'snapshot',
    path: '/equipment-units/export',
    roles: OPS,
    sheets: ['Unidades'],
    filenamePrefix: 'unidades',
    filters: [
      search('Código, serie o producto'),
      select('status', 'Estado', 'Todos los estados', [
        { value: 'disponible', label: 'Disponible' },
        { value: 'prestado', label: 'Prestado' },
        { value: 'en_reparacion', label: 'En reparación' },
        { value: 'dado_de_baja', label: 'Dado de baja' },
      ]),
      select('maintenance_due', 'Mantención', 'Todas', [{ value: '1', label: 'Con mantención vencida' }]),
      STOREROOM,
    ],
  },
  {
    id: 'prestamos',
    title: 'Historial de préstamos',
    description: 'Préstamos del período con su detalle por ítem y unidad, y el resumen por estado, tipo y carrera.',
    group: 'Operación',
    kind: 'period',
    path: '/loans/export?format=excel',
    roles: OPS,
    sheets: ['Préstamos', 'Detalle', 'Resumen'],
    filenamePrefix: 'prestamos',
    scope: { 'PAN-01': LOANS_SCOPE_PAN },
    filters: [
      PERIOD,
      // Los estados de la pantalla se traducen como en `loanExportFilters` (historial de préstamos).
      select('estado', 'Estado', 'Todos los estados', [
        { value: 'activo', label: 'En préstamo', params: { status: 'procesado', devuelto: '0' } },
        { value: 'atrasado', label: 'Atrasados', params: { atrasado: '1' } },
        { value: 'devuelto', label: 'Devueltos', params: { devuelto: '1' } },
        { value: 'pendiente', label: 'Pendientes', params: { status: 'pendiente' } },
        { value: 'rechazado', label: 'Rechazados', params: { status: 'rechazado' } },
      ]),
      CAREER,
      STOREROOM,
      search('Código, solicitante o asignatura'),
    ],
  },
  {
    id: 'alertas',
    title: 'Alertas de stock',
    description: 'Alertas creadas en el período, con el stock al alertar y la solicitud de compra abierta.',
    group: 'Operación',
    kind: 'period',
    path: '/alerts/export',
    roles: OPS,
    sheets: ['Alertas', 'Resumen'],
    filenamePrefix: 'alertas',
    filters: [
      PERIOD,
      select('alert_type', 'Tipo', 'Críticas y advertencias', [
        { value: 'critical', label: 'Críticas' },
        { value: 'warning', label: 'Advertencias' },
      ]),
      // Sin `is_resolved` el backend entrega solo las abiertas, como la bandeja.
      select('is_resolved', 'Estado', 'Abiertas', [{ value: '1', label: 'Resueltas' }]),
      search('Nombre o código del producto'),
    ],
  },
  {
    id: 'mantenciones',
    title: 'Mantenciones',
    description: 'Mantenciones del período con su resultado y costo, y el resumen por tipo, estado y carrera.',
    group: 'Operación',
    kind: 'period',
    path: '/maintenance-records/export',
    roles: OPS,
    sheets: ['Mantenciones', 'Resumen'],
    filenamePrefix: 'mantenciones',
    filters: [
      PERIOD,
      select('maintenance_type', 'Tipo', 'Todos los tipos', [
        { value: 'preventiva', label: 'Preventiva' },
        { value: 'correctiva', label: 'Correctiva' },
        { value: 'calibracion', label: 'Calibración' },
      ]),
      select('status', 'Estado', 'Todos los estados', [
        { value: 'en_curso', label: 'En curso' },
        { value: 'finalizada', label: 'Finalizada' },
        { value: 'anulada', label: 'Anulada' },
      ]),
      CAREER,
    ],
  },
  {
    id: 'novedades',
    title: 'Informes de novedades',
    description: 'Fallas reportadas en el período con su severidad y estado, y el resumen por carrera.',
    group: 'Operación',
    kind: 'period',
    path: '/incident-reports/export',
    roles: OPS,
    sheets: ['Informes', 'Resumen'],
    filenamePrefix: 'novedades',
    filters: [
      PERIOD,
      select('severity', 'Severidad', 'Todas', [
        { value: 'leve', label: 'Leve' },
        { value: 'media', label: 'Media' },
        { value: 'critica', label: 'Crítica' },
      ]),
      select('status', 'Estado', 'Todos los estados', [
        { value: 'reportado', label: 'Reportado' },
        { value: 'en_revision', label: 'En revisión' },
        { value: 'en_reparacion', label: 'En reparación' },
        { value: 'reparado', label: 'Reparado' },
        { value: 'resuelto', label: 'Resuelto' },
        { value: 'dado_de_baja', label: 'Dado de baja' },
        { value: 'descartado', label: 'Descartado' },
      ]),
      search('Folio, equipo o descripción'),
    ],
  },
  {
    id: 'estudiantes',
    title: 'Estudiantes',
    description: 'Estudiantes registrados con su carrera y sus préstamos totales y en curso.',
    group: 'Operación',
    kind: 'snapshot',
    path: '/students/export',
    roles: ['PAN-01'],
    sheets: ['Estudiantes'],
    filenamePrefix: 'estudiantes',
    filters: [search('Nombre, RUT o correo'), CAREER, select('is_active', 'Estado', 'Activos e inactivos', ACTIVE_OPTIONS)],
  },
  {
    id: 'ubicaciones',
    title: 'Ubicaciones',
    description: 'Dónde está cada unidad e insumo (pañol, sala, estante y cajón), los cajones y las salas.',
    group: 'Operación',
    kind: 'snapshot',
    path: '/locations/export',
    roles: ['DIR-01', 'PAN-01', 'AD-01'],
    sheets: ['Dónde está cada cosa', 'Cajones', 'Salas'],
    filenamePrefix: 'ubicaciones',
    filters: [
      search('Sala, cajón o producto'),
      select('tipo', 'Tipo de sala', 'Todos los tipos', [
        { value: 'sala', label: 'Sala' },
        { value: 'panol', label: 'Pañol' },
        { value: 'taller', label: 'Taller' },
        { value: 'bodega', label: 'Bodega' },
      ]),
      STOREROOM,
    ],
  },
  // ── Compras ────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'solicitudes',
    title: 'Solicitudes de compra',
    description: 'Solicitudes del período con sus fechas por etapa, total y OC, sus ítems y el resumen.',
    group: 'Compras',
    kind: 'period',
    path: '/purchase-requests/export',
    roles: DIR,
    sheets: ['Solicitudes', 'Ítems', 'Resumen'],
    filenamePrefix: 'solicitudes-compra',
    filters: [
      PERIOD,
      select('status', 'Estado', 'Todos los estados', [
        { value: 'borrador', label: 'Borrador' },
        { value: 'aprobada', label: 'Aprobada' },
        { value: 'enviada', label: 'Enviada' },
        { value: 'cotizada', label: 'Cotizada' },
        { value: 'con_oc', label: 'Con OC' },
        { value: 'facturada', label: 'Facturada' },
        { value: 'cancelada', label: 'Cancelada' },
      ]),
      search('Código de la solicitud', 'code'),
    ],
  },
  {
    id: 'ordenes',
    title: 'Órdenes de compra',
    description: 'Órdenes del período con su proveedor, total y llegada, sus ítems y el resumen.',
    group: 'Compras',
    kind: 'period',
    path: '/purchases/export',
    roles: DIR,
    sheets: ['Órdenes', 'Ítems', 'Resumen'],
    filenamePrefix: 'ordenes-compra',
    filters: [
      PERIOD,
      select('status', 'Estado', 'Todos los estados', [
        { value: 'pendiente', label: 'Pendiente' },
        { value: 'en_camino', label: 'En camino' },
        { value: 'completa', label: 'Completa' },
        { value: 'cancelada', label: 'Cancelada' },
      ]),
      search('OC o proveedor'),
    ],
  },
  {
    id: 'facturas',
    title: 'Facturas',
    description: 'Facturas recibidas en el período con su OC, solicitud y total, sus ítems y el resumen.',
    group: 'Compras',
    kind: 'period',
    path: '/invoice-intakes/export',
    roles: DIR,
    sheets: ['Facturas', 'Ítems', 'Resumen'],
    filenamePrefix: 'facturas',
    filters: [
      PERIOD,
      select('status', 'Estado', 'Todos los estados', [
        { value: 'borrador', label: 'Borrador' },
        { value: 'confirmado', label: 'Confirmada' },
        { value: 'anulado', label: 'Anulada' },
      ]),
    ],
  },
  {
    id: 'presupuestos',
    title: 'Presupuestos',
    description: 'Presupuesto anual por carrera (asignado, reservado, gastado y disponible) y sus movimientos.',
    group: 'Compras',
    kind: 'period',
    path: '/budgets/export',
    roles: DIR,
    sheets: ['Presupuestos', 'Movimientos', 'Resumen'],
    filenamePrefix: 'presupuestos',
    filters: [{ id: 'year', type: 'year', param: 'year', label: 'Año' }, CAREER],
  },
  {
    id: 'proveedores',
    title: 'Proveedores',
    description: 'Proveedores con su RUT, áreas, contacto y si están activos.',
    group: 'Compras',
    kind: 'snapshot',
    path: '/suppliers/export',
    roles: DIR,
    sheets: ['Proveedores'],
    filenamePrefix: 'proveedores',
    filters: [
      search('Razón social, contacto o correo'),
      select('area', 'Área', 'Todas las áreas', [
        { value: 'informatica', label: 'Informática' },
        { value: 'diseno', label: 'Diseño' },
        { value: 'telecomunicaciones', label: 'Telecomunicaciones' },
        { value: 'ciberseguridad', label: 'Ciberseguridad' },
      ]),
      select('is_active', 'Estado', 'Activos e inactivos', ACTIVE_OPTIONS),
    ],
  },
  // ── Administración ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'auditoria',
    title: 'Auditoría',
    description: 'Eventos del período con usuario, acción y cambios, y el resumen por acción y usuario.',
    group: 'Administración',
    kind: 'period',
    path: '/audit-logs/export',
    roles: ADMIN,
    sheets: ['Eventos', 'Resumen'],
    filenamePrefix: 'auditoria',
    filters: [
      PERIOD,
      select('auditable_type', 'Entidad', 'Todas las entidades', [
        { value: 'user', label: 'Usuarios' },
        { value: 'product', label: 'Productos' },
        { value: 'equipment_unit', label: 'Unidades de equipo' },
        { value: 'purchase_request', label: 'Solicitudes de compra' },
        { value: 'purchase', label: 'Órdenes de compra' },
        { value: 'invoice_intake', label: 'Facturas' },
        { value: 'report', label: 'Reportes descargados' },
      ]),
    ],
  },
  {
    id: 'usuarios',
    title: 'Usuarios',
    description: 'Cuentas con su rol, carrera, pañol, estado y último acceso.',
    group: 'Administración',
    kind: 'snapshot',
    path: '/users/export',
    roles: ADMIN,
    sheets: ['Usuarios'],
    filenamePrefix: 'usuarios',
    filters: [
      search('Nombre o correo'),
      select('role', 'Rol', 'Todos los roles', [
        { value: 'AD-01', label: 'Administrador' },
        { value: 'DIR-01', label: 'Director de carrera' },
        { value: 'PAN-01', label: 'Pañol' },
        { value: 'PRO-01', label: 'Profesor' },
      ]),
      select('is_active', 'Estado', 'Activos e inactivos', ACTIVE_OPTIONS),
      CAREER,
      STOREROOM,
    ],
  },
  {
    id: 'monitoreo',
    title: 'Monitoreo de accesos',
    description: 'Inicios de sesión y accesos fallidos del período, y las sesiones activas.',
    group: 'Administración',
    kind: 'period',
    path: '/monitoring/export',
    roles: ADMIN,
    sheets: ['Inicios de sesión', 'Fallidos', 'Sesiones activas', 'Resumen'],
    filenamePrefix: 'monitoreo',
    filters: [PERIOD, search('Correo', 'email')],
  },
  // ── Paquetes ───────────────────────────────────────────────────────────────────────────────────
  {
    id: 'informe-periodo',
    title: 'Informe del período',
    description:
      'Un libro con el resumen general (préstamos, atrasos, mantenciones y su costo, novedades, alertas críticas) y el detalle de cada uno.',
    group: 'Paquetes',
    kind: 'period',
    path: '/reports/period',
    roles: OPS,
    sheets: ['Resumen general', 'Préstamos', 'Detalle', 'Mantenciones', 'Informes', 'Alertas', 'Resumen'],
    filenamePrefix: 'informe-periodo',
    scope: { 'PAN-01': LOANS_SCOPE_PAN },
    filters: [{ ...PERIOD, required: true }, CAREER, STOREROOM],
  },
];

/** Reportes que el rol puede descargar (los roles de cada `/export`), en el orden del catálogo. */
export function reportsForRole(role: string | undefined): ReportDefinition[] {
  return REPORTS.filter((report) => (report.roles as string[]).includes(role ?? ''));
}

export function findReport(id: string | null | undefined): ReportDefinition | undefined {
  return REPORTS.find((report) => report.id === id);
}

export const REPORT_KIND_LABEL: Record<ReportKind, string> = {
  snapshot: 'foto',
  period: 'período',
};

/** Texto de «Alcance» del rol (decisión 11). */
export function reportScope(report: ReportDefinition, role: string | undefined): string {
  return report.scope?.[role as WebRoleCode] ?? 'Todo lo visible para tu rol.';
}
