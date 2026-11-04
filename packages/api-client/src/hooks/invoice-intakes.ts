import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import type {
  ConfirmInvoiceIntakePayload,
  InvoiceIntake,
  InvoiceIntakeQueryParams,
  UploadInvoiceIntakePayload,
} from '@sgia/types';
import {
  cancelInvoiceIntake,
  confirmInvoiceIntake,
  downloadInvoiceIntakeFile,
  fetchInvoiceIntake,
  fetchInvoiceIntakes,
  uploadInvoiceIntake,
} from '../services/invoice-intakes';
import { invalidateBudgets } from './budgets';

export const invoiceIntakeKeys = {
  all: ['invoice-intakes'] as const,
  list: (params?: InvoiceIntakeQueryParams) => ['invoice-intakes', 'list', params] as const,
  detail: (id: number) => ['invoice-intakes', 'detail', id] as const,
};

/** Confirmar o anular mueve presupuesto, stock, unidades y la reserva de la compra ligada. */
function invalidateAfterStockChange(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: invoiceIntakeKeys.all }),
    invalidateBudgets(queryClient),
    queryClient.invalidateQueries({ queryKey: ['products'] }),
    queryClient.invalidateQueries({ queryKey: ['equipment-units'] }),
    queryClient.invalidateQueries({ queryKey: ['purchases'] }),
  ]);
}

export function useInvoiceIntakes(params?: InvoiceIntakeQueryParams) {
  return useQuery({
    queryKey: invoiceIntakeKeys.list(params),
    queryFn: () => fetchInvoiceIntakes(params),
    placeholderData: keepPreviousData,
  });
}

export function useInvoiceIntake(id: number | undefined) {
  return useQuery({
    queryKey: invoiceIntakeKeys.detail(id ?? 0),
    queryFn: () => fetchInvoiceIntake(id as number),
    enabled: id !== undefined,
  });
}

/** Archivo de la factura (descarga autenticada como Blob); solo si el ingreso tiene archivo. */
export function useInvoiceIntakeFile(id: number | undefined, enabled = true) {
  return useQuery({
    queryKey: [...invoiceIntakeKeys.detail(id ?? 0), 'file'] as const,
    queryFn: () => downloadInvoiceIntakeFile(id as number),
    enabled: id !== undefined && enabled,
    staleTime: Infinity,
  });
}

export function useUploadInvoiceIntake() {
  const queryClient = useQueryClient();
  return useMutation<InvoiceIntake, Error, UploadInvoiceIntakePayload>({
    mutationFn: uploadInvoiceIntake,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: invoiceIntakeKeys.all }),
  });
}

export function useConfirmInvoiceIntake() {
  const queryClient = useQueryClient();
  return useMutation<InvoiceIntake, Error, { id: number; payload: ConfirmInvoiceIntakePayload }>({
    mutationFn: ({ id, payload }) => confirmInvoiceIntake(id, payload),
    onSuccess: () => invalidateAfterStockChange(queryClient),
  });
}

export function useCancelInvoiceIntake() {
  const queryClient = useQueryClient();
  return useMutation<InvoiceIntake, Error, number>({
    mutationFn: cancelInvoiceIntake,
    onSuccess: () => invalidateAfterStockChange(queryClient),
  });
}
