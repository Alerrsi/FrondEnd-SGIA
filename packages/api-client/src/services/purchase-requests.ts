import type {
  CreatePurchaseRequestPayload,
  PaginatedResponse,
  PurchaseRequest,
  PurchaseRequestActions,
  PurchaseRequestEmailStatus,
  PurchaseRequestInvoice,
  PurchaseRequestOrder,
  PurchaseRequestQueryParams,
  PurchaseRequestQuotation,
  PurchaseRequestStatus,
  SendPurchaseRequestPayload,
  Supplier,
  SupplierArea,
  UpdatePurchaseRequestPayload,
  UploadPurchaseRequestOrderPayload,
  UploadPurchaseRequestQuotationPayload,
} from '@sgia/types';
import {
  MIN_PURCHASE_REQUEST_QUOTATIONS,
  PurchaseRequestStatus as Status,
  SUPPLIER_AREAS,
} from '@sgia/types';
import { del, get, getBlob, patch, post } from '../http';
import { normalizeBudget, type RawAnnualBudget } from './budgets';
import { normalizeSupplier, normalizeSupplierAreas } from './quotations';
import {
  buildQuery,
  toAmount,
  toPaginated,
  unwrap,
  type Amount,
  type RawPaginated,
} from './shared';

// Solicitudes de compra (NUEVO-FLUJO-COMPRAS.md §5). Lectura AD-01/DIR-01/PAN-01; escritura DIR-01.

type RawSupplier = Parameters<typeof normalizeSupplier>[0];

interface RawItem {
  id: number;
  product_id: number;
  product?: { id?: number; name?: string | null; nombre?: string | null } | null;
  product_name?: string | null;
  quantity?: Amount;
}

interface RawRequestSupplier {
  id?: number;
  supplier_id?: number;
  supplier?: RawSupplier | null;
  email_status?: PurchaseRequestEmailStatus | null;
  email_sent_at?: string | null;
  email_error?: string | null;
}

interface RawQuotationItem {
  purchase_request_item_id: number;
  unit_price?: Amount;
}

interface RawQuotation {
  id: number;
  supplier_id?: number;
  supplier?: RawSupplier | null;
  total?: Amount;
  has_file?: boolean;
  file_path?: string | null;
  /** El backend expone la descarga autenticada como `file_url`. */
  file_url?: string | null;
  original_name?: string | null;
  received_at?: string | null;
  uploaded_by?: number | null;
  items?: RawQuotationItem[] | null;
  created_at?: string;
}

interface RawInvoice {
  id: number;
  document_number?: string | null;
  status?: string;
  total_deducted?: Amount;
}

/** `PurchaseResource`: el total llega como `total` y las facturas anidadas en `invoices`. */
interface RawOrder {
  id: number;
  code?: string | null;
  order_number?: string | null;
  status?: string;
  supplier?: { name?: string | null } | null;
  total?: Amount;
  total_amount?: Amount;
  reserved_amount?: Amount;
  has_order_file?: boolean;
  order_file_path?: string | null;
  invoices?: RawInvoice[] | null;
}

export interface RawPurchaseRequest {
  id: number;
  code?: string | null;
  status: PurchaseRequestStatus;
  status_label?: string | null;
  annual_budget_id: number;
  annual_budget?: RawAnnualBudget | null;
  created_by?: number | null;
  creator?: { id?: number; name?: string | null } | null;
  created_by_name?: string | null;
  approved_by?: number | null;
  approver?: { id?: number; name?: string | null } | null;
  approved_at?: string | null;
  sent_at?: string | null;
  selected_quotation_id?: number | null;
  notes?: string | null;
  items?: RawItem[] | null;
  areas?: Parameters<typeof normalizeSupplierAreas>[0];
  suppliers?: RawRequestSupplier[] | null;
  quotations?: RawQuotation[] | null;
  quotations_count?: number | null;
  min_quotations?: number | null;
  can_edit?: boolean;
  can_approve?: boolean;
  can_send?: boolean;
  can_resend?: boolean;
  can_upload_quotation?: boolean;
  can_remove_quotation?: boolean;
  can_select_quotation?: boolean;
  can_issue_order?: boolean;
  can_cancel?: boolean;
  /** El backend puede exponer la OC como `order` o `purchase`. */
  order?: RawOrder | null;
  purchase?: RawOrder | null;
  invoices?: RawInvoice[] | null;
  invoice_intakes?: RawInvoice[] | null;
  created_at?: string;
  updated_at?: string;
}

