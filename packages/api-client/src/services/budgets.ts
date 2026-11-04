import type {
  AnnualBudget,
  BudgetMonthly,
  BudgetMovement,
  BudgetMovementQueryParams,
  BudgetMovementType,
  BudgetQueryParams,
  BudgetSpending,
  BudgetSpendingGroupBy,
  BudgetSummaryRow,
  Career,
  CreateBudgetPayload,
  PaginatedResponse,
  UpdateBudgetPayload,
  Usuario,
} from '@sgia/types';
import { del, get, patch, post } from '../http';

// Presupuestos anuales (FU-03 / REQ-16). Los montos llegan como string decimal ("150000.00").

type Amount = number | string | null | undefined;

export function toAmount(value: Amount): number {
  if (value === null || value === undefined || value === '') return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export interface RawPaginated<T> {
  data?: T[];
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
  };
}

export function toPaginated<R, T>(
  res: RawPaginated<R> | undefined,
  map: (raw: R) => T,
): PaginatedResponse<T> {
  const data = (res?.data ?? []).map(map);
  const meta = res?.meta ?? {};
  return {
    data,
    meta: {
      currentPage: meta.current_page ?? 1,
      lastPage: meta.last_page ?? 1,
      perPage: meta.per_page ?? (data.length || 15),
      total: meta.total ?? data.length,
    },
  };
}

export function buildQuery(params?: object): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  }
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export interface RawAnnualBudget {
  id: number;
  career_id: number;
  career?: Career | null;
  year: number | string;
  initial_amount?: Amount;
  available_amount?: Amount;
  reserved_amount?: Amount;
  consumed_amount?: Amount;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: string;
  updated_at?: string;
}

export function normalizeBudget(raw: RawAnnualBudget): AnnualBudget {
  return {
    id: raw.id,
    career_id: raw.career_id,
    career: raw.career ?? undefined,
    year: Number(raw.year),
    initial_amount: toAmount(raw.initial_amount),
    available_amount: toAmount(raw.available_amount),
    reserved_amount: toAmount(raw.reserved_amount),
    consumed_amount: toAmount(raw.consumed_amount),
    created_by: raw.created_by ?? null,
    updated_by: raw.updated_by ?? null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

interface RawSummaryRow extends RawAnnualBudget {
  execution_percent?: Amount;
}

function normalizeSummaryRow(raw: RawSummaryRow): BudgetSummaryRow {
  const budget = normalizeBudget(raw);
  return {
    id: budget.id,
    career_id: budget.career_id,
    career: budget.career,
    year: budget.year,
    initial_amount: budget.initial_amount,
    reserved_amount: budget.reserved_amount,
    consumed_amount: budget.consumed_amount,
    available_amount: budget.available_amount,
    execution_percent: toAmount(raw.execution_percent),
  };
}

interface RawMovement {
  id: number;
  annual_budget_id: number;
  type: BudgetMovementType;
  amount?: Amount;
  purchase_id?: number | null;
  invoice_intake_id?: number | null;
  user_id?: number | null;
  user?: Usuario | null;
  notes?: string | null;
  created_at?: string;
}

function normalizeMovement(raw: RawMovement): BudgetMovement {
  return {
    id: raw.id,
    annual_budget_id: raw.annual_budget_id,
    type: raw.type,
    amount: toAmount(raw.amount),
    purchase_id: raw.purchase_id ?? null,
    invoice_intake_id: raw.invoice_intake_id ?? null,
    user_id: raw.user_id ?? null,
    user: raw.user ?? undefined,
    notes: raw.notes ?? null,
    created_at: raw.created_at ?? '',
  };
}

function unwrap<T>(res: { data?: T } | T): T {
  if (res && typeof res === 'object' && 'data' in res && res.data !== undefined)
    return res.data as T;
  return res as T;
}

export async function fetchBudgets(
  params?: BudgetQueryParams,
): Promise<PaginatedResponse<AnnualBudget>> {
  const res = await get<RawPaginated<RawAnnualBudget>>(`/budgets${buildQuery(params)}`);
  return toPaginated(res, normalizeBudget);
}

export async function fetchBudgetSummary(
  params?: Pick<BudgetQueryParams, 'year' | 'career_id'>,
): Promise<BudgetSummaryRow[]> {
  const res = await get<{ data?: RawSummaryRow[] }>(`/budgets/summary${buildQuery(params)}`);
  return (res?.data ?? []).map(normalizeSummaryRow);
}

export async function fetchBudget(id: number): Promise<AnnualBudget> {
  return normalizeBudget(unwrap(await get<{ data?: RawAnnualBudget }>(`/budgets/${id}`)));
}

export async function fetchBudgetMovements(
  id: number,
  params?: BudgetMovementQueryParams,
): Promise<PaginatedResponse<BudgetMovement>> {
  const res = await get<RawPaginated<RawMovement>>(`/budgets/${id}/movements${buildQuery(params)}`);
  return toPaginated(res, normalizeMovement);
}

interface RawSpending {
  annual_budget_id: number;
  group_by: BudgetSpendingGroupBy;
  total?: Amount;
  data?: Array<{
    id: number | null;
    label: string | null;
    quantity?: Amount;
    amount?: Amount;
  }>;
}

export async function fetchBudgetSpending(
  id: number,
  groupBy: BudgetSpendingGroupBy = 'product',
): Promise<BudgetSpending> {
  const res = await get<RawSpending>(`/budgets/${id}/spending${buildQuery({ group_by: groupBy })}`);
  return {
    annual_budget_id: res.annual_budget_id,
    group_by: res.group_by,
    total: toAmount(res.total),
    data: (res.data ?? []).map((row) => ({
      id: row.id,
      label: row.label ?? 'Sin nombre',
      quantity: toAmount(row.quantity),
      amount: toAmount(row.amount),
    })),
  };
}

interface RawMonthly {
  annual_budget_id: number;
  year: number;
  data?: Array<{
    month: number;
    reserved?: Amount;
    consumed?: Amount;
    restored?: Amount;
  }>;
}

export async function fetchBudgetMonthly(id: number, year?: number): Promise<BudgetMonthly> {
  const res = await get<RawMonthly>(`/budgets/${id}/monthly${buildQuery({ year })}`);
  return {
    annual_budget_id: res.annual_budget_id,
    year: Number(res.year),
    data: (res.data ?? []).map((row) => ({
      month: Number(row.month),
      reserved: toAmount(row.reserved),
      consumed: toAmount(row.consumed),
      restored: toAmount(row.restored),
    })),
  };
}

export async function createBudget(payload: CreateBudgetPayload): Promise<AnnualBudget> {
  return normalizeBudget(
    unwrap(await post<CreateBudgetPayload, { data?: RawAnnualBudget }>('/budgets', payload)),
  );
}

export async function updateBudget(
  id: number,
  payload: UpdateBudgetPayload,
): Promise<AnnualBudget> {
  return normalizeBudget(
    unwrap(await patch<UpdateBudgetPayload, { data?: RawAnnualBudget }>(`/budgets/${id}`, payload)),
  );
}

export async function deleteBudget(id: number): Promise<void> {
  await del<void>(`/budgets/${id}`);
}
