import type { CajonEntity } from './producto';

export type EquipmentUnitStatus = 'disponible' | 'prestado' | 'en_reparacion' | 'dado_de_baja';

export type UnitReturnCondition = 'bueno' | 'regular' | 'danado' | 'extraviado';

export type ProductType = 'equipo' | 'insumo' | 'maqueta';

export type MaintenancePriority = 'A' | 'B' | 'C';

export type IncidentRequestType = 'falla' | 'reposicion' | 'mantencion';

export interface EquipmentUnitActiveLoan {
  id: number;
  code?: string;
  borrower_name?: string | null;
  loan_date?: string | null;
}

export interface EquipmentUnit {
  id: number;
  code: string;
  serial_number?: string | null;
  status: EquipmentUnitStatus;
  product_id: number;
  product?: { id: number; name: string; type?: ProductType } | null;
  cajon_id?: number | null;
  cajon?: CajonEntity | null;
  last_maintenance_at?: string | null;
  next_maintenance_at?: string | null;
  active_loan?: EquipmentUnitActiveLoan | null;
  created_at?: string;
  updated_at?: string;
}

export interface EquipmentUnitQueryParams {
  product_id?: number;
  status?: EquipmentUnitStatus;
  cajon_id?: number;
  location_id?: number;
  storeroom_id?: string;
  search?: string;
  maintenance_due?: boolean;
  per_page?: number;
  page?: number;
}

export interface CreateEquipmentUnitsPayload {
  code?: string;
  serial_number?: string;
  count?: number;
  serial_numbers?: string[];
  cajon_id: number;
}

export interface UpdateEquipmentUnitPayload {
  code?: string;
  serial_number?: string | null;
  cajon_id?: number;
  last_maintenance_at?: string | null;
  next_maintenance_at?: string | null;
}

export interface EquipmentUnitBarcodeResponse {
  barcode: string;
  svg: string;
  data_uri?: string;
  html?: string;
}

export interface Career {
  id: number;
  name: string;
  code?: string | null;
  level: 'tecnico' | 'profesional';
  level_label?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CareerQueryParams {
  level?: 'tecnico' | 'profesional';
  search?: string;
  per_page?: number;
  page?: number;
}

export interface CreateCareerPayload {
  name: string;
  level: 'tecnico' | 'profesional';
  code?: string;
}

export type UpdateCareerPayload = Partial<CreateCareerPayload>;

export interface Category {
  id: number;
  name: string;
  description?: string | null;
}

export interface CategoryQueryParams {
  search?: string;
  per_page?: number;
  page?: number;
}
