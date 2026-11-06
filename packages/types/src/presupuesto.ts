import type { Usuario } from './usuario';
import type { Career } from './unidad';

/** Presupuesto anual de una carrera (REQ-16). Montos ya normalizados a número (CLP). */
export interface AnnualBudget {
  id: number;
  career_id: number;
  career?: Career;
  year: number;
  initial_amount: number;
  /** Inicial − consumido; NO baja al reservar. */
  available_amount: number;
  reserved_amount: number;
  /** available − reserved: lo realmente gastable. Puede ser negativo tras un exceso autorizado. */
  free_amount: number;
  consumed_amount: number;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: string;
  updated_at?: string;
}

/** Fila de `GET /api/budgets/summary`. */
export interface BudgetSummaryRow {
  id: number;
  career_id: number;
  career?: Career;
  year: number;
  initial_amount: number;
  reserved_amount: number;
  consumed_amount: number;
  available_amount: number;
  free_amount: number;
  /** (consumido + reservado) / inicial × 100. */
  execution_percent: number;
}

export const BudgetMovementType = {
  ASIGNACION_INICIAL: 'asignacion_inicial',
  AJUSTE: 'ajuste',
  RESERVA: 'reserva',
  LIBERACION_RESERVA: 'liberacion_reserva',
  CONSUMO: 'consumo',
  REPOSICION: 'reposicion',
} as const;

export type BudgetMovementType = (typeof BudgetMovementType)[keyof typeof BudgetMovementType];

/** Movimiento inmutable del ledger. `amount` siempre es positivo; el signo lo da el tipo. */
export interface BudgetMovement {
  id: number;
  annual_budget_id: number;
  type: BudgetMovementType;
  amount: number;
  purchase_id: number | null;
  invoice_intake_id: number | null;
  user_id: number | null;
  user?: Usuario;
  notes: string | null;
  created_at: string;
}

export type BudgetSpendingGroupBy = 'product' | 'product_type' | 'supplier';

export interface BudgetSpendingRow {
  id: number | null;
  label: string;
  quantity: number;
  amount: number;
}

export interface BudgetSpending {
  annual_budget_id: number;
  group_by: BudgetSpendingGroupBy;
  total: number;
  data: BudgetSpendingRow[];
}

export interface BudgetMonthlyRow {
  /** 1 a 12. */
  month: number;
  reserved: number;
  consumed: number;
  restored: number;
}

export interface BudgetMonthly {
  annual_budget_id: number;
  year: number;
  data: BudgetMonthlyRow[];
}

export interface BudgetQueryParams {
  year?: number;
  career_id?: number;
  per_page?: number;
  page?: number;
}

export interface BudgetMovementQueryParams {
  type?: BudgetMovementType;
  from?: string;
  to?: string;
  purchase_id?: number;
  invoice_intake_id?: number;
  per_page?: number;
  page?: number;
}

export interface CreateBudgetPayload {
  career_id: number;
  year: number;
  initial_amount: number;
}

export interface UpdateBudgetPayload {
  initial_amount: number;
}
