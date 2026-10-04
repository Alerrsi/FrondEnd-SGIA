export const QuotationStatus = {
  PENDIENTE: 'pendiente',
  EN_CAMINO: 'en_camino',
  COMPLETA: 'completa',
  RECHAZADA: 'rechazada',
} as const;

export type QuotationStatus = (typeof QuotationStatus)[keyof typeof QuotationStatus];

export interface Supplier {
  id: number;
  name: string;
  contact_name?: string | null;
  email: string;
  phone?: string | null;
  category?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSupplierPayload {
  name: string;
  contact_name?: string;
  email: string;
  phone?: string;
  category?: string;
}

export interface CotizacionItem {
  id?: number;
  productoId?: number;
  product_id?: number;
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
  products?: Array<{ id: number; quantity: number }>;
  supplier_ids?: number[];
  fechaRequerida?: string;
  notas?: string;
  notes?: string;
}

export interface CotizacionParams {
  estado?: QuotationStatus;
  status?: QuotationStatus;
  page?: number;
  perPage?: number;
  per_page?: number;
}

export const PurchaseStatus = {
  PENDIENTE: 'pendiente',
  EN_CAMINO: 'en_camino',
  COMPLETA: 'completa',
  RECHAZADA: 'rechazada',
} as const;

export type PurchaseStatus = (typeof PurchaseStatus)[keyof typeof PurchaseStatus];

export interface PurchaseOrder {
  id: number;
  quotation_id?: number | null;
  supplier_id: number;
  supplier?: Supplier;
  items: CotizacionItem[];
  status: PurchaseStatus;
  total_amount?: number;
  invoice_number?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePurchasePayload {
  quotation_id?: number;
  supplier_id: number;
  items: Array<{ product_id: number; quantity: number; unit_price?: number }>;
  notes?: string;
}
