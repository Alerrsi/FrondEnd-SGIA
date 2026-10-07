import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fetchCriticalStockAlerts,
  resolveStockAlert,
  useCriticalStockAlerts,
  useResolveStockAlert,
} from '@sgia/api-client';

describe('Unit Test: Hooks y Servicios de Alertas de Stock (REQ-06)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
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

  describe('fetchCriticalStockAlerts', () => {
    it('construye la URL con parámetros de query correctamente', async () => {
      const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [{ id: 1, alert_type: 'critical', is_resolved: false }],
          meta: { currentPage: 1, total: 1 },
        }),
      } as Response);

      const res = await fetchCriticalStockAlerts({
        alert_type: 'critical',
        is_resolved: false,
        per_page: 15,
        page: 2,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/alerts/critical-stock?alert_type=critical&is_resolved=false&per_page=15&page=2',
        expect.objectContaining({ method: 'GET' }),
      );
      expect(res.data[0]?.id).toBe(1);
    });
  });

  describe('resolveStockAlert', () => {
    it('envía solicitud PATCH a /alerts/{id}/resolve', async () => {
      const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 42,
          is_resolved: true,
        }),
      } as Response);

      const res = await resolveStockAlert(42);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/alerts/42/resolve',
        expect.objectContaining({ method: 'PATCH' }),
      );
      expect(res.id).toBe(42);
      expect(res.is_resolved).toBe(true);
    });
  });

  describe('useCriticalStockAlerts', () => {
    it('ejecuta la query y retorna la lista de alertas paginada', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            { id: 1, alert_type: 'critical', product_name: 'Tester Fluke', is_resolved: false },
          ],
          meta: { currentPage: 1, total: 1 },
        }),
      } as Response);

      const { result } = renderHook(() => useCriticalStockAlerts({ alert_type: 'critical' }), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data).toHaveLength(1);
      expect(result.current.data?.data[0]?.product_name).toBe('Tester Fluke');
    });
  });

  describe('useResolveStockAlert', () => {
    it('ejecuta la mutación de resolución e invalida la caché de alertas', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 99,
          is_resolved: true,
        }),
      } as Response);

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useResolveStockAlert(), { wrapper });

      await result.current.mutateAsync(99);

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['alerts'] });
    });
  });
});
