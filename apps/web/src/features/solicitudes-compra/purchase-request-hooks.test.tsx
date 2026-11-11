import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useApprovePurchaseRequest,
  useDeletePurchaseRequestQuotation,
  usePurchaseRequest,
  usePurchaseRequests,
  useSendPurchaseRequest,
  useUploadInvoiceIntake,
  useUploadPurchaseRequestOrder,
  useUploadPurchaseRequestQuotation,
} from '@sgia/api-client';

const rawRequest = {
  id: 9,
  code: 'SC-2026-0009',
  status: 'cotizada',
  annual_budget_id: 4,
  created_by: 2,
  creator: { id: 2, name: 'Directora' },
  selected_quotation_id: null,
  notes: null,
  items: [
    { id: 31, product_id: 5, product: { id: 5, name: 'Switch 24p' }, quantity: '2' },
    { id: 32, product_id: 6, product_name: 'Cable UTP', quantity: 10 },
  ],
  areas: [{ area: 'informatica' }, 'telecomunicaciones', 'otra'],
  suppliers: [
    {
      id: 1,
      supplier_id: 3,
      supplier: { id: 3, name: 'Proveedor A', email: 'a@test.cl', areas: ['informatica'] },
      email_sent_at: '2026-11-10T10:00:00Z',
      email_error: null,
    },
    { id: 2, supplier_id: 4, email_sent_at: null, email_error: 'SMTP caído' },
  ],
  quotations: [
    {
      id: 70,
      supplier_id: 3,
      total: '150000.00',
      file_path: 'quotations/70.pdf',
      items: [{ purchase_request_item_id: 31, unit_price: '60000' }],
    },
  ],
  purchase: {
    id: 12,
    code: 'OC-2026-000012',
    order_number: '4500123',
    total_amount: '150000',
    reserved_amount: '150000.00',
    order_file_path: 'orders/12.pdf',
  },
  invoice_intakes: [{ id: 8, document_number: 'F-1', status: 'borrador', total_deducted: '0' }],
  created_at: '2026-11-10T09:00:00Z',
  updated_at: '2026-11-10T09:00:00Z',
};

function ok(body: unknown, status = 200) {
  return { ok: true, status, json: async () => body } as Response;
}

