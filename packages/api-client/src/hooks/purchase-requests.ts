import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import type {
  CreatePurchaseRequestPayload,
  PurchaseRequest,
  PurchaseRequestQueryParams,
  SendPurchaseRequestPayload,
  UpdatePurchaseRequestPayload,
  UploadPurchaseRequestOrderPayload,
  UploadPurchaseRequestQuotationPayload,
} from '@sgia/types';
import { invalidateBudgets } from './budgets';
import { purchaseKeys } from './quotations';
import {
  approvePurchaseRequest,
  cancelPurchaseRequest,
  createPurchaseRequest,
  deletePurchaseRequestQuotation,
  fetchPurchaseRequest,
  fetchPurchaseRequestAreas,
  fetchPurchaseRequests,
  resendPurchaseRequest,
  selectPurchaseRequestQuotation,
  sendPurchaseRequest,
  updatePurchaseRequest,
  uploadPurchaseRequestOrder,
  uploadPurchaseRequestQuotation,
} from '../services/purchase-requests';

export const purchaseRequestKeys = {
  all: ['purchase-requests'] as const,
  list: (params?: PurchaseRequestQueryParams) => ['purchase-requests', 'list', params] as const,
  detail: (id: number) => ['purchase-requests', 'detail', id] as const,
  areas: ['purchase-requests', 'areas'] as const,
};

function invalidateRequests(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: purchaseRequestKeys.all });
}

/** Deja el detalle actualizado en caché y refresca los listados. */
function storeRequest(queryClient: QueryClient, request: PurchaseRequest) {
  queryClient.setQueryData(purchaseRequestKeys.detail(request.id), request);
  return invalidateRequests(queryClient);
}

export function usePurchaseRequests(
  params?: PurchaseRequestQueryParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: purchaseRequestKeys.list(params),
    queryFn: () => fetchPurchaseRequests(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

export function usePurchaseRequest(id: number | undefined) {
  return useQuery({
    queryKey: purchaseRequestKeys.detail(id ?? 0),
    queryFn: () => fetchPurchaseRequest(id as number),
    enabled: id !== undefined,
  });
}

export function usePurchaseRequestAreas() {
  return useQuery({
    queryKey: purchaseRequestKeys.areas,
    queryFn: fetchPurchaseRequestAreas,
    staleTime: Infinity,
  });
}

export function useCreatePurchaseRequest() {
  const queryClient = useQueryClient();
  return useMutation<PurchaseRequest, Error, CreatePurchaseRequestPayload>({
    mutationFn: createPurchaseRequest,
    onSuccess: (request) => storeRequest(queryClient, request),
  });
}

export function useUpdatePurchaseRequest() {
  const queryClient = useQueryClient();
  return useMutation<PurchaseRequest, Error, { id: number; payload: UpdatePurchaseRequestPayload }>(
    {
      mutationFn: ({ id, payload }) => updatePurchaseRequest(id, payload),
      onSuccess: (request) => storeRequest(queryClient, request),
    },
  );
}

export function useApprovePurchaseRequest() {
  const queryClient = useQueryClient();
  return useMutation<PurchaseRequest, Error, number>({
    mutationFn: approvePurchaseRequest,
    onSuccess: (request) => storeRequest(queryClient, request),
  });
}

export function useSendPurchaseRequest() {
  const queryClient = useQueryClient();
  return useMutation<PurchaseRequest, Error, { id: number; payload: SendPurchaseRequestPayload }>({
    mutationFn: ({ id, payload }) => sendPurchaseRequest(id, payload),
    onSuccess: (request) => storeRequest(queryClient, request),
  });
}

export function useResendPurchaseRequest() {
  const queryClient = useQueryClient();
  return useMutation<PurchaseRequest, Error, number>({
    mutationFn: resendPurchaseRequest,
    onSuccess: (request) => storeRequest(queryClient, request),
  });
}

export function useCancelPurchaseRequest() {
  const queryClient = useQueryClient();
  return useMutation<PurchaseRequest, Error, number>({
    mutationFn: cancelPurchaseRequest,
    onSuccess: (request) => {
      // Cancelar con OC libera la reserva del presupuesto.
      invalidateBudgets(queryClient);
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all });
      return storeRequest(queryClient, request);
    },
  });
}

export function useUploadPurchaseRequestQuotation() {
  const queryClient = useQueryClient();
  return useMutation<
    PurchaseRequest,
    Error,
    { id: number; payload: UploadPurchaseRequestQuotationPayload }
  >({
    mutationFn: ({ id, payload }) => uploadPurchaseRequestQuotation(id, payload),
    onSuccess: (request) => storeRequest(queryClient, request),
  });
}

export function useDeletePurchaseRequestQuotation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: number; quotationId: number }>({
    mutationFn: ({ id, quotationId }) => deletePurchaseRequestQuotation(id, quotationId),
    onSuccess: () => invalidateRequests(queryClient),
  });
}

export function useSelectPurchaseRequestQuotation() {
  const queryClient = useQueryClient();
  return useMutation<PurchaseRequest, Error, { id: number; quotationId: number }>({
    mutationFn: ({ id, quotationId }) => selectPurchaseRequestQuotation(id, quotationId),
    onSuccess: (request) => storeRequest(queryClient, request),
  });
}

export function useUploadPurchaseRequestOrder() {
  const queryClient = useQueryClient();
  return useMutation<
    PurchaseRequest,
    Error,
    { id: number; payload: UploadPurchaseRequestOrderPayload }
  >({
    mutationFn: ({ id, payload }) => uploadPurchaseRequestOrder(id, payload),
    onSuccess: (request) => {
      // La OC crea la compra y reserva el total en el presupuesto.
      invalidateBudgets(queryClient);
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all });
      return storeRequest(queryClient, request);
    },
  });
}
