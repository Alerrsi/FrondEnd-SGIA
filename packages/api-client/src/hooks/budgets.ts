import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import type {
  AnnualBudget,
  BudgetMovementQueryParams,
  BudgetQueryParams,
  BudgetSpendingGroupBy,
  CreateBudgetPayload,
  UpdateBudgetPayload,
} from '@sgia/types';
import {
  createBudget,
  deleteBudget,
  fetchBudget,
  fetchBudgetMonthly,
  fetchBudgetMovements,
  fetchBudgets,
  fetchBudgetSpending,
  fetchBudgetSummary,
  updateBudget,
} from '../services/budgets';

export const budgetKeys = {
  all: ['budgets'] as const,
  list: (params?: BudgetQueryParams) => ['budgets', 'list', params] as const,
  summary: (params?: Pick<BudgetQueryParams, 'year' | 'career_id'>) =>
    ['budgets', 'summary', params] as const,
  detail: (id: number) => ['budgets', 'detail', id] as const,
  movements: (id: number, params?: BudgetMovementQueryParams) =>
    ['budgets', 'movements', id, params] as const,
  spending: (id: number, groupBy: BudgetSpendingGroupBy) =>
    ['budgets', 'spending', id, groupBy] as const,
  monthly: (id: number, year?: number) => ['budgets', 'monthly', id, year] as const,
};

/** Toda operación que mueve dinero (compras, ingresos) invalida el árbol completo de presupuestos. */
export function invalidateBudgets(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: budgetKeys.all });
}

export function useBudgets(params?: BudgetQueryParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: budgetKeys.list(params),
    queryFn: () => fetchBudgets(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

export function useBudgetSummary(params?: Pick<BudgetQueryParams, 'year' | 'career_id'>) {
  return useQuery({
    queryKey: budgetKeys.summary(params),
    queryFn: () => fetchBudgetSummary(params),
    placeholderData: keepPreviousData,
  });
}

export function useBudget(id: number | undefined) {
  return useQuery({
    queryKey: budgetKeys.detail(id ?? 0),
    queryFn: () => fetchBudget(id as number),
    enabled: id !== undefined,
  });
}

export function useBudgetMovements(id: number | undefined, params?: BudgetMovementQueryParams) {
  return useQuery({
    queryKey: budgetKeys.movements(id ?? 0, params),
    queryFn: () => fetchBudgetMovements(id as number, params),
    enabled: id !== undefined,
    placeholderData: keepPreviousData,
  });
}

export function useBudgetSpending(
  id: number | undefined,
  groupBy: BudgetSpendingGroupBy = 'product',
) {
  return useQuery({
    queryKey: budgetKeys.spending(id ?? 0, groupBy),
    queryFn: () => fetchBudgetSpending(id as number, groupBy),
    enabled: id !== undefined,
  });
}

export function useBudgetMonthly(id: number | undefined, year?: number) {
  return useQuery({
    queryKey: budgetKeys.monthly(id ?? 0, year),
    queryFn: () => fetchBudgetMonthly(id as number, year),
    enabled: id !== undefined,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation<AnnualBudget, Error, CreateBudgetPayload>({
    mutationFn: createBudget,
    onSuccess: () => invalidateBudgets(queryClient),
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation<AnnualBudget, Error, { id: number; payload: UpdateBudgetPayload }>({
    mutationFn: ({ id, payload }) => updateBudget(id, payload),
    onSuccess: () => invalidateBudgets(queryClient),
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: deleteBudget,
    onSuccess: () => invalidateBudgets(queryClient),
  });
}
