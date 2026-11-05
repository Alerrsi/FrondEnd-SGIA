export type EquipmentStatus =
  | 'operativo'
  | 'en_mantencion'
  | 'critico'
  | 'baja'
  | 'en_prestamo';

export interface EquipmentSpecs {
  id?: number;
  equipment_id?: number;
  specifications: Record<string, string | number | boolean>;
  user_manual_url?: string | null;
  purchase_date?: string | null;
  lifespan_years?: number | null;
}

export interface UpdateEquipmentSpecsPayload {
  specifications: Record<string, string | number | boolean>;
  user_manual_url?: string | null;
  purchase_date?: string | null;
  lifespan_years?: number | null;
}

export interface EquipmentMaintenanceRecord {
  id: number;
  equipment_id: number;
  date: string;
  type: 'preventiva' | 'correctiva' | 'calibracion';
  technician: string;
  description: string;
  cost?: number;
}

export interface EquipmentQueryParams {
  search?: string;
  status?: EquipmentStatus | 'todos' | '';
  category?: string;
  page?: number;
  per_page?: number;
}

export interface Equipo {
  id: number;
  nombre: string;
  name?: string;
  codigo?: string;
  sku?: string;
  serial?: string;
  serial_number?: string;
  marca?: string;
  brand?: string;
  modelo?: string;
  model?: string;
  categoria?: string;
  category?: string;
  ubicacion?: string;
  location?: string;
  estado?: EquipmentStatus;
  status?: EquipmentStatus;
  purchase_date?: string | null;
  lifespan_years?: number | null;
  user_manual_url?: string | null;
  specs?: EquipmentSpecs;
  fichasTecnicas?: FichaTecnica[];
  novedades?: IncidentReport[];
  maintenances?: EquipmentMaintenanceRecord[];
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;
}

export interface FichaTecnica {
  id: number;
  equipoId: number;
  nombre: string;
  urlPdf: string;
  createdAt: string;
}

export type IncidentSeverity = 'leve' | 'media' | 'critica';
export type IncidentStatus =
  | 'reportado'
  | 'en_revision'
  | 'en_reparacion'
  | 'resuelto'
  | 'descartado'
  | 'reparado'
  | 'dado_de_baja';

/** Casillas del formulario de novedades del docente. */
export type IncidentProblemType =
  | 'falla_equipo'
  | 'falta_equipamiento'
  | 'falta_insumo'
  | 'otros';

export const INCIDENT_PROBLEM_LABELS: Record<IncidentProblemType, string> = {
  falla_equipo: 'Falla de equipos / instrumento / software',
  falta_equipamiento: 'Falta de equipamiento',
  falta_insumo: 'Falta de insumo',
  otros: 'Otros',
};

export interface IncidentProblem {
  type: IncidentProblemType;
  description: string;
  label?: string;
}

/**
 * Informe de novedades. Los informes nuevos (`is_legacy: false`) traen docente, asignatura,
 * laboratorio, problemas y firma; los anteriores (`is_legacy: true`) conservan
 * `severity`, `request_type`, `description` y `attachment_url`.
 */
export interface IncidentReport {
  id: number;
  code?: string | null;
  is_legacy?: boolean;
  product_id: number | null;
  title?: string | null;
  description?: string;
  severity?: IncidentSeverity;
  severity_label?: string;
  status: IncidentStatus;
  teacher_name?: string | null;
  subject?: string | null;
  report_date?: string | null;
  location_id?: number | null;
  location?: { id: number; nombre: string } | null;
  problems?: IncidentProblem[] | null;
  suggestion?: string | null;
  has_signature?: boolean;
  signature_url?: string | null;
  signed_at?: string | null;
  pdf_url?: string | null;
  reporter?: { id: number; name: string } | null;
  photo_url?: string | null;
  attachment_url?: string | null;
  equipment_unit_id?: number | null;
  equipment_unit?: { id: number; code: string; serial_number?: string | null } | null;
  request_type?: 'falla' | 'reposicion' | 'mantencion';
  has_evidence_photo?: boolean;
  allowed_transitions?: IncidentStatus[];
  reported_by?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateIncidentReportPayload {
  subject: string;
  /** `YYYY-MM-DD`; si falta el backend usa hoy. No puede ser futura. */
  report_date?: string;
  location_id: number;
  /** Solo las casillas marcadas, una por `type`, con descripción obligatoria. */
  problems: Array<{ type: IncidentProblemType; description: string }>;
  suggestion?: string;
  /** PNG en base64, con o sin prefijo `data:image/png;base64,`. Menos de 512 KB. */
  signature: string;
  /** Archivo jpg/png/webp (máx. 10 MB). En móvil: `{ uri, name, type }`. */
  evidence_photo?: File | Blob | { uri: string; name: string; type: string } | null;
  /** Código de unidad (equipos/maquetas) o código de barras de un insumo. */
  equipment_code?: string;
}

export interface IncidentReportQueryParams {
  status?: IncidentStatus;
  product_id?: number;
  equipment_unit_id?: number;
  search?: string;
  per_page?: number;
  page?: number;
}

export interface EquipmentReportQueryParams {
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  format?: 'pdf' | string;
  per_page?: number;
  page?: number;
}



export interface DashboardStats {
  total_products: {
    disponible: number;
    prestado: number;
    reparacion: number;
    baja: number;
  };
  loans: {
    active: number;
    overdue: number;
  };
  critical_alerts: number;
  monthly_rotation_rate: number;
}

export interface DashboardAnalyticsParams {
  limit?: number;
  since?: string;
}

export interface TopDemandedItem {
  id: number;
  name: string;
  barcode: string;
  total_requests: number;
}

export interface CareerDistribution {
  career: string;
  loan_count: number;
  supply_consumption: number;
}

export interface TeacherLoanRanking {
  teacher_id: number;
  name: string;
  total_loans: number;
}
