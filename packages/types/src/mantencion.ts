import type { IncidentReport } from './equipo';
import type { Supplier } from './cotizacion';
import type { EquipmentUnit, MaintenancePriority } from './unidad';
import type { Usuario } from './usuario';

// Mantenciones de unidades (FU-05 / REQ-18) y documentos de mantenimiento (REQ-19).

export type MaintenanceType = 'preventiva' | 'correctiva' | 'calibracion';

export type MaintenanceExecutionMode = 'medios_propios' | 'externa';

/** Máquina de estados: `en_curso` → `finalizada` | `anulada` (ambas finales). */
export type MaintenanceStatus = 'en_curso' | 'finalizada' | 'anulada';

/** Resultado al cerrar: `operativo` deja la unidad `disponible`; `baja` la deja `dado_de_baja`. */
export type MaintenanceResult = 'operativo' | 'baja';

export type MaintenanceDocumentType =
  'certificado_calibracion' | 'informe_tecnico' | 'manual' | 'garantia' | 'otro';

export interface MaintenanceDocument {
  id: number;
  equipment_unit_id: number;
  maintenance_record_id?: number | null;
  document_type: MaintenanceDocumentType;
  title: string;
  /** Nombre original del archivo, si el backend lo informa. */
  original_name?: string | null;
  /** Fecha de vencimiento `YYYY-MM-DD`; `null` = sin vencimiento. */
  valid_until?: string | null;
  is_expired: boolean;
  /** No sirve en un `<a href>` (disco privado): descargar con `getBlob()` y el token. */
  file_url?: string | null;
  uploaded_by?: number | null;
  uploader?: Usuario | null;
  created_at?: string;
  updated_at?: string;
}

export interface MaintenanceDocumentQueryParams {
  document_type?: MaintenanceDocumentType;
  /** Solo vigentes que vencen dentro de N días. */
  expiring_within_days?: number;
  /** `true` = vigentes o sin vencimiento. */
  current?: boolean;
  per_page?: number;
  page?: number;
}

export interface UploadMaintenanceDocumentPayload {
  document_type: MaintenanceDocumentType;
  title: string;
  /** PDF, máx. 10 MB. */
  file: File;
  valid_until?: string | null;
  maintenance_record_id?: number | null;
}

export interface MaintenanceRecord {
  id: number;
  equipment_unit_id: number;
  equipment_unit?:
    | (EquipmentUnit & {
        product?: {
          id: number;
          name: string;
          maintenance_priority?: MaintenancePriority | null;
        } | null;
      })
    | null;
  incident_report_id?: number | null;
  incident_report?: IncidentReport | null;
  maintenance_type: MaintenanceType;
  execution_mode: MaintenanceExecutionMode;
  external_supplier_id?: number | null;
  external_supplier?: Supplier | null;
  responsible_id?: number | null;
  responsible?: Usuario | null;
  status: MaintenanceStatus;
  result?: MaintenanceResult | null;

  // Checklist técnico. `rev_c_approved: null` = "No aplica".
  rev_a_approved: boolean | null;
  rev_b_approved: boolean | null;
  rev_c_approved: boolean | null;
  pfg_approved: boolean | null;
  requires_additional_maintenance: boolean | null;
  applies_recf: boolean | null;
  repair_cost: number | null;
  spare_parts_used: string | null;
  technical_notes: string | null;

  started_at?: string | null;
  finished_at?: string | null;
  documents?: MaintenanceDocument[];
  created_at?: string;
  updated_at?: string;
}

export interface MaintenanceRecordQueryParams {
  equipment_unit_id?: number;
  product_id?: number;
  status?: MaintenanceStatus;
  maintenance_type?: MaintenanceType;
  execution_mode?: MaintenanceExecutionMode;
  /** Fecha de inicio `YYYY-MM-DD`. */
  from?: string;
  to?: string;
  per_page?: number;
  page?: number;
}

export interface CreateMaintenanceRecordPayload {
  maintenance_type: MaintenanceType;
  /** `medios_propios` por defecto. */
  execution_mode?: MaintenanceExecutionMode;
  /** Obligatorio si `execution_mode` es `externa`. */
  external_supplier_id?: number | null;
  /** Informe de la misma unidad y no cerrado. */
  incident_report_id?: number | null;
  /** Por defecto, el usuario autenticado. */
  responsible_id?: number | null;
  technical_notes?: string | null;
}

/** Checklist y cierre técnico (solo mantenciones `en_curso`). */
export interface UpdateMaintenanceRecordPayload {
  rev_a_approved?: boolean | null;
  rev_b_approved?: boolean | null;
  rev_c_approved?: boolean | null;
  pfg_approved?: boolean | null;
  requires_additional_maintenance?: boolean | null;
  applies_recf?: boolean | null;
  repair_cost?: number | null;
  spare_parts_used?: string | null;
  technical_notes?: string | null;
}

export interface FinishMaintenancePayload {
  result: MaintenanceResult;
  technical_notes?: string | null;
}

export interface CancelMaintenancePayload {
  /** Se agrega a `technical_notes`. */
  reason?: string | null;
}

/** `GET /maintenance-records/summary`: mantenciones por carrera del producto. */
export interface MaintenanceCareerSummary {
  /** `null` = productos sin carrera. */
  career_id: number | null;
  name: string;
  code: string | null;
  total: number;
  by_status: Record<MaintenanceStatus, number>;
  /** Unidades distintas con mantención. */
  units: number;
}

export interface MaintenanceSummary {
  careers: MaintenanceCareerSummary[];
  total: Omit<MaintenanceCareerSummary, 'career_id' | 'name' | 'code'>;
}

export interface MaintenanceSummaryQueryParams {
  year?: number;
  /** Fecha de inicio `YYYY-MM-DD`. */
  from?: string;
  to?: string;
}
