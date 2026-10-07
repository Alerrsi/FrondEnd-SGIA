import type {
  BorradorProducto,
  CreateProductoPayload,
  CriticalStockAlert,
  CriticalStockAlertQueryParams,
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

export function normalizeUbicacion(rawLoc: any, rawCajon?: any): Ubicacion {
  if (!rawLoc && !rawCajon) {
    return { id: 0, sala: '', cajon: '', descripcion: null };
  }
  const loc = rawLoc?.location ?? rawLoc;
  const cajonObj = rawCajon ?? rawLoc?.cajon;

  const sala = loc?.sala ?? loc?.nombre ?? '';
  const cajon =
    (typeof cajonObj === 'string'
      ? cajonObj
      : cajonObj?.codigo ?? cajonObj?.nombre ?? rawLoc?.cajon_nombre) || '';
  const descripcion =
    loc?.descripcion ?? loc?.description ?? cajonObj?.descripcion ?? cajonObj?.description ?? null;

  return {
    id: loc?.id ?? (typeof rawLoc?.id === 'number' ? rawLoc.id : 0),
    sala,
    cajon,
    descripcion,
  };
}

export function normalizeProducto(raw: any): Producto {
  if (raw === null) return null as unknown as Producto;
  if (raw === undefined) return undefined as unknown as Producto;

  const stock = Number(raw.stock ?? raw.quantity ?? raw.cantidad ?? 0);
  const stockCritico = Number(
    raw.stockCritico ?? raw.stock_minimo ?? raw.stockMinimo ?? raw.min_stock ?? 0,
  );
  const ubicacion = normalizeUbicacion(
    raw.ubicacion ?? raw.location,
    raw.cajon ?? raw.cajon_entity,
  );

  return {
    id: raw.id,
    nombre: raw.nombre ?? raw.name ?? '',
    name: raw.nombre ?? raw.name ?? '',
    codigoBarras: raw.codigoBarras ?? raw.barcode ?? raw.sku ?? '',
    barcode: raw.codigoBarras ?? raw.barcode ?? raw.sku ?? '',
    description: raw.description ?? raw.descripcion ?? null,
    categoria: raw.categoria ?? raw.category?.nombre ?? raw.category?.name ?? 'General',
    marca: raw.marca ?? raw.brand ?? null,
    modelo: raw.modelo ?? raw.model ?? null,
    stock,
    quantity: stock,
    stockCritico,
    stock_minimo: stockCritico,
    ubicacion,
    location: raw.location ?? ubicacion,
    location_id: raw.location_id ?? raw.ubicacion_id ?? (ubicacion.id || null),
    cajon_id: raw.cajon_id ?? null,
    cajon: raw.cajon ?? null,
    supplier_id: raw.supplier_id ?? raw.proveedor_id ?? null,
    supplier: raw.supplier ?? raw.proveedor ?? null,
    area: raw.area ?? null,
    photo_url: raw.photo_url ?? raw.foto ?? null,
    activo: Boolean(raw.activo ?? raw.is_active ?? true),
    is_active: Boolean(raw.activo ?? raw.is_active ?? true),
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
    created_at: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? raw.updated_at ?? new Date().toISOString(),
    updated_at: raw.updatedAt ?? raw.updated_at ?? new Date().toISOString(),
  };
}

export async function fetchProducts(
  params?: ProductoParams,
): Promise<PaginatedResponse<Producto>> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.query) query.set('search', params.query);
  if (params?.area) query.set('area', params.area);
  if (params?.is_active !== undefined) query.set('is_active', String(params.is_active));
  if (params?.supplier_id) query.set('supplier_id', String(params.supplier_id));
  if (params?.location_id) query.set('location_id', String(params.location_id));
  if (params?.ubicacionId) query.set('location_id', String(params.ubicacionId));
  if (params?.sala) query.set('sala', params.sala);
  if (params?.cajon) query.set('cajon', params.cajon);
  if (params?.critical_only) query.set('critical_only', '1');
  if (params?.soloStockCritico) query.set('critical_only', '1');
  if (params?.page) query.set('page', String(params.page));
  if (params?.per_page) query.set('per_page', String(params.per_page));
  if (params?.perPage) query.set('per_page', String(params.perPage));

  const qs = query.toString();
  const res = await get<PaginatedResponse<any>>(`/products${qs ? `?${qs}` : ''}`);

  return {
    data: (res.data ?? []).map(normalizeProducto),
    meta: res.meta ?? {
      currentPage: 1,
      lastPage: 1,
      perPage: res.data?.length ?? 0,
      total: res.data?.length ?? 0,
    },
  };
}

export async function fetchProduct(id: number): Promise<Producto> {
  const res = await get<any>(`/products/${id}`);
  return normalizeProducto(res?.data ?? res);
}

