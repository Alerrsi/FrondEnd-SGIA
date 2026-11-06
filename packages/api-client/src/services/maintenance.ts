import type {
  CancelMaintenancePayload,
  CreateMaintenanceRecordPayload,
  FinishMaintenancePayload,
  IncidentReport,
  MaintenanceDocument,
  MaintenanceDocumentQueryParams,
  MaintenanceDocumentType,
  MaintenanceExecutionMode,
  MaintenanceRecord,
  MaintenanceRecordQueryParams,
  MaintenanceResult,
  MaintenanceStatus,
  MaintenanceSummary,
  MaintenanceSummaryQueryParams,
  MaintenanceType,
  PaginatedResponse,
  Supplier,
  UpdateMaintenanceRecordPayload,
  UploadMaintenanceDocumentPayload,
  Usuario,
} from '@sgia/types';
import { del, get, getBlob, patch, post } from '../http';
import {
  buildQuery,
  toNullableAmount,
  toPaginated,
  unwrap,
  type Amount,
  type RawPaginated,
} from './shared';

// Mantenciones (FU-05 / REQ-18) y documentos de mantenimiento (REQ-19).

// ---------------------------------------------------------------------------
// Documentos
// ---------------------------------------------------------------------------

export interface RawMaintenanceDocument {
  id: number;
  equipment_unit_id: number;
  maintenance_record_id?: number | null;
  document_type: MaintenanceDocumentType;
  title: string;
  original_name?: string | null;
  file_name?: string | null;
  valid_until?: string | null;
  is_expired?: boolean | number | null;
  file_url?: string | null;
  uploaded_by?: number | null;
  uploader?: Usuario | null;
  created_at?: string;
  updated_at?: string;
}

