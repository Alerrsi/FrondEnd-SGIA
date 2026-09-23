import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateProductoPayload, Producto, ProductoParams } from '@sgia/types';
import { createProducto, fetchProduct, fetchProducts } from '../services/products';

export const productKeys = {
  all: ['productos'] as const,
  list: (params?: ProductoParams) => ['productos', 'list', params] as const,
  detail: (id: number) => ['productos', 'detail', id] as const,
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

export function useCreateProducto() {
  const queryClient = useQueryClient();
  return useMutation<Producto, Error, CreateProductoPayload>({
    mutationFn: createProducto,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  });
}