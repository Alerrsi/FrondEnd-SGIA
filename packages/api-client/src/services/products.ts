import type {
  BorradorProducto,
  CreateProductoPayload,
  PaginatedResponse,
  Producto,
  ProductoParams,
} from '@sgia/types';
import { get, post } from '../http';

export async function fetchProducts(params?: ProductoParams): Promise<PaginatedResponse<Producto>> {
  const query = new URLSearchParams();
  if (params?.query) query.set('query', params.query);
  if (params?.ubicacionId) query.set('ubicacionId', String(params.ubicacionId));
  if (params?.soloStockCritico) query.set('soloStockCritico', '1');
  if (params?.page) query.set('page', String(params.page));
  if (params?.perPage) query.set('perPage', String(params.perPage));

  const qs = query.toString();
  return get<PaginatedResponse<Producto>>(`/productos${qs ? `?${qs}` : ''}`);
}

export async function fetchProduct(id: number): Promise<Producto> {
  return get<Producto>(`/productos/${id}`);
}

export async function createProducto(payload: CreateProductoPayload): Promise<Producto> {
  return post<CreateProductoPayload, Producto>('/productos', payload);
}

export async function extractFactura(file: File): Promise<BorradorProducto> {
  const form = new FormData();
  form.append('factura', file);
  return post<FormData, BorradorProducto>('/productos/extraer-factura', form);
}