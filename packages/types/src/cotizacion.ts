export const QuotationStatus = {
  PENDIENTE: 'pendiente',
  EN_CAMINO: 'en_camino',
  COMPLETA: 'completa',
} as const;

export type QuotationStatus = (typeof QuotationStatus)[keyof typeof QuotationStatus];

export interface CotizacionItem {
  productoId: number;
  cantidad: number;
  precioUnitario?: number | null;
}

export interface Cotizacion {
  id: number;
  proveedor?: string | null;
  items: CotizacionItem[];
  estado: QuotationStatus;
  creadoPorId: number;
  fechaRequerida?: string | null;
  notas?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCotizacionPayload {
  proveedor?: string;
  items: CotizacionItem[];
  fechaRequerida?: string;
  notas?: string;
}

export interface CotizacionParams {
  estado?: QuotationStatus;
  page?: number;
  perPage?: number;
}