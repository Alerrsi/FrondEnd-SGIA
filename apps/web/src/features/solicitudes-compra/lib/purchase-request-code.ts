/** Código de solicitud `SC-AAAA-NNNN` (el correlativo puede crecer a más de 4 dígitos). */
export const PURCHASE_REQUEST_CODE_RE = /^SC-\d{4}-\d{4,}$/;

export function normalizePurchaseRequestCode(value: string): string {
  return value.trim().toUpperCase();
}

export function isPurchaseRequestCode(value: string): boolean {
  return PURCHASE_REQUEST_CODE_RE.test(normalizePurchaseRequestCode(value));
}