export async function createProducto(payload: CreateProductoPayload): Promise<Producto> {
  const res = await post<CreateProductoPayload, any>('/products', payload);
  return normalizeProducto(res?.data ?? res);
}

export async function updateProducto(
  id: number,
  payload: UpdateProductoPayload,
): Promise<Producto> {
  const res = await patch<UpdateProductoPayload, any>(`/products/${id}`, payload);
  return normalizeProducto(res?.data ?? res);
}

export async function deleteProducto(id: number): Promise<void> {
  return del<void>(`/products/${id}`);
}

export async function setProductoActivo(id: number, is_active: boolean): Promise<Producto> {
  const res = await patch<{ is_active: boolean }, any>(`/products/${id}`, { is_active });
  return normalizeProducto(res?.data ?? res);
}

export async function fetchProductLocation(id: number): Promise<Ubicacion> {
  const res = await get<any>(`/products/${id}/location`);
  const data = res?.data ?? res;
  return normalizeUbicacion(data?.location ?? data, data?.cajon);
}

export async function updateProductLocation(
  id: number,
  payload: ProductLocationPayload,
): Promise<Ubicacion> {
  const res = await patch<ProductLocationPayload, any>(`/products/${id}/location`, payload);
  const data = res?.data ?? res;
  return normalizeUbicacion(data?.location ?? data, data?.cajon);
}

export async function fetchProductBarcode(id: number): Promise<ProductBarcodeResponse> {
  const res = await get<any>(`/products/${id}/barcode`);
  const data = res?.data ?? res;
  return {
    barcode: data?.barcode ?? '',
    svg: data?.svg ?? '',
    data_uri: data?.data_uri,
    html: data?.html,
  };
}

export async function extractFactura(fileOrPayload: File | any): Promise<InvoiceScanResponse> {
  const formData = new FormData();
  if (fileOrPayload instanceof File) {
    formData.append('invoice_file', fileOrPayload);
    formData.append('factura', fileOrPayload);
  } else if (fileOrPayload?.archivo instanceof File) {
    formData.append('invoice_file', fileOrPayload.archivo);
    formData.append('factura', fileOrPayload.archivo);
  } else if (fileOrPayload?.factura instanceof File) {
    formData.append('invoice_file', fileOrPayload.factura);
    formData.append('factura', fileOrPayload.factura);
  }

  const res = await post<FormData, any>('/invoices/scan', formData);
  const data = res?.data ?? res;

  const rawProducts =
    data?.products ?? data?.draft_products ?? data?.productos ?? data?.items ?? [];

  const items: BorradorProducto[] = rawProducts.map((p: any) => ({
    nombre: p.nombre ?? p.name ?? '',
    name: p.nombre ?? p.name ?? '',
    codigoBarras: p.codigoBarras ?? p.barcode ?? '',
    barcode: p.codigoBarras ?? p.barcode ?? '',
    categoria: p.categoria ?? p.category ?? 'General',
    marca: p.marca ?? p.brand ?? null,
    modelo: p.modelo ?? p.model ?? null,
    stock: Number(p.stock ?? p.quantity ?? p.cantidad ?? 1),
    quantity: Number(p.stock ?? p.quantity ?? p.cantidad ?? 1),
    price: Number(p.price ?? p.precio ?? 0),
    precio: Number(p.price ?? p.precio ?? 0),
  }));

  const supplier = data?.supplier_name
    ? { id: data.supplier_id, name: data.supplier_name }
    : data?.supplier ?? data?.proveedor;

  return {
    invoice_number: data?.invoice_number ?? data?.numero_factura,
    numero_factura: data?.invoice_number ?? data?.numero_factura,
    supplier_name: data?.supplier_name ?? supplier?.name ?? supplier?.nombre,
    supplier_id: data?.supplier_id ?? supplier?.id,
    supplier,
    proveedor: supplier,
    products: items,
    draft_products: items,
    productos: items,
    items,
  };
}

export async function fetchCriticalStockAlerts(
  params?: CriticalStockAlertQueryParams,
): Promise<PaginatedResponse<CriticalStockAlert>> {
  const query = new URLSearchParams();
  if (params?.alert_type) query.set('alert_type', params.alert_type);
  if (params?.is_resolved !== undefined) query.set('is_resolved', String(params.is_resolved));
  if (params?.per_page) query.set('per_page', String(params.per_page));
  if (params?.page) query.set('page', String(params.page));

  const qs = query.toString();
  return get<PaginatedResponse<CriticalStockAlert>>(`/alerts/critical-stock${qs ? `?${qs}` : ''}`);
}

export async function resolveStockAlert(id: number): Promise<CriticalStockAlert> {
  return patch<void, CriticalStockAlert>(`/alerts/${id}/resolve`);
}
