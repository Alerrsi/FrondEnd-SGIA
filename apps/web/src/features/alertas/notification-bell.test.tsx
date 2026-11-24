import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureApiClient } from '@sgia/api-client';
import type { CriticalStockAlert } from '@sgia/types';

import { NotificationBell } from './components/notification-bell';
import { useNewAlertSound } from './hooks/use-new-alert-sound';

const sound = vi.hoisted(() => ({ play: vi.fn() }));
vi.mock('@/lib/notification-sound', () => ({ playNotificationSound: sound.play }));

const alert = (id: number, name: string, type: 'critical' | 'warning'): CriticalStockAlert =>
  ({ id, product_id: id, product_name: name, alert_type: type, current_stock: 1, stock_minimo: 5, message: '', is_resolved: false, created_at: '2026-11-23T10:00:00Z' }) as CriticalStockAlert;

describe('Campana: quitar notificaciones (docs/exportaciones-y-campana.md)', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    configureApiClient({
      baseUrl: '/api',
      onUnauthorized: vi.fn(),
      tokenStorage: { getToken: () => 'token', setToken: () => undefined, clearToken: () => undefined },
    });
    let dismissed = false;
    fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        dismissed = true;
        return new Response(null, { status: 204 });
      }
      const data = dismissed ? [alert(8, 'Cinta aislante', 'warning')] : [alert(9, 'Fusibles 5A', 'critical'), alert(8, 'Cinta aislante', 'warning')];
      return new Response(
        JSON.stringify({ data, meta: { total: data.length }, counts: { active: data.length, critical: dismissed ? 0 : 1, warning: 1, resolved: 0 } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('pide solo las no ocultadas; el ítem se pinta en rojo con basurero y al hacer clic se quita sin cerrar el menú', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <NotificationBell />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('notification-badge').textContent).toBe('2'));
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('exclude_dismissed=1');
    expect(sound.play).not.toHaveBeenCalled(); // la primera carga no suena

    await user.click(screen.getByRole('button', { name: /Centro de notificaciones/ }));
    const item = await screen.findByRole('menuitem', { name: /Quitar notificación: Fusibles 5A/ });
    expect(item.className).toContain('hover:bg-danger-bg!');
    expect(item.className).toContain('duration-300');
    expect(item.className).toContain('motion-reduce:transition-none');
    expect(within(item).getByTestId('notification-trash').getAttribute('class')).toContain('group-hover:opacity-100');

    await user.click(item);

    const post = fetchMock.mock.calls.find(([, init]) => (init as RequestInit | undefined)?.method === 'POST');
    expect(String(post?.[0])).toBe('/api/alerts/9/dismiss');
    await waitFor(() => expect(screen.queryByRole('menuitem', { name: /Fusibles 5A/ })).toBeNull());
    expect(screen.getByRole('menuitem', { name: /Cinta aislante/ })).toBeDefined(); // el menú sigue abierto
    await waitFor(() => expect(screen.getByTestId('notification-badge').textContent).toBe('1'));
    expect(sound.play).not.toHaveBeenCalled(); // quitar no suena
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
