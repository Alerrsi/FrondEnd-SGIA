import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Cotizacion,
  CotizacionParams,
  CreateCotizacionPayload,
  CreatePurchasePayload,
  CreateSupplierPayload,
  PurchaseArrivalScanPayload,
  PurchaseOrder,
  PurchaseQueryParams,
  PurchaseStatus,
  QuotationResponsePayload,
  QuotationStatus,
  Supplier,
  SupplierQueryParams,
} from '@sgia/types';
import {
  createCotizacion,
  createPurchase,
  createSupplier,
  fetchPurchase,
  fetchPurchases,
  fetchQuotation,
  fetchQuotations,
  fetchSupplier,
  fetchSuppliers,
  scanPurchaseArrival,
  setSupplierStatus,
  updatePurchaseStatus,
  updateQuotationResponse,
  updateQuotationStatus,
  updateSupplier,
} from '../services/quotations';

export const quotationKeys = {
  all: ['quotations'] as const,
  list: (params?: CotizacionParams) => ['quotations', 'list', params] as const,
  detail: (id: number) => ['quotations', 'detail', id] as const,
};

export const supplierKeys = {
  all: ['suppliers'] as const,
  list: (params?: SupplierQueryParams) => ['suppliers', 'list', params] as const,
  detail: (id: number) => ['suppliers', 'detail', id] as const,
};

export const purchaseKeys = {
  all: ['purchases'] as const,
  list: (params?: PurchaseQueryParams) => ['purchases', 'list', params] as const,
  detail: (id: number) => ['purchases', 'detail', id] as const,
};

export function useCotizaciones(params?: CotizacionParams) {
  return useQuery({
    queryKey: quotationKeys.list(params),
    queryFn: () => fetchQuotations(params),
  });
}

export function useCotizacion(id: number | undefined) {
  return useQuery({
    queryKey: quotationKeys.detail(id!),
    queryFn: () => fetchQuotation(id!),
    enabled: id !== undefined,
  });
}

export function useCreateCotizacion() {
  const queryClient = useQueryClient();
  return useMutation<Cotizacion, Error, CreateCotizacionPayload>({
    mutationFn: createCotizacion,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: quotationKeys.all }),
  });
}

export function useUpdateQuotationStatus() {
  const queryClient = useQueryClient();
  return useMutation<Cotizacion, Error, { id: number; status: QuotationStatus | string }>({
    mutationFn: ({ id, status }) => updateQuotationStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: quotationKeys.all }),
  });
}

export function useUpdateQuotationResponse() {
  const queryClient = useQueryClient();
  return useMutation<Cotizacion, Error, { id: number; payload: QuotationResponsePayload }>({
    mutationFn: ({ id, payload }) => updateQuotationResponse(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: quotationKeys.all }),
  });
}

export function useSuppliers(params?: SupplierQueryParams) {
  return useQuery({
    queryKey: supplierKeys.list(params),
    queryFn: () => fetchSuppliers(params),
  });
}

export function useSupplier(id: number | undefined) {
  return useQuery({
    queryKey: supplierKeys.detail(id!),
    queryFn: () => fetchSupplier(id!),
    enabled: id !== undefined,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation<Supplier, Error, CreateSupplierPayload>({
    mutationFn: createSupplier,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: supplierKeys.all }),
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation<Supplier, Error, { id: number; payload: Partial<CreateSupplierPayload> }>({
    mutationFn: ({ id, payload }) => updateSupplier(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: supplierKeys.all }),
  });
}

export function useSetSupplierStatus() {
  const queryClient = useQueryClient();
  return useMutation<Supplier, Error, { id: number; is_active: boolean }>({
    mutationFn: ({ id, is_active }) => setSupplierStatus(id, is_active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: supplierKeys.all }),
  });
}

export function usePurchases(params?: PurchaseQueryParams) {
  return useQuery({
    queryKey: purchaseKeys.list(params),
    queryFn: () => fetchPurchases(params),
  });
}

export function usePurchase(id: number | undefined) {
  return useQuery({
    queryKey: purchaseKeys.detail(id!),
    queryFn: () => fetchPurchase(id!),
    enabled: id !== undefined,
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  return useMutation<PurchaseOrder, Error, CreatePurchasePayload>({
    mutationFn: createPurchase,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: purchaseKeys.all }),
  });
}

export function useUpdatePurchaseStatus() {
  const queryClient = useQueryClient();
  return useMutation<PurchaseOrder, Error, { id: number; status: PurchaseStatus | string }>({
    mutationFn: ({ id, status }) => updatePurchaseStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: purchaseKeys.all }),
  });
}

export function useScanPurchaseArrival() {
  const queryClient = useQueryClient();
  return useMutation<PurchaseOrder, Error, { id: number; payload: PurchaseArrivalScanPayload }>({
    mutationFn: ({ id, payload }) => scanPurchaseArrival(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
