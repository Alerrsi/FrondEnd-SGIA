import type { Supplier } from './cotizacion';
import type { AnnualBudget } from './presupuesto';

// Nuevo flujo de compras (NUEVO-FLUJO-COMPRAS.md §5): solicitud → aprobación → envío por áreas
// → cotizaciones subidas (mín. 3) → OC externa → factura.

/** Áreas fijas de proveedor (`supplier_areas.area`). */
export const SUPPLIER_AREAS = ['informatica', 'diseno', 'telecomunicaciones', 'ciberseguridad'] as const;

export type SupplierArea = (typeof SUPPLIER_AREAS)[number];

export const SUPPLIER_AREA_LABELS: Record<SupplierArea, string> = {
  informatica: 'Informática',
  diseno: 'Diseño',
  telecomunicaciones: 'Telecomunicaciones',
  ciberseguridad: 'Ciberseguridad',
};

export const PurchaseRequestStatus = {
  BORRADOR: 'borrador',
  APROBADA: 'aprobada',
  ENVIADA: 'enviada',
  COTIZADA: 'cotizada',
  CON_OC: 'con_oc',
  FACTURADA: 'facturada',
  CANCELADA: 'cancelada',
} as const;

export type PurchaseRequestStatus =
  (typeof PurchaseRequestStatus)[keyof typeof PurchaseRequestStatus];

/** Mínimo de cotizaciones subidas para poder elegir una. */
export const MIN_PURCHASE_REQUEST_QUOTATIONS = 3;

export interface PurchaseRequestItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
}

export type PurchaseRequestEmailStatus = 'enviado' | 'fallido' | 'pendiente';

/** Proveedor contactado al enviar (`PurchaseRequestSupplierResource`). */
export interface PurchaseRequestSupplier {
  id: number;
  supplier_id: number;
  supplier?: Supplier;
  email_status: PurchaseRequestEmailStatus;
  email_sent_at: string | null;
  email_error: string | null;
}

export interface PurchaseRequestQuotationItem {
  purchase_request_item_id: number;
  unit_price: number;
}

/** Cotización recibida y subida a mano por DIR-01 (`PurchaseRequestQuotationResource`). */
export interface PurchaseRequestQuotation {
  id: number;
  supplier_id: number;
  supplier?: Supplier;
  total: number;
  has_file: boolean;
  original_name: string | null;
  received_at: string | null;
  uploaded_by: number | null;
  items: PurchaseRequestQuotationItem[];
  created_at?: string;
}

/** OC emitida fuera del sistema (`PurchaseResource` en `order`; `purchases.order_number`). */
export interface PurchaseRequestOrder {
  id: number;
  code: string | null;
  order_number: string | null;
  status: string;
  supplier_name: string | null;
  total_amount: number;
  reserved_amount: number;
  has_order_file: boolean;
}

export interface PurchaseRequestInvoice {
  id: number;
  document_number: string | null;
  status: string;
  total_deducted: number;
}

/**
 * Acciones que el estado permite (`can_*` del `PurchaseRequestResource`). El rol lo decide el
 * cliente: solo DIR-01 escribe.
 */
export interface PurchaseRequestActions {
  can_edit: boolean;
  can_approve: boolean;
  can_send: boolean;
  can_resend: boolean;
  can_upload_quotation: boolean;
  can_remove_quotation: boolean;
  can_select_quotation: boolean;
  can_issue_order: boolean;
  can_cancel: boolean;
}

export interface PurchaseRequest {
  id: number;
  /** `SC-AAAA-NNNN`. */
  code: string;
  status: PurchaseRequestStatus;
  /** Etiqueta del backend (`status_label`); `null` si no viene. */
  status_label: string | null;
  annual_budget_id: number;
  annual_budget?: AnnualBudget;
  created_by: number | null;
  creator_name: string | null;
  approved_by: number | null;
  approver_name: string | null;
  approved_at: string | null;
  sent_at: string | null;
  selected_quotation_id: number | null;
  notes: string | null;
  items: PurchaseRequestItem[];
  areas: SupplierArea[];
  suppliers: PurchaseRequestSupplier[];
  quotations: PurchaseRequestQuotation[];
  quotations_count: number;
  /** `min_quotations` del backend (3). */
  min_quotations: number;
  actions: PurchaseRequestActions;
  order: PurchaseRequestOrder | null;
  invoices: PurchaseRequestInvoice[];
  created_at: string;
  updated_at: string;
}

export interface PurchaseRequestQueryParams {
  status?: PurchaseRequestStatus;
  code?: string;
  /** `AAAA-MM-DD`. */
  from?: string;
  to?: string;
  per_page?: number;
  page?: number;
}

export interface PurchaseRequestItemPayload {
  product_id: number;
  quantity: number;
}

export interface CreatePurchaseRequestPayload {
  annual_budget_id: number;
  items: PurchaseRequestItemPayload[];
  notes?: string | null;
}

export type UpdatePurchaseRequestPayload = Partial<CreatePurchaseRequestPayload>;

export interface SendPurchaseRequestPayload {
  areas: SupplierArea[];
}

export interface UploadPurchaseRequestQuotationPayload {
  supplier_id: number;
  file: File;
  total: number;
  /** `AAAA-MM-DD`; por defecto, ahora. */
  received_at?: string;
  /** Uno por **cada** ítem de la solicitud (`items` con `size` = ítems). */
  items: PurchaseRequestQuotationItem[];
}

export interface UploadPurchaseRequestOrderPayload {
  file: File;
  order_number: string;
}
