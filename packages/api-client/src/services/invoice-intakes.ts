import type {
  ConfirmInvoiceIntakePayload,
  InvoiceIntake,
  InvoiceIntakeOcrPayload,
  InvoiceIntakeQueryParams,
  InvoiceIntakeStatus,
  PaginatedResponse,
  UploadInvoiceIntakePayload,
} from '@sgia/types';
import { get, getBlob, post } from '../http';
import {
  buildQuery,
  normalizeBudget,
  toAmount,
  toPaginated,
  type RawAnnualBudget,
  type RawPaginated,
} from './budgets';
import { normalizeProducto } from './products';

// Ingreso de facturas con descuento de presupuesto (FU-03 / REQ-17).

type Amount = number | string | null | undefined;

interface RawOcrItem {
  name?: string | null;
  quantity?: Amount;
  unit_price?: Amount;
  area?: string | null;
}

interface RawOcrPayload {
  invoice_number?: string | null;
  supplier_name?: string | null;
  supplier_id?: number | null;
  items?: RawOcrItem[] | null;
  ocr_available?: boolean;
}

interface RawIntakeItem {
  id: number;
  invoice_intake_id: number;
  product_id: number;
  product?: Record<string, unknown> | null;
  detected_name?: string | null;
  quantity?: Amount;
  unit_price?: Amount;
  subtotal?: Amount;
}

interface RawIntake {
  id: number;
  user_id?: number | null;
  annual_budget_id: number;
  purchase_id?: number | null;
  purchase?: { code: string | null; status: string } | null;
  annual_budget?: RawAnnualBudget | null;
  document_number?: string | null;
  status: InvoiceIntakeStatus;
  total_deducted?: Amount;
  has_file?: boolean;
  raw_ocr_payload?: RawOcrPayload | null;
  items?: RawIntakeItem[];
  received_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

function normalizeOcr(raw: RawOcrPayload | null | undefined): InvoiceIntakeOcrPayload {
  return {
    invoice_number: raw?.invoice_number ?? null,
    supplier_name: raw?.supplier_name ?? null,
    supplier_id: raw?.supplier_id ?? null,
    items: (raw?.items ?? []).map((it) => ({
      name: it.name?.trim() || 'Ítem sin nombre',
      quantity: Math.max(1, Math.round(toAmount(it.quantity)) || 1),
      unit_price: toAmount(it.unit_price),
      area: it.area ?? null,
    })),
    ocr_available: raw?.ocr_available ?? true,
  };
}

export function normalizeInvoiceIntake(raw: RawIntake): InvoiceIntake {
  return {
    id: raw.id,
    user_id: raw.user_id ?? null,
    annual_budget_id: raw.annual_budget_id,
    purchase_id: raw.purchase_id ?? null,
    purchase: raw.purchase ?? null,
    annual_budget: raw.annual_budget ? normalizeBudget(raw.annual_budget) : undefined,
    document_number: raw.document_number ?? null,
    status: raw.status,
    total_deducted: toAmount(raw.total_deducted),
    has_file: Boolean(raw.has_file),
    raw_ocr_payload: normalizeOcr(raw.raw_ocr_payload),
    items: (raw.items ?? []).map((it) => ({
      id: it.id,
      invoice_intake_id: it.invoice_intake_id,
      product_id: it.product_id,
      product: it.product ? normalizeProducto(it.product) : undefined,
      detected_name: it.detected_name ?? null,
      quantity: toAmount(it.quantity),
      unit_price: toAmount(it.unit_price),
      subtotal: toAmount(it.subtotal),
    })),
    received_at: raw.received_at ?? null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

function unwrapIntake(res: { data?: RawIntake } | RawIntake): InvoiceIntake {
  const raw = 'data' in res && res.data ? res.data : (res as RawIntake);
  return normalizeInvoiceIntake(raw);
}

export async function fetchInvoiceIntakes(
  params?: InvoiceIntakeQueryParams,
): Promise<PaginatedResponse<InvoiceIntake>> {
  const res = await get<RawPaginated<RawIntake>>(`/invoice-intakes${buildQuery(params)}`);
  return toPaginated(res, normalizeInvoiceIntake);
}

export async function fetchInvoiceIntake(id: number): Promise<InvoiceIntake> {
  return unwrapIntake(await get<{ data?: RawIntake }>(`/invoice-intakes/${id}`));
}

export async function uploadInvoiceIntake(
  payload: UploadInvoiceIntakePayload,
): Promise<InvoiceIntake> {
  const form = new FormData();
  form.append('file', payload.file);
  if (payload.annual_budget_id) form.append('annual_budget_id', String(payload.annual_budget_id));
  if (payload.purchase_id) form.append('purchase_id', String(payload.purchase_id));
  const code = payload.purchase_request_code?.trim();
  if (code) form.append('purchase_request_code', code.toUpperCase());
  return unwrapIntake(await post<FormData, { data?: RawIntake }>('/invoice-intakes', form));
}

export async function confirmInvoiceIntake(
  id: number,
  payload: ConfirmInvoiceIntakePayload,
): Promise<InvoiceIntake> {
  return unwrapIntake(
    await post<ConfirmInvoiceIntakePayload, { data?: RawIntake }>(
      `/invoice-intakes/${id}/confirm`,
      payload,
    ),
  );
}

export async function cancelInvoiceIntake(id: number): Promise<InvoiceIntake> {
  return unwrapIntake(await post<undefined, { data?: RawIntake }>(`/invoice-intakes/${id}/cancel`));
}

/** Descarga autenticada del archivo (disco privado): nunca usar una URL directa. */
export async function downloadInvoiceIntakeFile(id: number): Promise<Blob> {
  return getBlob(`/invoice-intakes/${id}/file`);
}
