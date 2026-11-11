import type { AnnualBudget } from './presupuesto';
import type { Producto } from './producto';

export const InvoiceIntakeStatus = {
  BORRADOR: 'borrador',
  CONFIRMADO: 'confirmado',
  ANULADO: 'anulado',
} as const;

export type InvoiceIntakeStatus = (typeof InvoiceIntakeStatus)[keyof typeof InvoiceIntakeStatus];

/** Ítem detectado por el OCR en `raw_ocr_payload.items`. */
export interface InvoiceIntakeOcrItem {
  name: string;
  quantity: number;
  unit_price: number;
  area?: string | null;
}

export interface InvoiceIntakeOcrPayload {
  invoice_number: string | null;
  supplier_name: string | null;
  supplier_id: number | null;
  items: InvoiceIntakeOcrItem[];
  ocr_available: boolean;
}

export interface InvoiceIntakeItem {
  id: number;
  invoice_intake_id: number;
  product_id: number;
  product?: Producto;
  detected_name: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

/** Ingreso de factura con descuento de presupuesto (REQ-17). */
export interface InvoiceIntake {
  id: number;
  user_id: number | null;
  annual_budget_id: number;
  purchase_id: number | null;
  /** Borrador sin OC ni carrera detectada: el usuario elige presupuesto al confirmar. */
  needs_budget?: boolean;
  detected_career_id?: number | null;
  annual_budget?: AnnualBudget;
  /** Respuesta de confirm/GET (contrato): OC asociada y si hubo vínculo. */
  purchase?: { code: string | null; status: string } | null;
  linked?: boolean;
  document_number: string | null;
  status: InvoiceIntakeStatus;
  total_deducted: number;
  has_file: boolean;
  raw_ocr_payload: InvoiceIntakeOcrPayload;
  items: InvoiceIntakeItem[];
  received_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceIntakeQueryParams {
  status?: InvoiceIntakeStatus;
  annual_budget_id?: number;
  from?: string;
  to?: string;
  per_page?: number;
  page?: number;
}

export interface UploadInvoiceIntakePayload {
  file: File;
  /** Opcional: presupuesto del ingreso (si se omite, el de la compra o el detectado por OCR). */
  annual_budget_id?: number;
  /** Opcional: OC ligada (mismo presupuesto, con reserva vigente). */
  purchase_id?: number;
  /** Atajo del flujo nuevo: liga la factura a la OC de esa solicitud (`SC-AAAA-NNNN`). */
  purchase_request_code?: string;
}

export interface ConfirmInvoiceIntakeItem {
  product_id: number;
  quantity: number;
  unit_price: number;
  detected_name?: string | null;
  /** Obligatorio para `equipo` y `maqueta`: cajón donde se crean las unidades. */
  cajon_id?: number | null;
}

export interface ConfirmInvoiceIntakePayload {
  document_number: string;
  /** Opcional: si se omite, el backend intenta asociar una orden abierta por productos y cantidades. */
  purchase_id?: number | null;
  /** Flujo nuevo: liga la factura a la OC de esa solicitud (`SC-AAAA-NNNN`, debe estar `con_oc`). */
  purchase_request_code?: string;
  /** Solo DIR-01: autoriza facturar por sobre lo libre del presupuesto (tras el 422 `over_budget`). */
  allow_over_budget?: boolean;
  items: ConfirmInvoiceIntakeItem[];
}
