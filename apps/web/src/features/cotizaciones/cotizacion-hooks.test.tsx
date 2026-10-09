import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiRequestError, useCreateCotizacion } from '@sgia/api-client';
import type { CreateCotizacionPayload } from '@sgia/types';

describe('useCreateCotizacion - Integration test (REQ-07)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('envía la cotización exitosamente con >= 3 proveedores e invalida caché', async () => {
    const expectedResponse = {
      id: 42,
      estado: 'pendiente',
      items: [{ product_id: 1, quantity: 5 }],
      suppliers: [
        { id: 10, name: 'Proveedor A', email: 'a@test.cl' },
        { id: 20, name: 'Proveedor B', email: 'b@test.cl' },
        { id: 30, name: 'Proveedor C', email: 'c@test.cl' },
      ],
      createdAt: '2026-10-08T00:00:00Z',
      updatedAt: '2026-10-08T00:00:00Z',
      creadoPorId: 1,
    };

    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ data: expectedResponse }),
    } as Response);

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateCotizacion(), { wrapper });

    const payload: CreateCotizacionPayload = {
      products: [{ id: 1, quantity: 5 }],
      supplier_ids: [10, 20, 30],
      notes: 'Urgente',
    };

    const res = await result.current.mutateAsync(payload);

    expect(mockFetch).toHaveBeenCalled();
    expect(res.id).toBe(42);
    expect(res.estado).toBe('pendiente');
    expect(res.suppliers).toHaveLength(3);
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['quotations'] }),
    );
  });

  it('maneja el error 422 del backend cuando se envían menos de 3 proveedores', async () => {
    const backendError = {
      message: 'Se requieren al menos 3 proveedores para emitir una cotización.',
      errors: {
        supplier_ids: ['Se requieren al menos 3 proveedores.'],
      },
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => backendError,
    } as Response);

    const { result } = renderHook(() => useCreateCotizacion(), { wrapper });

    const payload: CreateCotizacionPayload = {
      products: [{ id: 1, quantity: 5 }],
      supplier_ids: [10, 20], // Solo 2 proveedores
    };

    await expect(result.current.mutateAsync(payload)).rejects.toSatisfy((err) => {
      expect(err).toBeInstanceOf(ApiRequestError);
      expect((err as ApiRequestError).status).toBe(422);
      expect((err as ApiRequestError).body?.message).toContain('Se requieren al menos 3 proveedores');
      return true;
    });
  });

  it('maneja errores de red (500) al crear cotización', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal Server Error' }),
    } as Response);

    const { result } = renderHook(() => useCreateCotizacion(), { wrapper });

    const payload: CreateCotizacionPayload = {
      products: [{ id: 1, quantity: 5 }],
      supplier_ids: [10, 20, 30],
    };

    await expect(result.current.mutateAsync(payload)).rejects.toSatisfy((err) => {
      expect(err).toBeInstanceOf(ApiRequestError);
      expect((err as ApiRequestError).status).toBe(500);
      return true;
    });
  });

  it('maneja error de timeout al crear cotización', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network timeout'));

    const { result } = renderHook(() => useCreateCotizacion(), { wrapper });

    const payload: CreateCotizacionPayload = {
      products: [{ id: 1, quantity: 5 }],
      supplier_ids: [10, 20, 30],
    };

    await expect(result.current.mutateAsync(payload)).rejects.toThrow('Network timeout');
  });

  it('envía múltiples productos correctamente', async () => {
    const expectedResponse = {
      id: 43,
      estado: 'pendiente',
      items: [
        { product_id: 1, quantity: 5 },
        { product_id: 2, quantity: 10 },
        { product_id: 3, quantity: 2 },
      ],
      suppliers: [
        { id: 10, name: 'Proveedor A', email: 'a@test.cl' },
        { id: 20, name: 'Proveedor B', email: 'b@test.cl' },
        { id: 30, name: 'Proveedor C', email: 'c@test.cl' },
        { id: 40, name: 'Proveedor D', email: 'd@test.cl' },
      ],
      createdAt: '2026-10-08T00:00:00Z',
      updatedAt: '2026-10-08T00:00:00Z',
      creadoPorId: 1,
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ data: expectedResponse }),
    } as Response);

    const { result } = renderHook(() => useCreateCotizacion(), { wrapper });

    const payload: CreateCotizacionPayload = {
      products: [
        { id: 1, quantity: 5 },
        { id: 2, quantity: 10 },
        { id: 3, quantity: 2 },
      ],
      supplier_ids: [10, 20, 30, 40],
      notes: 'Cotización trimestral Q4 2026',
    };

    const res = await result.current.mutateAsync(payload);

    expect(res.items).toHaveLength(3);
    expect(res.suppliers).toHaveLength(4);
  });
});
