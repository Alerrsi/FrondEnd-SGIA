import type {
  Cotizacion,
  CotizacionParams,
  CreateSupplierPayload,
  PaginatedResponse,
  PurchaseArrivalScanPayload,
  PurchaseItem,
  PurchaseOrder,
  PurchaseQueryParams,
  PurchaseStatus,
  PurchaseTrace,
  Supplier,
  SupplierArea,
  SupplierQueryParams,
} from '@sgia/types';
import { SUPPLIER_AREAS } from '@sgia/types';
import { del, get, getBlob, patch, post } from '../http';
import { normalizeMovement } from './budgets';
import { unwrap } from './shared';
import { normalizeInvoiceIntake } from './invoice-intakes';

export function normalizeCotizacion(raw: any): Cotizacion {
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

  // La API entrega proveedores contactados ({supplier_id, supplier:{name,email}, status…}); la UI usa el proveedor plano.
  const suppliers = (raw.suppliers ?? []).map((s: any) => ({
    ...s,
    ...(s.supplier ?? {}),
    id: s.supplier_id ?? s.supplier?.id ?? s.id,
    name: s.supplier?.name ?? s.name,
    email: s.supplier?.email ?? s.email,
    status: s.status,
  }));

  return {
    id: raw.id,
    proveedor:
      raw.proveedor ??
      raw.supplier?.name ??
      (suppliers.length ? suppliers.map((s: any) => s.name).join(', ') : null),
    supplier_ids: raw.supplier_ids ?? suppliers.map((s: any) => s.id),
    suppliers,
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
  const rawList = Array.isArray(res) ? res : (res?.data ?? []);
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

// Proveedores (FU-03 / REQ-07). `areas` puede llegar como `['informatica']`, `[{ area }]` o `[{ value, label }]`.
type RawSupplierArea = SupplierArea | { area?: string | null; value?: string | null };

type RawSupplier = Omit<Supplier, 'areas'> & { areas?: RawSupplierArea[] | null };

const SUPPLIER_AREA_SET = new Set<string>(SUPPLIER_AREAS);

function isSupplierArea(value: unknown): value is SupplierArea {
  return typeof value === 'string' && SUPPLIER_AREA_SET.has(value);
}

export function normalizeSupplierAreas(raw: RawSupplierArea[] | null | undefined): SupplierArea[] {
  const areas = (raw ?? []).map((a) => (typeof a === 'string' ? a : (a?.area ?? a?.value)));
  return [...new Set(areas.filter(isSupplierArea))];
}

export function normalizeSupplier(raw: RawSupplier): Supplier {
  return { ...raw, areas: normalizeSupplierAreas(raw.areas) };
}

export async function fetchSuppliers(
  params?: SupplierQueryParams,
): Promise<PaginatedResponse<Supplier>> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.category) query.set('category', params.category);
  if (params?.area) query.set('area', params.area);
  if (params?.is_active !== undefined) query.set('is_active', String(params.is_active));
  if (params?.page) query.set('page', String(params.page));
  if (params?.per_page) query.set('per_page', String(params.per_page));

  const qs = query.toString();
  const res = await get<Omit<PaginatedResponse<RawSupplier>, 'data'> & { data?: RawSupplier[] }>(
    `/suppliers${qs ? `?${qs}` : ''}`,
  );
  return { ...res, data: (res?.data ?? []).map(normalizeSupplier) };
}

export async function fetchSupplier(id: number): Promise<Supplier> {
  return normalizeSupplier(unwrap(await get<{ data?: RawSupplier } | RawSupplier>(`/suppliers/${id}`)));
}

export async function createSupplier(payload: CreateSupplierPayload): Promise<Supplier> {
  return normalizeSupplier(
    unwrap(await post<CreateSupplierPayload, { data?: RawSupplier } | RawSupplier>('/suppliers', payload)),
  );
}

export async function updateSupplier(
  id: number,
  payload: Partial<CreateSupplierPayload>,
): Promise<Supplier> {
  return normalizeSupplier(
    unwrap(
      await patch<Partial<CreateSupplierPayload>, { data?: RawSupplier } | RawSupplier>(
        `/suppliers/${id}`,
        payload,
      ),
    ),
  );
}

export async function deleteSupplier(id: number): Promise<void> {
  return del<void>(`/suppliers/${id}`);
}

export async function setSupplierStatus(id: number, is_active: boolean): Promise<Supplier> {
  return normalizeSupplier(
    unwrap(
      await patch<{ is_active: boolean }, { data?: RawSupplier } | RawSupplier>(
        `/suppliers/${id}/status`,
        { is_active },
      ),
    ),
  );
}

// Compras y Adquisiciones (FU-03 / REQ-08)
interface RawPurchase {
  id: number;
  code?: string | null;
  purchase_request_id?: number | null;
  purchase_request?: { id: number; code: string; status: string } | null;
  order_number?: string | null;
  has_order_file?: boolean;
  quotation_id?: number | null;
  quotation_reference?: string | null;
  supplier_id?: number;
  supplier?: Supplier | null;
  items?: PurchaseItem[];
  status?: PurchaseStatus;
  estado?: PurchaseStatus;
  total_amount?: number | string | null;
  total?: number | string | null;
  expected_at?: string | null;
  received_at?: string | null;
  guide_number?: string | null;
  invoice_number?: string | null;
  arrival_document_url?: string | null;
  notes?: string | null;
  allowed_transitions?: PurchaseStatus[];
  annual_budget_id?: number | null;
  reserved_amount?: number | string | null;
  created_at?: string;
  updated_at?: string;
}

