export interface Ubicacion {
  id: number;
  sala: string;
  cajon: string;
  descripcion?: string | null;
}

export type LocationTipo = 'sala' | 'panol' | 'taller' | 'bodega';

export interface LocationEntity {
  id: number;
  nombre: string;
  tipo: LocationTipo | string;
  sala?: string;
  cajon?: string | null;
  descripcion?: string | null;
  cajones_count?: number;
  cajones?: CajonEntity[];
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CajonEntity {
  id: number;
  codigo: string;
  descripcion?: string | null;
  location_id: number;
  location?: LocationEntity;
  products_count?: number;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface LocationQueryParams {
  search?: string;
  tipo?: LocationTipo | string;
  per_page?: number;
  page?: number;
}

export interface CajonQueryParams {
  location_id?: number;
  search?: string;
  per_page?: number;
  page?: number;
}

export interface CreateLocationPayload {
  nombre: string;
  tipo?: LocationTipo | string;
  descripcion?: string;
}

export interface UpdateLocationPayload {
  nombre?: string;
  tipo?: LocationTipo | string;
  descripcion?: string;
}

export interface CreateCajonPayload {
  location_id: number;
  codigo: string;
  descripcion?: string;
}

export interface UpdateCajonPayload {
  location_id?: number;
  codigo?: string;
  descripcion?: string;
}

export interface ProductLocationDetailResponse {
  product_id: number;
  product_name: string;
  cajon?: CajonEntity | null;
  location?: LocationEntity | null;
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
  location?: LocationEntity | Ubicacion | null;
  location_id?: number | null;
  cajon_id?: number | null;
  cajon?: CajonEntity | null;
  supplier_id?: number | null;
  supplier?: { id?: number; name?: string } | null;
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
  quantity?: number;
  stock?: number;
  stock_minimo?: number;
  stockCritico?: number;
  supplier_id?: number;
  location_id?: number;
  cajon_id?: number;
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
  location_id?: number;
  cajon_id?: number;
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
  cajon_id?: number;
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
  producto?: Producto;
  product_name?: string;
  stock?: number;
  stock_minimo?: number;
  alert_type: 'warning' | 'critical';
  is_resolved: boolean;
  resolved_at?: string | null;
  resolved_by?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CriticalStockAlertQueryParams {
  alert_type?: 'warning' | 'critical';
  is_resolved?: boolean;
  per_page?: number;
  page?: number;
}
