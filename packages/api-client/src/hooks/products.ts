import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateProductoPayload, Producto, ProductoParams, UpdateProductoPayload } from '@sgia/types';
import {
  createProducto,
  fetchProduct,
  fetchProductBarcode,
  fetchProductLocation,
  fetchProducts,
  setProductoActivo,
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

export function useToggleProductoActivo() {
  const queryClient = useQueryClient();
  return useMutation<Producto, Error, { id: number; is_active: boolean }>({
    mutationFn: ({ id, is_active }) => setProductoActivo(id, is_active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  });
}
