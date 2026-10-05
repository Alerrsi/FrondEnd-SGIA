export interface Ubicacion {
  id: number;
  sala: string;
  cajon: string;
  descripcion?: string | null;
}

export interface Producto {
  id: number;
  nombre: string;
  name?: string;
  codigoBarras: string;
  barcode?: string;
  description?: string | null;
  categoria?: string;
  marca?: string | null;
  modelo?: string | null;
  stock: number;
  quantity?: number;
  stockCritico: number;
  stock_minimo?: number;
  ubicacion: Ubicacion;
  location?: Ubicacion;
  location_id?: number | null;
  supplier_id?: number | null;
  area?: string | null;
  photo_url?: string | null;
  activo: boolean;
  is_active?: boolean;
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;
}

export interface CreateProductoPayload {
  name?: string;
  nombre?: string;
  description?: string;
  barcode?: string;
  codigoBarras?: string;
  quantity?: number;
  stock?: number;
  stock_minimo?: number;
  stockCritico?: number;
  supplier_id?: number;
  sala?: string;
  cajon?: string;
  area?: string;
  photo_url?: string;
  is_active?: boolean;
  categoria?: string;
  marca?: string;
  modelo?: string;
  ubicacionId?: number;
}

export interface UpdateProductoPayload {
  name?: string;
  nombre?: string;
  description?: string;
  barcode?: string;
  quantity?: number;
  stock?: number;
  stock_minimo?: number;
  stockCritico?: number;
  supplier_id?: number;
  sala?: string;
  cajon?: string;
  area?: string;
  photo_url?: string;
  is_active?: boolean;
}

export interface ExtraerFacturaPayload {
  archivo?: File;
  factura?: File;
}

export interface BorradorProducto {
  nombre?: string;
  name?: string;
  codigoBarras?: string;
  barcode?: string;
  categoria?: string;
  marca?: string;
  modelo?: string;
  stock?: number;
  quantity?: number;
  price?: number;
  precio?: number;
}

export interface InvoiceScanResponse {
  invoice_number?: string;
  numero_factura?: string;
  supplier_name?: string;
  supplier_id?: number;
  supplier?: { id?: number; name?: string };
  proveedor?: { id?: number; nombre?: string };
  products?: BorradorProducto[];
  draft_products?: BorradorProducto[];
  productos?: BorradorProducto[];
  items?: BorradorProducto[];
}

export interface ProductoParams {
  search?: string;
  query?: string;
  area?: string;
  is_active?: boolean;
  supplier_id?: number;
  location_id?: number;
  ubicacionId?: number;
  sala?: string;
  cajon?: string;
  critical_only?: boolean;
  soloStockCritico?: boolean;
  page?: number;
  per_page?: number;
  perPage?: number;
}

export interface ProductLocationPayload {
  location_id?: number;
  sala?: string;
  cajon?: string;
  descripcion?: string;
}

export interface ProductBarcodeResponse {
  barcode: string;
  svg: string;
  data_uri?: string;
  html?: string;
}

export interface CriticalStockAlert {
  id: number;
  product_id: number;
  product?: Producto;
  alert_type: 'warning' | 'critical';
  is_resolved: boolean;
}
