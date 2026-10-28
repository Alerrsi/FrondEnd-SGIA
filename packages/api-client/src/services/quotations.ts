import type {
  Cotizacion,
  CotizacionParams,
  CreateCotizacionPayload,
  CreatePurchasePayload,
  CreateSupplierPayload,
  PaginatedResponse,
  PurchaseArrivalScanPayload,
  PurchaseOrder,
  PurchaseQueryParams,
  PurchaseStatus,
  QuotationResponsePayload,
  QuotationStatus,
  Supplier,
  SupplierQueryParams,
} from '@sgia/types';
import { del, get, patch, post } from '../http';

function normalizeCotizacion(raw: any): Cotizacion {
  if (!raw) return raw;
  const items = (raw.items ?? raw.products ?? []).map((it: any) => ({
    productoId: it.productoId ?? it.product_id ?? it.id ?? 0,
    product_id: it.product_id ?? it.productoId ?? it.id ?? 0,
    name: it.name ?? it.nombre,
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
    expires_at: raw.expires_at ?? null,
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
  if (params?.supplier_id) query.set('supplier_id', String(params.supplier_id));
  if (params?.search) query.set('search', params.search);
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
    name: it.name,
  }));

  const body = {
    products,
    supplier_ids: payload.supplier_ids ?? [],
    notes: payload.notes ?? payload.notas,
    expires_at: payload.expires_at,
  };

  const response = await post<any, any>('/quotations', body);
  return normalizeCotizacion(response?.data ?? response);
}

export async function updateQuotationStatus(
  id: number,
  status: QuotationStatus | string,
): Promise<Cotizacion> {
  const response = await patch<{ status: string }, any>(`/quotations/${id}/status`, { status });
  return normalizeCotizacion(response?.data ?? response);
}

export async function updateQuotationResponse(
  id: number,
  payload: QuotationResponsePayload,
): Promise<Cotizacion> {
  const response = await patch<QuotationResponsePayload, any>(`/quotations/${id}/responses`, payload);
  return normalizeCotizacion(response?.data ?? response);
}

// Proveedores (FU-03 / REQ-07)
export async function fetchSuppliers(params?: SupplierQueryParams): Promise<PaginatedResponse<Supplier>> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
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
export async function fetchPurchases(params?: PurchaseQueryParams): Promise<PaginatedResponse<PurchaseOrder>> {
  const query = new URLSearchParams();
  const status = params?.status ?? params?.estado;
  if (status) query.set('status', status);
  if (params?.supplier_id) query.set('supplier_id', String(params.supplier_id));
  if (params?.quotation_id) query.set('quotation_id', String(params.quotation_id));
  if (params?.search) query.set('search', params.search);
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

export async function updatePurchaseStatus(id: number, status: PurchaseStatus | string): Promise<PurchaseOrder> {
  return patch<{ status: string }, PurchaseOrder>(`/purchases/${id}/status`, { status });
}

export async function scanPurchaseArrival(
  id: number,
  payload: PurchaseArrivalScanPayload,
): Promise<PurchaseOrder> {
  if (payload.document instanceof File || payload.document instanceof Blob) {
    const formData = new FormData();
    formData.append('document', payload.document);
    if (payload.guide_number) formData.append('guide_number', payload.guide_number);
    if (payload.invoice_number) formData.append('invoice_number', payload.invoice_number);
    return post<FormData, PurchaseOrder>(`/purchases/${id}/arrival-scan`, formData);
  }
  return post<PurchaseArrivalScanPayload, PurchaseOrder>(`/purchases/${id}/arrival-scan`, payload);
}
