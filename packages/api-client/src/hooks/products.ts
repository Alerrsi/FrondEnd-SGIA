import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateProductoPayload,
  CriticalStockAlert,
  CriticalStockAlertList,
  CriticalStockAlertQueryParams,
  InvoiceScanResponse,
  ProductConditionPayload,
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
  dismissStockAlert,
  setProductoActivo,
  updateProductCondition,
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

export function useProducts(params?: ProductoParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => fetchProducts(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
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

export function useUpdateProductCondition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProductConditionPayload }) =>
      updateProductCondition(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
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

export function useCriticalStockAlerts(
  params?: CriticalStockAlertQueryParams,
  options?: { refetchInterval?: number },
) {
  return useQuery({
    queryKey: alertKeys.criticalStock(params),
    queryFn: () => fetchCriticalStockAlerts(params),
    placeholderData: keepPreviousData,
    refetchInterval: options?.refetchInterval,
  });
}

type AlertListSnapshot = [readonly unknown[], CriticalStockAlertList | undefined][];

/**
 * Quita una alerta de la campana del usuario (docs/exportaciones-y-campana.md). Optimista: sale al instante de las
 * listas con `exclude_dismissed` y sus totales bajan; si la API falla, vuelven.
 */
export function useDismissStockAlert() {
  const queryClient = useQueryClient();
  const isBell = (key: readonly unknown[]) =>
    (key[2] as CriticalStockAlertQueryParams | undefined)?.exclude_dismissed === true;

  return useMutation<void, Error, CriticalStockAlert, { snapshot: AlertListSnapshot }>({
    mutationFn: (alert) => dismissStockAlert(alert.id),
    onMutate: async (alert) => {
      await queryClient.cancelQueries({ queryKey: alertKeys.all });
      const snapshot = queryClient
        .getQueriesData<CriticalStockAlertList>({ queryKey: alertKeys.all })
        .filter(([key]) => isBell(key));
      for (const [key, list] of snapshot) {
        if (!list?.data.some((a) => a.id === alert.id)) continue;
        const counts = list.counts
          ? {
              ...list.counts,
              active: Math.max(0, list.counts.active - 1),
              critical: Math.max(0, list.counts.critical - (alert.alert_type === 'critical' ? 1 : 0)),
              warning: Math.max(0, list.counts.warning - (alert.alert_type === 'critical' ? 0 : 1)),
            }
          : undefined;
        queryClient.setQueryData<CriticalStockAlertList>(key, {
          ...list,
          data: list.data.filter((a) => a.id !== alert.id),
          ...(counts ? { counts } : {}),
        });
      }
      return { snapshot };
    },
    onError: (_error, _alert, context) => {
      for (const [key, list] of context?.snapshot ?? []) queryClient.setQueryData(key, list);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.all });
    },
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