function normalizeOptionalSupplier(raw: RawSupplier | null | undefined): Supplier | undefined {
  return raw ? normalizeSupplier(raw) : undefined;
}

function normalizeQuotation(raw: RawQuotation): PurchaseRequestQuotation {
  return {
    id: raw.id,
    supplier_id: raw.supplier_id ?? raw.supplier?.id ?? 0,
    supplier: normalizeOptionalSupplier(raw.supplier),
    total: toAmount(raw.total),
    has_file: raw.has_file ?? Boolean(raw.file_url ?? raw.file_path),
    original_name: raw.original_name ?? null,
    received_at: raw.received_at ?? null,
    uploaded_by: raw.uploaded_by ?? null,
    items: (raw.items ?? []).map((it) => ({
      purchase_request_item_id: it.purchase_request_item_id,
      unit_price: toAmount(it.unit_price),
    })),
    created_at: raw.created_at,
  };
}

function normalizeOrder(raw: RawOrder | null | undefined): PurchaseRequestOrder | null {
  if (!raw) return null;
  return {
    id: raw.id,
    code: raw.code ?? null,
    order_number: raw.order_number ?? null,
    status: raw.status ?? 'pendiente',
    supplier_name: raw.supplier?.name ?? null,
    total_amount: toAmount(raw.total ?? raw.total_amount),
    reserved_amount: toAmount(raw.reserved_amount),
    has_order_file: raw.has_order_file ?? Boolean(raw.order_file_path),
  };
}

function normalizeInvoice(raw: RawInvoice): PurchaseRequestInvoice {
  return {
    id: raw.id,
    document_number: raw.document_number ?? null,
    status: raw.status ?? 'borrador',
    total_deducted: toAmount(raw.total_deducted),
  };
}

const QUOTING: ReadonlySet<string> = new Set([Status.ENVIADA, Status.COTIZADA]);
const CANCELLABLE: ReadonlySet<string> = new Set([
  Status.BORRADOR,
  Status.APROBADA,
  Status.ENVIADA,
  Status.COTIZADA,
  Status.CON_OC,
]);

/** Usa los `can_*` del backend; si faltan, los deriva del estado (misma regla que el Resource). */
function normalizeActions(raw: RawPurchaseRequest): PurchaseRequestActions {
  const status = raw.status;
  const selected = raw.selected_quotation_id ?? null;
  const quoting = QUOTING.has(status);
  return {
    can_edit: raw.can_edit ?? status === Status.BORRADOR,
    can_approve: raw.can_approve ?? status === Status.BORRADOR,
    can_send: raw.can_send ?? status === Status.APROBADA,
    can_resend: raw.can_resend ?? quoting,
    can_upload_quotation: raw.can_upload_quotation ?? quoting,
    can_remove_quotation: raw.can_remove_quotation ?? (quoting && selected === null),
    can_select_quotation: raw.can_select_quotation ?? status === Status.COTIZADA,
    can_issue_order: raw.can_issue_order ?? (status === Status.COTIZADA && selected !== null),
    can_cancel: raw.can_cancel ?? CANCELLABLE.has(status),
  };
}

