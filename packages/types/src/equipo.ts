export interface EquipmentSpecs {
  id?: number;
  equipment_id?: number;
  specifications: Record<string, string | number | boolean>;
  user_manual_url?: string | null;
  purchase_date?: string | null;
  lifespan_years?: number | null;
}

export interface Equipo {
  id: number;
  nombre: string;
  name?: string;
  codigo?: string;
  specs?: EquipmentSpecs;
  fichasTecnicas?: FichaTecnica[];
  novedades?: Novedad[];
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
export type IncidentStatus = 'en_revision' | 'en_reparacion' | 'reparado' | 'dado_de_baja';

export interface IncidentReport {
  id: number;
  product_id: number;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  photo_url?: string | null;
  reported_by?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateIncidentReportPayload {
  product_id: number;
  description: string;
  severity: IncidentSeverity;
  photo?: File | Blob | null;
}

export interface Novedad {
  id: number;
  equipoId?: number | null;
  productoId?: number | null;
  product_id?: number | null;
  reportadoPorId?: number;
  tipo?: 'falla' | 'reposicion';
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  descripcion: string;
  description?: string;
  adjuntoUrl?: string | null;
  photo_url?: string | null;
  resuelto?: boolean;
  createdAt?: string;
  created_at?: string;
}

export interface CreateNovedadPayload {
  equipoId?: number;
  productoId?: number;
  product_id?: number;
  tipo?: 'falla' | 'reposicion';
  severity?: IncidentSeverity;
  descripcion: string;
  description?: string;
  adjunto?: File | null;
  photo?: File | null;
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
