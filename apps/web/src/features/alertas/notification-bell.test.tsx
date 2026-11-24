import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureApiClient } from '@sgia/api-client';
import type { CriticalStockAlert } from '@sgia/types';

import { NotificationBell } from './components/notification-bell';
import { useNewAlertSound } from './hooks/use-new-alert-sound';

const sound = vi.hoisted(() => ({ play: vi.fn() }));
vi.mock('@/lib/notification-sound', () => ({ playNotificationSound: sound.play }));

const alert = (id: number, name: string, type: 'critical' | 'warning'): CriticalStockAlert =>
  ({ id, product_id: id, product_name: name, alert_type: type, current_stock: 1, stock_minimo: 5, message: '', is_resolved: false, created_at: '2026-11-23T10:00:00Z' }) as CriticalStockAlert;

describe('Campana como antes, con sonido de alerta nueva (docs/avisos-emergentes.md)', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let alerts: CriticalStockAlert[];

  beforeEach(() => {
    configureApiClient({
      baseUrl: '/api',
      onUnauthorized: vi.fn(),
      tokenStorage: { getToken: () => 'token', setToken: () => undefined, clearToken: () => undefined },
    });
    alerts = [alert(8, 'Cinta aislante', 'warning')];
    fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({ data: alerts, meta: { total: alerts.length }, counts: { active: alerts.length, critical: 0, warning: alerts.length, resolved: 0 } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('sin hover rojo ni basurero; el clic lleva a la bandeja y una alerta nueva suena', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<NotificationBell />} />
            <Route path="/alertas" element={<p>Bandeja de alertas</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('notification-badge').textContent).toBe('1'));
    expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain('exclude_dismissed');
    expect(sound.play).not.toHaveBeenCalled(); // la primera carga no suena

    // Llega una alerta nueva en la siguiente consulta.
    alerts = [alert(9, 'Fusibles 5A', 'critical'), ...alerts];
    await queryClient.invalidateQueries();
    await waitFor(() => expect(screen.getByTestId('notification-badge').textContent).toBe('2'));
    expect(sound.play).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('button', { name: /Centro de notificaciones/ }));
    const item = await screen.findByRole('menuitem', { name: /Fusibles 5A/ });
    expect(item.className).not.toContain('danger-bg');
    expect(screen.queryByTestId('notification-trash')).toBeNull();

    await user.click(item);
    expect(await screen.findByText('Bandeja de alertas')).toBeDefined();
    expect(fetchMock.mock.calls.some(([, init]) => (init as RequestInit | undefined)?.method === 'POST')).toBe(false);
  });
});

describe('useNewAlertSound', () => {
  it('suena solo cuando aparece una alerta más nueva que las vistas', () => {
    const play = vi.fn();
    const { rerender } = renderHook(({ ids }: { ids: number[] | undefined }) => useNewAlertSound(ids, play), {
      initialProps: { ids: undefined as number[] | undefined },
    });
    rerender({ ids: [5, 3] }); // primera carga
    rerender({ ids: [5, 3] });
    rerender({ ids: [3] }); // se quitó la 5
    rerender({ ids: [3, 2] }); // asoma una más antigua
    expect(play).not.toHaveBeenCalled();
    rerender({ ids: [7, 3] }); // llegó una nueva
    expect(play).toHaveBeenCalledOnce();
    rerender({ ids: [7, 3] });
    expect(play).toHaveBeenCalledOnce();
  });
});