describe('Hooks de solicitudes de compra (nuevo flujo)', () => {
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

  it('usePurchaseRequests envía filtros y normaliza montos, áreas, OC y facturas', async () => {
    const mockFetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(ok({ data: [rawRequest], meta: { current_page: 1, last_page: 1, total: 1 } }));

    const { result } = renderHook(
      () => usePurchaseRequests({ status: 'cotizada', code: 'SC-2026-0009', from: '2026-11-01' }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const url = String(mockFetch.mock.calls[0]?.[0]);
    expect(url).toContain('/purchase-requests?');
    expect(url).toContain('status=cotizada');
    expect(url).toContain('code=SC-2026-0009');
    expect(url).toContain('from=2026-11-01');

    const r = result.current.data?.data[0];
    expect(r?.code).toBe('SC-2026-0009');
    expect(r?.creator_name).toBe('Directora');
    expect(r?.items.map((i) => [i.product_name, i.quantity])).toEqual([
      ['Switch 24p', 2],
      ['Cable UTP', 10],
    ]);
    expect(r?.areas).toEqual(['informatica', 'telecomunicaciones']);
    expect(r?.suppliers[0]?.supplier?.areas).toEqual(['informatica']);
    expect(r?.suppliers[1]?.email_error).toBe('SMTP caído');
    // Sin `email_status` se deriva de las fechas/errores.
    expect(r?.suppliers.map((s) => s.email_status)).toEqual(['enviado', 'fallido']);
    expect(r?.quotations[0]?.total).toBe(150000);
    expect(r?.quotations[0]?.has_file).toBe(true);
    expect(r?.quotations[0]?.items[0]?.unit_price).toBe(60000);
    expect(r?.quotations_count).toBe(1);
    expect(r?.order?.reserved_amount).toBe(150000);
    expect(r?.order?.has_order_file).toBe(true);
    expect(r?.invoices[0]?.document_number).toBe('F-1');
    // Sin `can_*` en la respuesta se derivan del estado.
    expect(r?.actions.can_select_quotation).toBe(true);
    expect(r?.actions.can_approve).toBe(false);
    expect(r?.min_quotations).toBe(3);
  });

  it('normaliza la forma real del backend: order = PurchaseResource y envoltura purchase_request', async () => {
    const backendShape = {
      ...rawRequest,
      purchase: undefined,
      invoice_intakes: undefined,
      can_select_quotation: false,
      can_issue_order: true,
      min_quotations: 3,
      quotations: [
        { id: 70, supplier_id: 3, total: 150000, original_name: 'c.pdf', file_url: 'http://x/api/purchase-requests/9/quotations/70/file' },
      ],
      order: {
        id: 12,
        code: 'OC-2026-000012',
        order_number: '4500123',
        total: 150000,
        reserved_amount: '150000.00',
        has_order_file: true,
        invoices: [{ id: 8, document_number: 'F-1', status: 'confirmado', total_deducted: '149000.00' }],
      },
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      ok({ message: 'Solicitud enviada', emails_sent: 1, emails_failed: 1, purchase_request: backendShape }),
    );
    const { result } = renderHook(() => useSendPurchaseRequest(), { wrapper });

    const res = await result.current.mutateAsync({ id: 9, payload: { areas: ['informatica'] } });

    expect(res.code).toBe('SC-2026-0009');
    expect(res.actions.can_select_quotation).toBe(false);
    expect(res.actions.can_issue_order).toBe(true);
    expect(res.quotations[0]?.has_file).toBe(true);
    expect(res.quotations[0]?.original_name).toBe('c.pdf');
    expect(res.order?.total_amount).toBe(150000);
    expect(res.order?.order_number).toBe('4500123');
    expect(res.invoices[0]?.total_deducted).toBe(149000);
  });

  it('usePurchaseRequest no consulta sin id', () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch');
    renderHook(() => usePurchaseRequest(undefined), { wrapper });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('useApprovePurchaseRequest hace POST a /approve y cachea el detalle', async () => {
    const mockFetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(ok({ data: { ...rawRequest, status: 'aprobada' } }));
    const { result } = renderHook(() => useApprovePurchaseRequest(), { wrapper });

    const res = await result.current.mutateAsync(9);

    expect(String(mockFetch.mock.calls[0]?.[0])).toContain('/purchase-requests/9/approve');
    expect(mockFetch.mock.calls[0]?.[1]?.method).toBe('POST');
    expect(res.status).toBe('aprobada');
    expect(queryClient.getQueryData(['purchase-requests', 'detail', 9])).toEqual(res);
  });

  it('useSendPurchaseRequest envía las áreas elegidas', async () => {
    const mockFetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(ok({ data: { ...rawRequest, status: 'enviada' } }));
    const { result } = renderHook(() => useSendPurchaseRequest(), { wrapper });

    await result.current.mutateAsync({ id: 9, payload: { areas: ['informatica', 'diseno'] } });

    const call = mockFetch.mock.calls[0];
    expect(String(call?.[0])).toContain('/purchase-requests/9/send');
    expect(JSON.parse(String(call?.[1]?.body))).toEqual({ areas: ['informatica', 'diseno'] });
  });

  it('useUploadPurchaseRequestQuotation arma el multipart con ítems indexados', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(ok({ data: rawRequest }));
    const { result } = renderHook(() => useUploadPurchaseRequestQuotation(), { wrapper });
    const file = new File(['%PDF'], 'cotizacion.pdf', { type: 'application/pdf' });

    await result.current.mutateAsync({
      id: 9,
      payload: {
        supplier_id: 3,
        file,
        total: 150000,
        items: [
          { purchase_request_item_id: 31, unit_price: 60000 },
          { purchase_request_item_id: 32, unit_price: 3000 },
        ],
      },
    });

    const call = mockFetch.mock.calls[0];
    expect(String(call?.[0])).toContain('/purchase-requests/9/quotations');
    const body = call?.[1]?.body as FormData;
    expect(body.get('supplier_id')).toBe('3');
    expect(body.get('total')).toBe('150000');
    expect((body.get('file') as File).name).toBe('cotizacion.pdf');
    expect(body.get('items[1][purchase_request_item_id]')).toBe('32');
    expect(body.get('items[1][unit_price]')).toBe('3000');
  });

  it('useDeletePurchaseRequestQuotation acepta 204 e invalida solicitudes', async () => {
    const mockFetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true, status: 204, json: async () => null } as Response);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDeletePurchaseRequestQuotation(), { wrapper });

    await result.current.mutateAsync({ id: 9, quotationId: 70 });

    expect(String(mockFetch.mock.calls[0]?.[0])).toContain('/purchase-requests/9/quotations/70');
    expect(mockFetch.mock.calls[0]?.[1]?.method).toBe('DELETE');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['purchase-requests'] });
  });

  it('useUploadPurchaseRequestOrder sube la OC e invalida presupuestos y compras', async () => {
    const mockFetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(ok({ data: { ...rawRequest, status: 'con_oc' } }));
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUploadPurchaseRequestOrder(), { wrapper });
    const file = new File(['%PDF'], 'oc.pdf', { type: 'application/pdf' });

    const res = await result.current.mutateAsync({
      id: 9,
      payload: { file, order_number: ' 4500123 ' },
    });

    const body = mockFetch.mock.calls[0]?.[1]?.body as FormData;
    expect(String(mockFetch.mock.calls[0]?.[0])).toContain('/purchase-requests/9/order');
    expect(body.get('order_number')).toBe('4500123');
    expect(res.status).toBe('con_oc');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['budgets'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['purchases'] });
  });

  it('useUploadInvoiceIntake manda purchase_request_code en mayúsculas', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      ok({
        data: {
          id: 8,
          annual_budget_id: 4,
          status: 'borrador',
          raw_ocr_payload: { items: [], ocr_available: true },
          items: [],
        },
      }),
    );
    const { result } = renderHook(() => useUploadInvoiceIntake(), { wrapper });
    const file = new File(['%PDF'], 'factura.pdf', { type: 'application/pdf' });

    await result.current.mutateAsync({ file, purchase_request_code: ' sc-2026-0009 ' });

    const body = mockFetch.mock.calls[0]?.[1]?.body as FormData;
    expect(body.get('purchase_request_code')).toBe('SC-2026-0009');
  });
});
