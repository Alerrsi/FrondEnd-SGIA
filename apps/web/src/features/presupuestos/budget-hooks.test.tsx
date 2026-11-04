import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useBudgetMovements,
  useBudgetSummary,
  useConfirmInvoiceIntake,
  useInvoiceIntake,
} from '@sgia/api-client';

const jsonResponse = (body: unknown, status = 200) =>
  ({ ok: status < 400, status, json: async () => body }) as Response;

describe('Hooks de presupuestos e ingresos (REQ-16 / REQ-17)', () => {
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

  it('useBudgetSummary normaliza los montos string a número y filtra por año', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({
        data: [
          {
            id: 3,
            career_id: 2,
            career: { id: 2, name: 'Ingeniería en Informática', code: 'ISD', level: 'profesional' },
            year: 2026,
            initial_amount: '1000000.00',
            reserved_amount: '150000.00',
            consumed_amount: '250000.00',
            available_amount: '600000.00',
            execution_percent: 40,
          },
        ],
      }),
    );

    const { result } = renderHook(() => useBudgetSummary({ year: 2026 }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(String(mockFetch.mock.calls[0]?.[0])).toContain('/budgets/summary?year=2026');
    const row = result.current.data?.[0];
    expect(row?.initial_amount).toBe(1_000_000);
    expect(row?.reserved_amount).toBe(150_000);
    expect(row?.consumed_amount).toBe(250_000);
    expect(row?.available_amount).toBe(600_000);
    expect(row?.execution_percent).toBe(40);
  });

  it('useBudgetMovements pagina el ledger y convierte la meta de Laravel', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({
        data: [
          {
            id: 9,
            annual_budget_id: 3,
            type: 'reserva',
            amount: '50000.00',
            purchase_id: 12,
            invoice_intake_id: null,
            user_id: 1,
            notes: null,
            created_at: '2026-11-01T12:00:00+00:00',
          },
        ],
        meta: { current_page: 2, last_page: 4, per_page: 15, total: 50 },
      }),
    );

    const { result } = renderHook(
      () => useBudgetMovements(3, { type: 'reserva', page: 2, per_page: 15 }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const url = String(mockFetch.mock.calls[0]?.[0]);
    expect(url).toContain('/budgets/3/movements?');
    expect(url).toContain('type=reserva');
    expect(result.current.data?.data[0]?.amount).toBe(50_000);
    expect(result.current.data?.meta).toEqual({
      currentPage: 2,
      lastPage: 4,
      perPage: 15,
      total: 50,
    });
  });

  it('useInvoiceIntake normaliza el OCR y los ítems', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({
        data: {
          id: 5,
          annual_budget_id: 3,
          purchase_id: null,
          document_number: null,
          status: 'borrador',
          total_deducted: '0.00',
          has_file: true,
          raw_ocr_payload: {
            invoice_number: 'F-881',
            supplier_name: 'Electro Sur',
            supplier_id: null,
            items: [{ name: ' Cable UTP ', quantity: '2', unit_price: '1990.5', area: null }],
            ocr_available: true,
          },
          items: [],
          received_at: null,
        },
      }),
    );

    const { result } = renderHook(() => useInvoiceIntake(5), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const intake = result.current.data;
    expect(intake?.raw_ocr_payload.items[0]).toEqual({
      name: 'Cable UTP',
      quantity: 2,
      unit_price: 1990.5,
      area: null,
    });
    expect(intake?.has_file).toBe(true);
  });

  it('useConfirmInvoiceIntake invalida presupuestos, productos, unidades y compras', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({
        data: {
          id: 5,
          annual_budget_id: 3,
          status: 'confirmado',
          document_number: 'F-881',
          total_deducted: '3981.00',
          has_file: true,
          raw_ocr_payload: { items: [], ocr_available: true },
          items: [],
        },
      }),
    );
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useConfirmInvoiceIntake(), { wrapper });
    const confirmed = await result.current.mutateAsync({
      id: 5,
      payload: {
        document_number: 'F-881',
        items: [{ product_id: 1, quantity: 2, unit_price: 1990.5 }],
      },
    });

    const call = mockFetch.mock.calls[0];
    expect(String(call?.[0])).toContain('/invoice-intakes/5/confirm');
    expect(call?.[1]?.method).toBe('POST');
    expect(confirmed.total_deducted).toBe(3981);
    for (const key of ['invoice-intakes', 'budgets', 'products', 'equipment-units', 'purchases']) {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [key] });
    }
  });
});
