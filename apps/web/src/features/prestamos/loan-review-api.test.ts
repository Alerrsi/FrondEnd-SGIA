import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  approveLoan,
  useAprobarPrestamo,
  checkinLoan,
  deliverLoan,
  fetchLoanReview,
  normalizePrestamo,
  rejectLoan,
} from '@sgia/api-client';

const jsonResponse = (body: unknown, status = 200) =>
  ({ ok: status < 400, status, json: async () => body }) as Response;

const apiLoan = {
  id: 7,
  code: 'REM-2026-000007',
  status: 'en_proceso',
  items: [
    {
      id: 81,
      loan_id: 7,
      product_id: 45,
      name: 'Router Cisco 1941',
      quantity: 2,
      available_stock: 3,
      delivered_quantity: 0,
      returned_quantity: 0,
      cajon: { id: 7, codigo: 'C-02', descripcion: 'Routers' },
      location: { id: 12, nombre: 'Laboratorio de Redes', tipo: 'sala', sala: null, cajon: null },
      units: [
        {
          id: 301,
          code: 'EQP-IC-000014',
          status: 'prestado',
          cajon: { id: 7, codigo: 'C-02' },
          location: { id: 12, nombre: 'Laboratorio de Redes' },
        },
      ],
    },
  ],
};

function sentBody(spy: ReturnType<typeof vi.spyOn>): unknown {
  const init = spy.mock.calls[0]?.[1] as RequestInit;
  return JSON.parse(String(init.body));
}

describe('Revisión de solicitudes (cliente API)', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('pide la revisión y entrega el contenido de `data`', async () => {
    const review = { loan_id: 7, code: 'REM', status: 'pendiente', can_approve: true, items: [] };
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ data: review }));

    await expect(fetchLoanReview(7)).resolves.toEqual(review);
    expect(String(spy.mock.calls[0]?.[0])).toMatch(/\/loans\/7\/review$/);
  });

  it('approve envía `items` y lee el préstamo de la clave `loan`', async () => {
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ message: 'ok', allowed_transitions: [], loan: apiLoan }));

    const loan = await approveLoan(7, { items: [{ item_id: 81, unit_ids: [301, 305] }] });

    expect(sentBody(spy)).toEqual({ items: [{ item_id: 81, unit_ids: [301, 305] }] });
    expect(loan.id).toBe(7);
    expect(loan.estado).toBe('en_proceso');
    expect(loan.items[0]?.units?.[0]?.location?.nombre).toBe('Laboratorio de Redes');
  });

  it('approve sin unidades no envía `items`', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ loan: apiLoan }));

    await approveLoan(7);
    expect(sentBody(spy)).toEqual({});

    spy.mockClear();
    await approveLoan(7, { items: [] });
    expect(sentBody(spy)).toEqual({});
  });

  it('reject y deliver leen la clave `loan`; checkin, la clave `data`', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ loan: apiLoan }));
    expect((await rejectLoan(7, { rejection_reason: 'Sin stock' })).id).toBe(7);
    expect((await deliverLoan(7)).id).toBe(7);

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ data: apiLoan }));
    const checkedIn = await checkinLoan({ loan_id: 7, items: [] });
    expect(checkedIn.id).toBe(7);
  });

  it('normaliza el ítem con su id, unidades y ubicación en texto', () => {
    const item = normalizePrestamo(apiLoan).items[0]!;

    expect(item.id).toBe(81);
    expect(item.units).toHaveLength(1);
    expect(item.sala).toBe('Laboratorio de Redes');
    expect(item.cajon).toBe('C-02');
    expect(item.stockActual).toBe(3);
  });

  it('al aprobar invalida la cola, pero no vuelve a pedir la revisión', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ loan: apiLoan }));
    const client = new QueryClient();
    const reviewKey = ['loans', 'review', 7];
    const pendingKey = ['loans', 'pending', undefined];
    client.setQueryData(reviewKey, { loan_id: 7 });
    client.setQueryData(pendingKey, { data: [] });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children);

    const { result } = renderHook(() => useAprobarPrestamo(), { wrapper });
    await result.current.mutateAsync({ id: 7 });

    expect(client.getQueryState(pendingKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(reviewKey)?.isInvalidated).toBe(false);
  });
});
