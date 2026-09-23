import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AprobarPrestamoPayload,
  CreatePrestamoPayload,
  Prestamo,
  PrestamoParams,
  RechazarPrestamoPayload,
} from '@sgia/types';
import { approbarPrestamo, createPrestamo, fetchLoan, fetchLoans, rechazarPrestamo } from '../services/loans';

export const loanKeys = {
  all: ['prestamos'] as const,
  list: (params?: PrestamoParams) => ['prestamos', 'list', params] as const,
  detail: (id: number) => ['prestamos', 'detail', id] as const,
};

export function useLoans(params?: PrestamoParams) {
  return useQuery({
    queryKey: loanKeys.list(params),
    queryFn: () => fetchLoans(params),
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
    mutationFn: createPrestamo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: loanKeys.all }),
  });
}

export function useAprobarPrestamo() {
  const queryClient = useQueryClient();
  return useMutation<Prestamo, Error, { id: number; payload: AprobarPrestamoPayload }>({
    mutationFn: ({ id, payload }) => approbarPrestamo(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: loanKeys.all }),
  });
}

export function useRechazarPrestamo() {
  const queryClient = useQueryClient();
  return useMutation<Prestamo, Error, { id: number; payload: RechazarPrestamoPayload }>({
    mutationFn: ({ id, payload }) => rechazarPrestamo(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: loanKeys.all }),
  });
}