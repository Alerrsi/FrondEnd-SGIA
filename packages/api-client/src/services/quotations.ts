import type {
  Cotizacion,
  CotizacionParams,
  CreateCotizacionPayload,
  CreatePurchasePayload,
  CreateSupplierPayload,
  PaginatedResponse,
  PurchaseOrder,
  PurchaseStatus,
  Supplier,
} from '@sgia/types';
import { del, get, patch, post } from '../http';

function normalizeCotizacion(raw: any): Cotizacion {
  if (!raw) return raw;
  const items = (raw.items ?? raw.products ?? []).map((it: any) => ({
    productoId: it.productoId ?? it.product_id ?? it.id ?? 0,
    product_id: it.product_id ?? it.productoId ?? it.id ?? 0,
    cantidad: it.cantidad ?? it.quantity ?? 1,
    quantity: it.quantity ?? it.cantidad ?? 1,
    precioUnitario: it.precioUnitario ?? it.unit_price ?? null,
    unit_price: it.unit_price ?? it.precioUnitario ?? null,
  }));

  return {
    id: raw.id,
    proveedor: raw.proveedor ?? raw.supplier?.name ?? (raw.suppliers ? raw.suppliers.map((s: any) => s.name).join(', ') : null),
    supplier_ids: raw.supplier_ids ?? [],
    suppliers: raw.suppliers ?? [],
    items,
    products: items,
    estado: raw.estado ?? raw.status ?? 'pendiente',
    status: raw.status ?? raw.estado ?? 'pendiente',
    creadoPorId: raw.creadoPorId ?? raw.created_by_id ?? 0,
    fechaRequerida: raw.fechaRequerida ?? raw.required_date ?? null,
    notas: raw.notas ?? raw.notes ?? null,
    notes: raw.notes ?? raw.notas ?? null,
    createdAt: raw.createdAt ?? raw.created_at ?? '',
    created_at: raw.created_at ?? raw.createdAt ?? '',
    updatedAt: raw.updatedAt ?? raw.updated_at ?? '',
    updated_at: raw.updated_at ?? raw.updatedAt ?? '',
  };
}

function normalizePaginatedQuotations(res: any): PaginatedResponse<Cotizacion> {
  const rawList = Array.isArray(res) ? res : res?.data ?? [];
  const data = rawList.map(normalizeCotizacion);
  const meta = res?.meta ?? {
    currentPage: res?.current_page ?? 1,
    lastPage: res?.last_page ?? 1,
    perPage: res?.per_page ?? data.length,
    total: res?.total ?? data.length,
  };
  return { data, meta };
}

export async function fetchQuotations(
  params?: CotizacionParams,
): Promise<PaginatedResponse<Cotizacion>> {
  const query = new URLSearchParams();
  const estado = params?.estado ?? params?.status;
  if (estado) query.set('estado', estado);
  if (params?.page) query.set('page', String(params.page));

  const perPage = params?.per_page ?? params?.perPage;
  if (perPage) query.set('per_page', String(perPage));

  const qs = query.toString();
  const response = await get<any>(`/quotations${qs ? `?${qs}` : ''}`);
  return normalizePaginatedQuotations(response);
}

export async function fetchQuotation(id: number): Promise<Cotizacion> {
  const response = await get<any>(`/quotations/${id}`);
  return normalizeCotizacion(response?.data ?? response);
}

export async function createCotizacion(payload: CreateCotizacionPayload): Promise<Cotizacion> {
  const products = (payload.products ?? payload.items ?? []).map((it: any) => ({
    id: it.id ?? it.product_id ?? it.productoId,
    quantity: it.quantity ?? it.cantidad ?? 1,
  }));

  const body = {
    products,
    supplier_ids: payload.supplier_ids ?? [],
    notes: payload.notes ?? payload.notas,
  };

  const response = await post<any, any>('/quotations', body);
  return normalizeCotizacion(response?.data ?? response);
}

// Proveedores (FU-03 / REQ-07)
export async function fetchSuppliers(params?: {
  category?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResponse<Supplier>> {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.is_active !== undefined) query.set('is_active', String(params.is_active));
  if (params?.page) query.set('page', String(params.page));
  if (params?.per_page) query.set('per_page', String(params.per_page));

  const qs = query.toString();
  return get<PaginatedResponse<Supplier>>(`/suppliers${qs ? `?${qs}` : ''}`);
}

export async function fetchSupplier(id: number): Promise<Supplier> {
  return get<Supplier>(`/suppliers/${id}`);
}

export async function createSupplier(payload: CreateSupplierPayload): Promise<Supplier> {
  return post<CreateSupplierPayload, Supplier>('/suppliers', payload);
}

export async function updateSupplier(id: number, payload: Partial<CreateSupplierPayload>): Promise<Supplier> {
  return patch<Partial<CreateSupplierPayload>, Supplier>(`/suppliers/${id}`, payload);
}

export async function deleteSupplier(id: number): Promise<void> {
  return del<void>(`/suppliers/${id}`);
}

export async function setSupplierStatus(id: number, is_active: boolean): Promise<Supplier> {
  return patch<{ is_active: boolean }, Supplier>(`/suppliers/${id}/status`, { is_active });
}

// Compras y Adquisiciones (FU-03 / REQ-08)
export async function fetchPurchases(params?: {
  status?: PurchaseStatus;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResponse<PurchaseOrder>> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.per_page) query.set('per_page', String(params.per_page));

  const qs = query.toString();
  return get<PaginatedResponse<PurchaseOrder>>(`/purchases${qs ? `?${qs}` : ''}`);
}

export async function fetchPurchase(id: number): Promise<PurchaseOrder> {
  return get<PurchaseOrder>(`/purchases/${id}`);
}

export async function createPurchase(payload: CreatePurchasePayload): Promise<PurchaseOrder> {
  return post<CreatePurchasePayload, PurchaseOrder>('/purchases', payload);
}

export async function updatePurchaseStatus(id: number, status: PurchaseStatus): Promise<PurchaseOrder> {
  return patch<{ status: PurchaseStatus }, PurchaseOrder>(`/purchases/${id}/status`, { status });
}
