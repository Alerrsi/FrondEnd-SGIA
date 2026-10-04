import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AprobarPrestamoPayload,
  CreatePrestamoPayload,
  Prestamo,
  PrestamoParams,
  RechazarPrestamoPayload,
} from '@sgia/types';
import {
  approveLoan,
  createLoanRequest,
  fetchLoan,
  fetchLoans,
  fetchPendingLoans,
  rejectLoan,
} from '../services/loans';

export const loanKeys = {
  all: ['loans'] as const,
  list: (params?: PrestamoParams) => ['loans', 'list', params] as const,
  pending: ['loans', 'pending'] as const,
  detail: (id: number) => ['loans', 'detail', id] as const,
};

export function useLoans(params?: PrestamoParams) {
  return useQuery({
    queryKey: loanKeys.list(params),
    queryFn: () => fetchLoans(params),
  });
}

export function usePendingLoans() {
  return useQuery({
    queryKey: loanKeys.pending,
    queryFn: fetchPendingLoans,
  });
}

export function useLoan(id: number | undefined) {
  return useQuery({
    queryKey: loanKeys.detail(id!),
    queryFn: () => fetchLoan(id!),
    enabled: id !== undefined,
  });
}

export function useCreatePrestamo() {
  const queryClient = useQueryClient();
  return useMutation<Prestamo, Error, CreatePrestamoPayload>({
    mutationFn: createLoanRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: loanKeys.all }),
  });
}

export function useAprobarPrestamo() {
  const queryClient = useQueryClient();
  return useMutation<Prestamo, Error, { id: number; payload?: AprobarPrestamoPayload }>({
    mutationFn: ({ id, payload }) => approveLoan(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: loanKeys.all }),
  });
}

export function useRechazarPrestamo() {
  const queryClient = useQueryClient();
  return useMutation<Prestamo, Error, { id: number; payload: RechazarPrestamoPayload }>({
    mutationFn: ({ id, payload }) => rejectLoan(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: loanKeys.all }),
  });
}
