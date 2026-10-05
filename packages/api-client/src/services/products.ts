import type {
  BorradorProducto,
  CreateProductoPayload,
  CriticalStockAlert,
  InvoiceScanResponse,
  PaginatedResponse,
  ProductBarcodeResponse,
  ProductLocationPayload,
  Producto,
  ProductoParams,
  Ubicacion,
  UpdateProductoPayload,
} from '@sgia/types';
import { del, get, patch, post } from '../http';

function normalizeUbicacion(rawLoc: any): Ubicacion {
  return {
    id: rawLoc?.id ?? 0,
    sala: rawLoc?.sala ?? '',
    cajon: rawLoc?.cajon ?? '',
    descripcion: rawLoc?.descripcion ?? rawLoc?.description ?? null,
  };
}

export function normalizeProducto(raw: any): Producto {
  if (!raw) return raw;
  const stock = raw.quantity ?? raw.stock ?? 0;
  const stockCritico = raw.stock_minimo ?? raw.stockCritico ?? 0;
  const ubicacion = normalizeUbicacion(raw.location ?? raw.ubicacion);

  return {
    id: raw.id,
    nombre: raw.name ?? raw.nombre ?? '',
    name: raw.name ?? raw.nombre ?? '',
    codigoBarras: raw.barcode ?? raw.codigoBarras ?? '',
    barcode: raw.barcode ?? raw.codigoBarras ?? '',
    description: raw.description ?? raw.descripcion ?? null,
    categoria: raw.categoria ?? raw.category ?? '',
    marca: raw.marca ?? raw.brand ?? null,
    modelo: raw.modelo ?? raw.model ?? null,
    stock,
    quantity: stock,
    stockCritico,
    stock_minimo: stockCritico,
    ubicacion,
    location: ubicacion,
    location_id: raw.location_id ?? ubicacion?.id ?? null,
    supplier_id: raw.supplier_id ?? null,
    area: raw.area ?? null,
    photo_url: raw.photo_url ?? null,
    activo: raw.activo ?? raw.is_active ?? true,
    is_active: raw.is_active ?? raw.activo ?? true,
    createdAt: raw.createdAt ?? raw.created_at ?? '',
    created_at: raw.created_at ?? raw.createdAt ?? '',
    updatedAt: raw.updatedAt ?? raw.updated_at ?? '',
    updated_at: raw.updated_at ?? raw.updatedAt ?? '',
  };
}

function normalizePaginatedProductos(res: any): PaginatedResponse<Producto> {
  const rawList = Array.isArray(res) ? res : res?.data ?? [];
  const data = rawList.map(normalizeProducto);
  const meta = res?.meta ?? {
    currentPage: res?.current_page ?? 1,
    lastPage: res?.last_page ?? 1,
    perPage: res?.per_page ?? data.length,
    total: res?.total ?? data.length,
  };
  return { data, meta };
}

export async function fetchProducts(params?: ProductoParams): Promise<PaginatedResponse<Producto>> {
  const query = new URLSearchParams();
  const search = params?.search ?? params?.query;
  if (search) query.set('search', search);
  if (params?.area) query.set('area', params.area);
  if (params?.is_active !== undefined) query.set('is_active', String(params.is_active));
  if (params?.supplier_id) query.set('supplier_id', String(params.supplier_id));

  const locationId = params?.location_id ?? params?.ubicacionId;
  if (locationId) query.set('location_id', String(locationId));
  if (params?.sala) query.set('sala', params.sala);
  if (params?.cajon) query.set('cajon', params.cajon);

  const criticalOnly = params?.critical_only ?? params?.soloStockCritico;
  if (criticalOnly) query.set('critical_only', '1');

  if (params?.page) query.set('page', String(params.page));
  const perPage = params?.per_page ?? params?.perPage;
  if (perPage) query.set('per_page', String(perPage));

  const qs = query.toString();
  const response = await get<any>(`/products${qs ? `?${qs}` : ''}`);
  return normalizePaginatedProductos(response);
}

export async function fetchProduct(id: number): Promise<Producto> {
  const response = await get<any>(`/products/${id}`);
  return normalizeProducto(response?.data ?? response);
}

export async function createProducto(payload: CreateProductoPayload): Promise<Producto> {
  const body: Record<string, any> = {
    name: payload.name ?? payload.nombre,
    description: payload.description,
    quantity: payload.quantity ?? payload.stock ?? 0,
    stock_minimo: payload.stock_minimo ?? payload.stockCritico ?? 5,
    supplier_id: payload.supplier_id,
    sala: payload.sala,
    cajon: payload.cajon,
    area: payload.area,
    photo_url: payload.photo_url,
    is_active: payload.is_active ?? true,
    categoria: payload.categoria,
    marca: payload.marca,
    modelo: payload.modelo,
    location_id: payload.ubicacionId,
  };

  const code = payload.barcode ?? payload.codigoBarras;
  if (code && code.trim()) {
    body.barcode = code.trim();
  }

  const response = await post<any, any>('/products', body);
  return normalizeProducto(response?.data ?? response);
}

