import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePurchases, useUpdatePurchaseStatus } from '@sgia/api-client';

const rawPurchase = {
  id: 7,
  code: 'OC-2026-000007',
  supplier_id: 3,
  supplier: { id: 3, name: 'Proveedor A', email: 'a@test.cl' },
  status: 'en_camino',
  items: [{ name: 'Cable', quantity: 2, unit_price: '1500' }],
  total_amount: '3000',
  allowed_transitions: ['completa'],
  created_at: '2026-10-30T10:00:00+00:00',
  updated_at: '2026-10-30T10:00:00+00:00',
};

describe('Hooks de compras (REQ-08)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('usePurchases normaliza el listado y envía el filtro de estado', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [rawPurchase] }),
    } as Response);

    const { result } = renderHook(() => usePurchases({ status: 'en_camino' }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(String(mockFetch.mock.calls[0][0])).toContain('/purchases?status=en_camino');
    const order = result.current.data!.data[0];
    expect(order.code).toBe('OC-2026-000007');
    expect(order.total_amount).toBe(3000);
    expect(order.items[0].unit_price).toBe(1500);
  });

  it('useUpdatePurchaseStatus pasa en_camino a completa e invalida caché', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: { ...rawPurchase, status: 'completa', allowed_transitions: [] } }),
    } as Response);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdatePurchaseStatus(), { wrapper });
    const res = await result.current.mutateAsync({ id: 7, status: 'completa' });

    const [url, init] = mockFetch.mock.calls[0];
    expect(String(url)).toContain('/purchases/7/status');
    expect(init?.method).toBe('PATCH');
    expect(JSON.parse(String(init?.body))).toEqual({ status: 'completa' });
    expect(res.status).toBe('completa');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['purchases'] });
  });
});
