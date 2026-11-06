import type { InvoiceIntake } from './ingreso-factura';
import type { BudgetMovement } from './presupuesto';

export const QuotationStatus = {
  BORRADOR: 'borrador',
  ENVIADA: 'enviada',
  PARCIAL: 'parcial',
  RESPONDIDA: 'respondida',
  ACEPTADA: 'aceptada',
  RECHAZADA: 'rechazada',
  CANCELADA: 'cancelada',
  CONVERTIDA: 'convertida',
  PENDIENTE: 'pendiente',
  EN_CAMINO: 'en_camino',
  COMPLETA: 'completa',
} as const;

export type QuotationStatus = (typeof QuotationStatus)[keyof typeof QuotationStatus];

export interface Supplier {
  id: number;
  name: string;
  contact_name?: string | null;
  email: string;
  phone?: string | null;
  category?: string | null;
  rut?: string | null;
  address?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSupplierPayload {
  name: string;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  category?: string | null;
  rut?: string | null;
  address?: string | null;
  is_active?: boolean;
}

export interface SupplierQueryParams {
  search?: string;
  category?: string;
  is_active?: boolean;
  per_page?: number;
  page?: number;
}

export interface CotizacionItem {
  id?: number;
  productoId?: number;
  product_id?: number;
  name?: string;
  cantidad?: number;
  quantity?: number;
  precioUnitario?: number | null;
  unit_price?: number | null;
}

export interface Cotizacion {
  id: number;
  proveedor?: string | null;
  supplier_ids?: number[];
  suppliers?: Supplier[];
  items: CotizacionItem[];
  products?: CotizacionItem[];
  estado: QuotationStatus;
  status?: QuotationStatus;
  creadoPorId: number;
  fechaRequerida?: string | null;
  expires_at?: string | null;
  notas?: string | null;
  notes?: string | null;
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;
}

export interface CreateCotizacionPayload {
  proveedor?: string;
  items?: CotizacionItem[];
  products?: Array<{ id: number; quantity: number; name?: string }>;
  supplier_ids?: number[];
  fechaRequerida?: string;
  expires_at?: string;
  notas?: string;
  notes?: string;
}

export interface CotizacionParams {
  estado?: QuotationStatus | string;
  status?: QuotationStatus | string;
  supplier_id?: number;
  search?: string;
  page?: number;
  perPage?: number;
  per_page?: number;
}

export interface QuotationResponsePayload {
  supplier_id: number;
  status: 'aceptada' | 'rechazada';
  offer_total?: number;
  quotation_number?: string;
  notes?: string;
  items?: Array<{ product_id: number; offered_unit_price: number }>;
}

export const PurchaseStatus = {
  PENDIENTE: 'pendiente',
  EN_CAMINO: 'en_camino',
  COMPLETA: 'completa',
  CANCELADA: 'cancelada',
} as const;

export type PurchaseStatus = (typeof PurchaseStatus)[keyof typeof PurchaseStatus];

export interface PurchaseItem {
  id?: number;
  name?: string;
  quantity: number;
  unit_price?: number | null;
  subtotal?: number | null;
  product_id?: number | null;
}

export interface PurchaseOrder {
  id: number;
  code?: string | null;
  quotation_id?: number | null;
  quotation_reference?: string | null;
  supplier_id: number;
  supplier?: Supplier;
  items: PurchaseItem[];
  status: PurchaseStatus;
  total_amount?: number;
  /** Presupuesto anual que financia la compra (REQ-16). */
  annual_budget_id?: number | null;
  /** Monto reservado vigente; vuelve a 0 al cancelar o al confirmar la factura. */
  reserved_amount?: number;
  expected_at?: string | null;
  received_at?: string | null;
  guide_number?: string | null;
  invoice_number?: string | null;
  arrival_document_url?: string | null;
  notes?: string | null;
  allowed_transitions?: PurchaseStatus[];
  created_at: string;
  updated_at: string;
}

/** Respuesta de `GET /api/purchases/{id}/trace`. */
export interface PurchaseTrace {
  purchase: PurchaseOrder;
  quotations: Cotizacion[];
  invoices: InvoiceIntake[];
  budget_movements: BudgetMovement[];
  stock_entries: { product_id: number; name: string; quantity: number }[];
}

export interface CreatePurchasePayload {
  /** Obligatorio: el total se reserva en este presupuesto. */
  annual_budget_id: number;
  quotation_id?: number | null;
  /** Obligatoria con `quotation_id` si respondieron menos de 3 proveedores. */
  quotation_justification?: string;
  /** Mín. 3 cotizaciones `aceptada` distintas; `supplier_id` debe estar contactado en todas. */
  quotation_ids?: number[];
  supplier_id?: number;
  quotation_reference?: string | null;
  expected_at?: string | null;
  notes?: string | null;
  items?: Array<{
    name?: string;
    product_id?: number;
    quantity: number;
    unit_price: number;
  }>;
}

export interface PurchaseQueryParams {
  status?: PurchaseStatus | string;
  estado?: PurchaseStatus | string;
  supplier_id?: number;
  quotation_id?: number;
  /** OC que esperan factura (selector manual de ingreso de factura). */
  linkable?: boolean;
  search?: string;
  per_page?: number;
  page?: number;
}

export interface PurchaseArrivalScanPayload {
  document?: File | Blob | null;
  guide_number?: string | null;
  invoice_number?: string | null;
}