/** `YYYY-MM-DD` de hoy en hora local; las fechas de vencimiento son solo-fecha. */
function todayIso(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${mm}-${dd}`;
}

export function normalizeMaintenanceDocument(raw: RawMaintenanceDocument): MaintenanceDocument {
  const validUntil = raw.valid_until ? raw.valid_until.slice(0, 10) : null;
  return {
    id: raw.id,
    equipment_unit_id: raw.equipment_unit_id,
    maintenance_record_id: raw.maintenance_record_id ?? null,
    document_type: raw.document_type,
    title: raw.title,
    original_name: raw.original_name ?? raw.file_name ?? null,
    valid_until: validUntil,
    // El backend informa `is_expired`; si faltara se deduce de la fecha.
    is_expired:
      raw.is_expired !== undefined && raw.is_expired !== null
        ? Boolean(raw.is_expired)
        : validUntil !== null && validUntil < todayIso(),
    file_url: raw.file_url ?? null,
    uploaded_by: raw.uploaded_by ?? null,
    uploader: raw.uploader ?? null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

export async function fetchUnitMaintenanceDocuments(
  unitId: number,
  params?: MaintenanceDocumentQueryParams,
): Promise<PaginatedResponse<MaintenanceDocument>> {
  const res = await get<RawPaginated<RawMaintenanceDocument>>(
    `/equipment-units/${unitId}/maintenance-documents${buildQuery(params)}`,
  );
  return toPaginated(res, normalizeMaintenanceDocument);
}

/** `multipart/form-data`; PDF de hasta 10 MB. Límite de 10 solicitudes por minuto. */
export async function uploadMaintenanceDocument(
  unitId: number,
  payload: UploadMaintenanceDocumentPayload,
): Promise<MaintenanceDocument> {
  const form = new FormData();
  form.append('document_type', payload.document_type);
  form.append('title', payload.title);
  form.append('file', payload.file);
  if (payload.valid_until) form.append('valid_until', payload.valid_until);
  if (payload.maintenance_record_id) {
    form.append('maintenance_record_id', String(payload.maintenance_record_id));
  }
  return normalizeMaintenanceDocument(
    unwrap(
      await post<FormData, { data?: RawMaintenanceDocument } | RawMaintenanceDocument>(
        `/equipment-units/${unitId}/maintenance-documents`,
        form,
      ),
    ),
  );
}

/** Descarga autenticada del PDF: `file_url` no sirve en un `<a href>` (disco privado). */
export async function downloadMaintenanceDocumentFile(id: number): Promise<Blob> {
  return getBlob(`/maintenance-documents/${id}/file`);
}

export async function deleteMaintenanceDocument(id: number): Promise<void> {
  await del<void>(`/maintenance-documents/${id}`);
}

// ---------------------------------------------------------------------------
// Mantenciones
// ---------------------------------------------------------------------------

type RawBool = boolean | number | string | null | undefined;

export interface RawMaintenanceRecord {
  id: number;
  equipment_unit_id: number;
  equipment_unit?: MaintenanceRecord['equipment_unit'];
  incident_report_id?: number | null;
  incident_report?: IncidentReport | null;
  maintenance_type: MaintenanceType;
  execution_mode?: MaintenanceExecutionMode | null;
  external_supplier_id?: number | null;
  external_supplier?: Supplier | null;
  responsible_id?: number | null;
  responsible?: Usuario | null;
  status: MaintenanceStatus;
  result?: MaintenanceResult | null;
  rev_a_approved?: RawBool;
  rev_b_approved?: RawBool;
  rev_c_approved?: RawBool;
  pfg_approved?: RawBool;
  requires_additional_maintenance?: RawBool;
  applies_recf?: RawBool;
  repair_cost?: Amount;
  spare_parts_used?: string | null;
  technical_notes?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  documents?: RawMaintenanceDocument[];
  created_at?: string;
  updated_at?: string;
}

/** `null` se conserva: en el checklist significa "No aplica" / "sin definir". */
function toNullableBool(value: RawBool): boolean | null {
  if (value === null || value === undefined || value === '') return null;
  if (value === 'false' || value === '0') return false;
  return Boolean(value);
}

export function normalizeMaintenanceRecord(raw: RawMaintenanceRecord): MaintenanceRecord {
  return {
    id: raw.id,
    equipment_unit_id: raw.equipment_unit_id,
    equipment_unit: raw.equipment_unit ?? null,
    incident_report_id: raw.incident_report_id ?? null,
    incident_report: raw.incident_report ?? null,
    maintenance_type: raw.maintenance_type,
    execution_mode: raw.execution_mode ?? 'medios_propios',
    external_supplier_id: raw.external_supplier_id ?? null,
    external_supplier: raw.external_supplier ?? null,
    responsible_id: raw.responsible_id ?? null,
    responsible: raw.responsible ?? null,
    status: raw.status,
    result: raw.result ?? null,
    rev_a_approved: toNullableBool(raw.rev_a_approved),
    rev_b_approved: toNullableBool(raw.rev_b_approved),
    rev_c_approved: toNullableBool(raw.rev_c_approved),
    pfg_approved: toNullableBool(raw.pfg_approved),
    requires_additional_maintenance: toNullableBool(raw.requires_additional_maintenance),
    applies_recf: toNullableBool(raw.applies_recf),
    repair_cost: toNullableAmount(raw.repair_cost),
    spare_parts_used: raw.spare_parts_used ?? null,
    technical_notes: raw.technical_notes ?? null,
    started_at: raw.started_at ?? raw.created_at ?? null,
    finished_at: raw.finished_at ?? null,
    documents: (raw.documents ?? []).map(normalizeMaintenanceDocument),
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

type RecordResponse = { data?: RawMaintenanceRecord } | RawMaintenanceRecord;

/** Listado global ordenado por prioridad del producto (A primero) y fecha de inicio (reciente primero). */
export async function fetchMaintenanceRecords(
  params?: MaintenanceRecordQueryParams,
): Promise<PaginatedResponse<MaintenanceRecord>> {
  const res = await get<RawPaginated<RawMaintenanceRecord>>(
    `/maintenance-records${buildQuery(params)}`,
  );
  return toPaginated(res, normalizeMaintenanceRecord);
}

/** Totales por carrera con desglose por estado (el backend ya devuelve números). */
export async function fetchMaintenanceSummary(
  params?: MaintenanceSummaryQueryParams,
): Promise<MaintenanceSummary> {
  return unwrap(await get<{ data: MaintenanceSummary }>(`/maintenance-records/summary${buildQuery(params)}`));
}

export async function fetchMaintenanceRecord(id: number): Promise<MaintenanceRecord> {
  return normalizeMaintenanceRecord(
    unwrap(await get<RecordResponse>(`/maintenance-records/${id}`)),
  );
}

/** Historial de una unidad (más reciente primero), con `documents`. */
export async function fetchUnitMaintenanceRecords(
  unitId: number,
  params?: { per_page?: number; page?: number },
): Promise<PaginatedResponse<MaintenanceRecord>> {
  const res = await get<RawPaginated<RawMaintenanceRecord>>(
    `/equipment-units/${unitId}/maintenance-records${buildQuery(params)}`,
  );
  return toPaginated(res, normalizeMaintenanceRecord);
}

/**
 * Abre una mantención `en_curso`: la unidad pasa a `en_reparacion` y el informe asociado también.
 * `422` si la unidad está `prestado` o `dado_de_baja`, o ya tiene una mantención en curso (`equipment_unit_id`).
 */
export async function createMaintenanceRecord(
  unitId: number,
  payload: CreateMaintenanceRecordPayload,
): Promise<MaintenanceRecord> {
  return normalizeMaintenanceRecord(
    unwrap(
      await post<CreateMaintenanceRecordPayload, RecordResponse>(
        `/equipment-units/${unitId}/maintenance-records`,
        payload,
      ),
    ),
  );
}

/** Checklist y cierre técnico (solo `en_curso`; si no, `422` en `status`). */
export async function updateMaintenanceRecord(
  id: number,
  payload: UpdateMaintenanceRecordPayload,
): Promise<MaintenanceRecord> {
  return normalizeMaintenanceRecord(
    unwrap(
      await patch<UpdateMaintenanceRecordPayload, RecordResponse>(
        `/maintenance-records/${id}`,
        payload,
      ),
    ),
  );
}

/**
 * Cierra la mantención. `operativo` exige REV-A, REV-B y PFG aprobadas (y REV-C si no es `null`);
 * si no, `422` en `checklist`. `baja` deja la unidad `dado_de_baja`.
 */
export async function finishMaintenanceRecord(
  id: number,
  payload: FinishMaintenancePayload,
): Promise<MaintenanceRecord> {
  return normalizeMaintenanceRecord(
    unwrap(
      await post<FinishMaintenancePayload, RecordResponse>(
        `/maintenance-records/${id}/finish`,
        payload,
      ),
    ),
  );
}

/** Anula: la unidad y el informe vuelven al estado que tenían al abrir la mantención. */
export async function cancelMaintenanceRecord(
  id: number,
  payload?: CancelMaintenancePayload,
): Promise<MaintenanceRecord> {
  return normalizeMaintenanceRecord(
    unwrap(
      await post<CancelMaintenancePayload, RecordResponse>(
        `/maintenance-records/${id}/cancel`,
        payload,
      ),
    ),
  );
}
