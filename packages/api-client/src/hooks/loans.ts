import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AprobarPrestamoPayload,
  CreatePrestamoPayload,
  LoanCheckinPayload,
  LoanCheckoutPayload,
  LoanExportParams,
  Prestamo,
  PrestamoParams,
  RechazarPrestamoPayload,
  RemoteLoanRequestPayload,
} from '@sgia/types';
import {
  approveLoan,
  cancelLoanRequest,
  checkinLoan,
  checkoutLoan,
  createLoanRequest,
  exportLoans,
  fetchLoan,
  fetchLoans,
  fetchMyLoanRequests,
  fetchPendingLoans,
  rejectLoan,
} from '../services/loans';

export const loanKeys = {
  all: ['loans'] as const,
  list: (params?: PrestamoParams) => ['loans', 'list', params] as const,
  pending: ['loans', 'pending'] as const,
  myRequests: ['loans', 'my-requests'] as const,
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

export function useMyLoanRequests() {
  return useQuery({
    queryKey: loanKeys.myRequests,
    queryFn: fetchMyLoanRequests,
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
  return useMutation<Prestamo, Error, CreatePrestamoPayload | RemoteLoanRequestPayload>({
    mutationFn: createLoanRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loanKeys.all });
    },
  });
}

export const useCreateLoanRequest = useCreatePrestamo;

export function useCancelLoanRequest() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: cancelLoanRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loanKeys.all });
    },
  });
}

export function useAprobarPrestamo() {
  const queryClient = useQueryClient();
  return useMutation<Prestamo, Error, { id: number; payload?: AprobarPrestamoPayload }>({
    mutationFn: ({ id, payload }) => approveLoan(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loanKeys.all });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useRechazarPrestamo() {
  const queryClient = useQueryClient();
  return useMutation<Prestamo, Error, { id: number; payload: RechazarPrestamoPayload }>({
    mutationFn: ({ id, payload }) => rejectLoan(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loanKeys.all });
    },
  });
}

export function useCheckoutLoan() {
  const queryClient = useQueryClient();
  return useMutation<Prestamo, Error, LoanCheckoutPayload>({
    mutationFn: checkoutLoan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loanKeys.all });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useCheckinLoan() {
  const queryClient = useQueryClient();
  return useMutation<Prestamo, Error, LoanCheckinPayload>({
    mutationFn: checkinLoan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loanKeys.all });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useExportLoans() {
  return useMutation<Blob, Error, LoanExportParams | undefined>({
    mutationFn: exportLoans,
  });
}