export function normalizePurchaseRequest(raw: RawPurchaseRequest): PurchaseRequest {
  const quotations = (raw.quotations ?? []).map(normalizeQuotation);
  const rawOrder = raw.order ?? raw.purchase;
  return {
    id: raw.id,
    code: raw.code ?? `#${raw.id}`,
    status: raw.status,
    status_label: raw.status_label ?? null,
    annual_budget_id: raw.annual_budget_id,
    annual_budget: raw.annual_budget ? normalizeBudget(raw.annual_budget) : undefined,
    created_by: raw.created_by ?? raw.creator?.id ?? null,
    creator_name: raw.creator?.name ?? raw.created_by_name ?? null,
    approved_by: raw.approved_by ?? raw.approver?.id ?? null,
    approver_name: raw.approver?.name ?? null,
    approved_at: raw.approved_at ?? null,
    sent_at: raw.sent_at ?? null,
    selected_quotation_id: raw.selected_quotation_id ?? null,
    notes: raw.notes ?? null,
    items: (raw.items ?? []).map((it) => ({
      id: it.id,
      product_id: it.product_id,
      product_name:
        it.product_name ?? it.product?.name ?? it.product?.nombre ?? `Producto #${it.product_id}`,
      quantity: toAmount(it.quantity),
    })),
    areas: normalizeSupplierAreas(raw.areas),
    suppliers: (raw.suppliers ?? []).map((s, i) => ({
      id: s.id ?? i,
      supplier_id: s.supplier_id ?? s.supplier?.id ?? 0,
      supplier: normalizeOptionalSupplier(s.supplier),
      email_status:
        s.email_status ?? (s.email_sent_at ? 'enviado' : s.email_error ? 'fallido' : 'pendiente'),
      email_sent_at: s.email_sent_at ?? null,
      email_error: s.email_error ?? null,
    })),
    quotations,
    quotations_count: raw.quotations_count ?? quotations.length,
    min_quotations: raw.min_quotations ?? MIN_PURCHASE_REQUEST_QUOTATIONS,
    actions: normalizeActions(raw),
    order: normalizeOrder(rawOrder),
    invoices: (raw.invoices ?? raw.invoice_intakes ?? rawOrder?.invoices ?? []).map(
      normalizeInvoice,
    ),
    created_at: raw.created_at ?? '',
    updated_at: raw.updated_at ?? '',
  };
}

/**
 * Respuestas posibles: `{ data }` (Resource), sin envolver, o `{ message, emails_sent,
 * emails_failed, purchase_request }` (send/resend) y `{ quotation, purchase_request }` (subir cotización).
 */
type Wrapped =
  | { data?: RawPurchaseRequest }
  | { purchase_request: RawPurchaseRequest | { data: RawPurchaseRequest } }
  | RawPurchaseRequest;

function unwrapRequest(res: Wrapped): PurchaseRequest {
  if (res && typeof res === 'object' && 'purchase_request' in res) {
    return normalizePurchaseRequest(unwrap<RawPurchaseRequest>(res.purchase_request));
  }
  return normalizePurchaseRequest(unwrap<RawPurchaseRequest>(res));
}

export async function fetchPurchaseRequests(
  params?: PurchaseRequestQueryParams,
): Promise<PaginatedResponse<PurchaseRequest>> {
  const res = await get<RawPaginated<RawPurchaseRequest>>(
    `/purchase-requests${buildQuery(params)}`,
  );
  return toPaginated(res, normalizePurchaseRequest);
}

export async function fetchPurchaseRequest(id: number): Promise<PurchaseRequest> {
  return unwrapRequest(await get<Wrapped>(`/purchase-requests/${id}`));
}

export async function createPurchaseRequest(
  payload: CreatePurchaseRequestPayload,
): Promise<PurchaseRequest> {
  return unwrapRequest(
    await post<CreatePurchaseRequestPayload, Wrapped>('/purchase-requests', payload),
  );
}

export async function updatePurchaseRequest(
  id: number,
  payload: UpdatePurchaseRequestPayload,
): Promise<PurchaseRequest> {
  return unwrapRequest(
    await patch<UpdatePurchaseRequestPayload, Wrapped>(`/purchase-requests/${id}`, payload),
  );
}

