import { ApiRequestError } from '@sgia/api-client';

export interface OverBudgetInfo {
  overBy: number;
  freeAmount: number;
  total: number;
}

/** Datos del 422/403 `code: 'over_budget'` al confirmar una factura; `null` si el error es otro. */
export function parseOverBudget(error: unknown): OverBudgetInfo | null {
  if (!(error instanceof ApiRequestError) || error.body?.code !== 'over_budget') return null;
  return {
    overBy: Number(error.body.over_by ?? 0),
    freeAmount: Number(error.body.free_amount ?? 0),
    total: Number(error.body.total ?? 0),
  };
}