export async function updateProducto(
  id: number,
  payload: UpdateProductoPayload,
): Promise<Producto> {
  const body: Record<string, any> = {};
  if (payload.name !== undefined || payload.nombre !== undefined) {
    body.name = payload.name ?? payload.nombre;
  }
  if (payload.description !== undefined) body.description = payload.description;
  if (payload.barcode !== undefined) body.barcode = payload.barcode;
  if (payload.quantity !== undefined || payload.stock !== undefined) {
    body.quantity = payload.quantity ?? payload.stock;
  }
  if (payload.stock_minimo !== undefined || payload.stockCritico !== undefined) {
    body.stock_minimo = payload.stock_minimo ?? payload.stockCritico;
  }
  if (payload.supplier_id !== undefined) body.supplier_id = payload.supplier_id;
  if (payload.sala !== undefined) body.sala = payload.sala;
  if (payload.cajon !== undefined) body.cajon = payload.cajon;
  if (payload.area !== undefined) body.area = payload.area;
  if (payload.photo_url !== undefined) body.photo_url = payload.photo_url;
  if (payload.is_active !== undefined) body.is_active = payload.is_active;

  const response = await patch<any, any>(`/products/${id}`, body);
  return normalizeProducto(response?.data ?? response);
}

export async function deleteProducto(id: number): Promise<void> {
  return del<void>(`/products/${id}`);
}

export async function setProductoActivo(id: number, is_active: boolean): Promise<Producto> {
  const response = await patch<{ is_active: boolean }, any>(`/products/${id}/status`, {
    is_active,
  });
  return normalizeProducto(response?.data ?? response);
}

export async function fetchProductLocation(id: number): Promise<Ubicacion> {
  const response = await get<any>(`/products/${id}/location`);
  return normalizeUbicacion(response?.data ?? response);
}

export async function updateProductLocation(
  id: number,
  payload: ProductLocationPayload,
): Promise<Ubicacion> {
  const response = await patch<ProductLocationPayload, any>(`/products/${id}/location`, payload);
  return normalizeUbicacion(response?.data ?? response);
}

export async function fetchProductBarcode(id: number): Promise<ProductBarcodeResponse> {
  const response = await get<any>(`/products/${id}/barcode`);
  const data = response?.data ?? response;
  return {
    barcode: data?.barcode ?? '',
    svg: data?.barcode_svg ?? data?.svg ?? '',
    data_uri: data?.barcode_image_uri ?? data?.data_uri,
    html: data?.barcode_html ?? data?.html,
  };
}

export async function extractFactura(file: File): Promise<InvoiceScanResponse> {
  const form = new FormData();
  form.append('invoice_file', file);
  form.append('document', file);
  form.append('factura', file);
  const response = await post<FormData, any>('/invoices/scan', form);
  const data = response?.data ?? response;
  const rawItems = data?.draft_products ?? data?.products ?? data?.items ?? [];

  const items: BorradorProducto[] = rawItems.map((item: any) => ({
    nombre: item.name ?? item.nombre ?? '',
    name: item.name ?? item.nombre ?? '',
    codigoBarras: item.barcode ?? item.codigoBarras,
    barcode: item.barcode ?? item.codigoBarras,
    quantity: item.quantity ?? item.stock ?? 1,
    stock: item.quantity ?? item.stock ?? 1,
    price: item.unit_price ?? item.price ?? item.precio ?? 0,
    precio: item.unit_price ?? item.price ?? item.precio ?? 0,
    categoria: item.categoria ?? item.category,
    marca: item.marca ?? item.brand,
    modelo: item.modelo ?? item.model,
  }));

  const supplier = data?.supplier ?? (data?.supplier_name ? { name: data.supplier_name, id: data.supplier_id } : undefined);

  return {
    invoice_number: data?.invoice_number ?? data?.numero_factura,
    numero_factura: data?.invoice_number ?? data?.numero_factura,
    supplier,
    proveedor: supplier,
    products: items,
    productos: items,
    items,
  };
}

export async function fetchCriticalStockAlerts(params?: {
  alert_type?: 'warning' | 'critical';
  is_resolved?: boolean;
  per_page?: number;
}): Promise<PaginatedResponse<CriticalStockAlert>> {
  const query = new URLSearchParams();
  if (params?.alert_type) query.set('alert_type', params.alert_type);
  if (params?.is_resolved !== undefined) query.set('is_resolved', String(params.is_resolved));
  if (params?.per_page) query.set('per_page', String(params.per_page));

  const qs = query.toString();
  return get<PaginatedResponse<CriticalStockAlert>>(`/alerts/critical-stock${qs ? `?${qs}` : ''}`);
}

export async function resolveStockAlert(id: number): Promise<CriticalStockAlert> {
  return patch<void, CriticalStockAlert>(`/alerts/${id}/resolve`);
}