export async function approvePurchaseRequest(id: number): Promise<PurchaseRequest> {
  return unwrapRequest(await post<undefined, Wrapped>(`/purchase-requests/${id}/approve`));
}

export async function sendPurchaseRequest(
  id: number,
  payload: SendPurchaseRequestPayload,
): Promise<PurchaseRequest> {
  return unwrapRequest(
    await post<SendPurchaseRequestPayload, Wrapped>(`/purchase-requests/${id}/send`, payload),
  );
}

/** Reintenta solo los correos fallidos. */
export async function resendPurchaseRequest(id: number): Promise<PurchaseRequest> {
  return unwrapRequest(await post<undefined, Wrapped>(`/purchase-requests/${id}/resend`));
}

export async function cancelPurchaseRequest(id: number): Promise<PurchaseRequest> {
  return unwrapRequest(await post<undefined, Wrapped>(`/purchase-requests/${id}/cancel`));
}

/** `multipart`: los ítems viajan como `items[N][purchase_request_item_id]` / `items[N][unit_price]`. */
export async function uploadPurchaseRequestQuotation(
  id: number,
  payload: UploadPurchaseRequestQuotationPayload,
): Promise<PurchaseRequest> {
  const form = new FormData();
  form.append('supplier_id', String(payload.supplier_id));
  form.append('file', payload.file);
  form.append('total', String(payload.total));
  if (payload.received_at) form.append('received_at', payload.received_at);
  payload.items.forEach((item, i) => {
    form.append(`items[${i}][purchase_request_item_id]`, String(item.purchase_request_item_id));
    form.append(`items[${i}][unit_price]`, String(item.unit_price));
  });
  return unwrapRequest(await post<FormData, Wrapped>(`/purchase-requests/${id}/quotations`, form));
}

/** El backend responde `204`: se vuelve a pedir el detalle. */
export async function deletePurchaseRequestQuotation(
  id: number,
  quotationId: number,
): Promise<void> {
  await del<void>(`/purchase-requests/${id}/quotations/${quotationId}`);
}

export async function selectPurchaseRequestQuotation(
  id: number,
  quotationId: number,
): Promise<PurchaseRequest> {
  return unwrapRequest(
    await post<{ quotation_id: number }, Wrapped>(`/purchase-requests/${id}/select-quotation`, {
      quotation_id: quotationId,
    }),
  );
}

export async function uploadPurchaseRequestOrder(
  id: number,
  payload: UploadPurchaseRequestOrderPayload,
): Promise<PurchaseRequest> {
  const form = new FormData();
  form.append('file', payload.file);
  form.append('order_number', payload.order_number.trim());
  return unwrapRequest(await post<FormData, Wrapped>(`/purchase-requests/${id}/order`, form));
}

/** Descargas autenticadas (disco privado): nunca abrir la URL directa. */
export async function downloadPurchaseRequestQuotationFile(
  id: number,
  quotationId: number,
): Promise<Blob> {
  return getBlob(`/purchase-requests/${id}/quotations/${quotationId}/file`);
}

export async function downloadPurchaseRequestOrderFile(id: number): Promise<Blob> {
  return getBlob(`/purchase-requests/${id}/order/file`);
}

/** Enum de áreas para selects; si el backend no responde se usa la lista fija del contrato. */
export async function fetchPurchaseRequestAreas(): Promise<SupplierArea[]> {
  try {
    const res = await get<
      { data?: Parameters<typeof normalizeSupplierAreas>[0] } | Parameters<typeof normalizeSupplierAreas>[0]
    >('/purchase-requests/areas');
    const list = Array.isArray(res) ? res : res?.data;
    const areas = normalizeSupplierAreas(list);
    return areas.length ? areas : [...SUPPLIER_AREAS];
  } catch {
    return [...SUPPLIER_AREAS];
  }
}
