import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateProductoPayload,
  CriticalStockAlert,
  CriticalStockAlertQueryParams,
  InvoiceScanResponse,
  ProductLocationPayload,
  Producto,
  ProductoParams,
  Ubicacion,
  UpdateProductoPayload,
} from '@sgia/types';
import {
  createProducto,
  deleteProducto,
  extractFactura,
  fetchCriticalStockAlerts,
  fetchProduct,
  fetchProductBarcode,
  fetchProductLocation,
  fetchProducts,
  resolveStockAlert,
  setProductoActivo,
  updateProductLocation,
  updateProducto,
} from '../services/products';

export const productKeys = {
  all: ['products'] as const,
  list: (params?: ProductoParams) => ['products', 'list', params] as const,
  detail: (id: number) => ['products', 'detail', id] as const,
  barcode: (id: number) => ['products', 'barcode', id] as const,
  location: (id: number) => ['products', 'location', id] as const,
};

export function useProducts(params?: ProductoParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => fetchProducts(params),
    placeholderData: keepPreviousData,
  });
}

export function useProduct(id: number | undefined) {
  return useQuery({
    queryKey: productKeys.detail(id!),
    queryFn: () => fetchProduct(id!),
    enabled: id !== undefined,
  });
}

export function useProductBarcode(id: number | undefined) {
  return useQuery({
    queryKey: productKeys.barcode(id!),
    queryFn: () => fetchProductBarcode(id!),
    enabled: id !== undefined,
  });
}

export function useProductLocation(id: number | undefined) {
  return useQuery({
    queryKey: productKeys.location(id!),
    queryFn: () => fetchProductLocation(id!),
    enabled: id !== undefined,
  });
}

export function useUpdateProductLocation() {
  const queryClient = useQueryClient();
  return useMutation<Ubicacion, Error, { id: number; payload: ProductLocationPayload }>({
    mutationFn: ({ id, payload }) => updateProductLocation(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.location(variables.id) });
    },
  });
}

export function useCreateProducto() {
  const queryClient = useQueryClient();
  return useMutation<Producto, Error, CreateProductoPayload>({
    mutationFn: createProducto,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useUpdateProducto() {
  const queryClient = useQueryClient();
  return useMutation<Producto, Error, { id: number; payload: UpdateProductoPayload }>({
    mutationFn: ({ id, payload }) => updateProducto(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useDeleteProducto() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => deleteProducto(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useToggleProductoActivo() {
  const queryClient = useQueryClient();
  return useMutation<Producto, Error, { id: number; is_active: boolean }>({
    mutationFn: ({ id, is_active }) => setProductoActivo(id, is_active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useScanInvoice() {
  return useMutation<InvoiceScanResponse, Error, File>({
    mutationFn: (file) => extractFactura(file) as Promise<InvoiceScanResponse>,
  });
}

export const alertKeys = {
  all: ['alerts'] as const,
  list: (params?: CriticalStockAlertQueryParams) => ['alerts', 'list', params] as const,
  criticalStock: (params?: CriticalStockAlertQueryParams) => ['alerts', 'critical-stock', params] as const,
};

export function useCriticalStockAlerts(params?: CriticalStockAlertQueryParams) {
  return useQuery({
    queryKey: alertKeys.criticalStock(params),
    queryFn: () => fetchCriticalStockAlerts(params),
    placeholderData: keepPreviousData,
  });
}

export function useResolveStockAlert() {
  const queryClient = useQueryClient();
  return useMutation<CriticalStockAlert, Error, number>({
    mutationFn: (id) => resolveStockAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