export function normalizePurchase(raw: RawPurchase): PurchaseOrder {
  const items = (raw.items ?? []).map((it) => ({
    ...it,
    quantity: Number(it.quantity ?? 0),
    unit_price: it.unit_price == null ? null : Number(it.unit_price),
    subtotal: it.subtotal == null ? null : Number(it.subtotal),
  }));
  const computedTotal = items.reduce((sum, it) => sum + (it.unit_price ?? 0) * it.quantity, 0);
  const rawTotal = raw.total_amount ?? raw.total;

  return {
    id: raw.id,
    code: raw.code ?? null,
    purchase_request_id: raw.purchase_request_id ?? raw.purchase_request?.id ?? null,
    purchase_request: raw.purchase_request ?? null,
    order_number: raw.order_number ?? null,
    has_order_file: raw.has_order_file ?? false,
    quotation_id: raw.quotation_id ?? null,
    quotation_reference: raw.quotation_reference ?? null,
    supplier_id: raw.supplier_id ?? raw.supplier?.id ?? 0,
    supplier: raw.supplier ?? undefined,
    items,
    status: raw.status ?? raw.estado ?? 'pendiente',
    total_amount: rawTotal == null ? computedTotal : Number(rawTotal),
    expected_at: raw.expected_at ?? null,
    received_at: raw.received_at ?? null,
    guide_number: raw.guide_number ?? null,
    invoice_number: raw.invoice_number ?? null,
    arrival_document_url: raw.arrival_document_url ?? null,
    notes: raw.notes ?? null,
    allowed_transitions: raw.allowed_transitions ?? [],
    annual_budget_id: raw.annual_budget_id ?? null,
    reserved_amount: raw.reserved_amount == null ? 0 : Number(raw.reserved_amount),
    created_at: raw.created_at ?? '',
    updated_at: raw.updated_at ?? '',
  };
}

function unwrapPurchase(response: { data?: RawPurchase } | RawPurchase): PurchaseOrder {
  const raw = 'data' in response && response.data ? response.data : (response as RawPurchase);
  return normalizePurchase(raw);
}

export async function fetchPurchases(
  params?: PurchaseQueryParams,
): Promise<PaginatedResponse<PurchaseOrder>> {
  const query = new URLSearchParams();
  const status = params?.status ?? params?.estado;
  if (status) query.set('status', status);
  if (params?.supplier_id) query.set('supplier_id', String(params.supplier_id));
  if (params?.quotation_id) query.set('quotation_id', String(params.quotation_id));
  if (params?.linkable) query.set('linkable', '1');
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.per_page) query.set('per_page', String(params.per_page));

  const qs = query.toString();
  const res = await get<{
    data?: RawPurchase[];
    meta?: PaginatedResponse<PurchaseOrder>['meta'];
  }>(`/purchases${qs ? `?${qs}` : ''}`);
  const data = (res?.data ?? []).map(normalizePurchase);
  return {
    data,
    meta: res?.meta ?? {
      currentPage: 1,
      lastPage: 1,
      perPage: data.length,
      total: data.length,
    },
  };
}

export async function fetchPurchase(id: number): Promise<PurchaseOrder> {
  return unwrapPurchase(await get<{ data?: RawPurchase }>(`/purchases/${id}`));
}

export async function updatePurchaseStatus(
  id: number,
  status: PurchaseStatus | string,
): Promise<PurchaseOrder> {
  return unwrapPurchase(
    await patch<{ status: string }, { data?: RawPurchase }>(`/purchases/${id}/status`, { status }),
  );
}

/** Cancela una compra `pendiente` o `en_camino` y libera su reserva de presupuesto. */
export async function cancelPurchase(id: number): Promise<PurchaseOrder> {
  return unwrapPurchase(await post<undefined, { data?: RawPurchase }>(`/purchases/${id}/cancel`));
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
    return unwrapPurchase(
      await post<FormData, { data?: RawPurchase }>(`/purchases/${id}/arrival-scan`, formData),
    );
  }
  return unwrapPurchase(
    await post<PurchaseArrivalScanPayload, { data?: RawPurchase }>(
      `/purchases/${id}/arrival-scan`,
      payload,
    ),
  );
}

export async function downloadPurchaseArrivalDocument(id: number): Promise<Blob> {
  return getBlob(`/purchases/${id}/arrival-document`);
}

/** Cadena OC → cotizaciones → facturas → stock → movimientos de presupuesto (`GET /purchases/{id}/trace`). */
export async function fetchPurchaseTrace(id: number): Promise<PurchaseTrace> {
  const res = await get<{
    purchase: Parameters<typeof normalizePurchase>[0];
    quotations?: unknown[];
    invoices?: Parameters<typeof normalizeInvoiceIntake>[0][];
    budget_movements?: Parameters<typeof normalizeMovement>[0][];
    purchase_request?: { id: number; code: string; status: string } | null;
    stock_entries?: { product_id: number; name: string; quantity: number | string }[];
  }>(`/purchases/${id}/trace`);
  return {
    purchase: normalizePurchase(res.purchase),
    quotations: (res.quotations ?? []).map(normalizeCotizacion),
    invoices: (res.invoices ?? []).map(normalizeInvoiceIntake),
    budget_movements: (res.budget_movements ?? []).map(normalizeMovement),
    purchase_request: res.purchase_request
      ? { id: res.purchase_request.id, code: res.purchase_request.code, status: res.purchase_request.status }
      : null,
    stock_entries: (res.stock_entries ?? []).map((s) => ({ ...s, quantity: Number(s.quantity) })),
  };
}
