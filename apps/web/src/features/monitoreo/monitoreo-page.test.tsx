import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { fetchLoginActivity, revokeSession } from '@sgia/api-client';

import MonitoreoPage from './pages/monitoreo-page';
import { timeAgo } from './lib/monitoring-format';

vi.mock('@/contexts/theme-context', () => ({ useTheme: () => ({ theme: 'light', resolvedTheme: 'light' }) }));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockRevoke = vi.fn();
let loading = false;

vi.mock('@sgia/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sgia/api-client')>();
  const done = <T,>(data: T) => ({ data: loading ? undefined : data, isLoading: loading, isError: false, error: null });
  return {
    ...actual,
    useSystemHealth: () =>
      done({
        status: 'degraded',
        checked_at: new Date().toISOString(),
        checks: {
          database: { ok: true, latency_ms: 1.4 },
          storage: { ok: true, disk: 'local' },
          queue: { ok: false, connection: 'database', pending: 2, failed: 3 },
        },
      }),
    useLoginActivity: () =>
      done({
        window_hours: 24,
        from: '2026-11-18T00:00:00Z',
        to: '2026-11-18T23:00:00Z',
        totals: { successful: 12, failed: 7, throttled: 2 },
        by_hour: [{ hour: '2026-11-18T10:00:00Z', successful: 12, failed: 7 }],
        top_ips: [{ ip_address: '200.1.1.1', failed: 6, last_attempt_at: '2026-11-18T10:30:00Z' }],
        flagged_accounts: [{ email: 'victima@sgia.cl', failed: 6, last_attempt_at: '2026-11-18T10:30:00Z' }],
      }),
    useFailedLogins: () =>
      done({
        data: [{ id: 1, email: 'victima@sgia.cl', user_id: 3, reason: 'throttled', ip_address: '200.1.1.1', user_agent: null, attempted_at: '2026-11-18T10:30:00Z' }],
        meta: { currentPage: 1, lastPage: 1, perPage: 10, total: 1 },
      }),
    useAuditLogs: () =>
      done({
        data: [{ id: 9, action: 'user.session_revoked', auditable_type: 'user', auditable_id: 3, user: { id: 1, nombre: 'Admin' }, created_at: '2026-11-18T10:40:00Z' }],
        meta: { currentPage: 1, lastPage: 1, perPage: 10, total: 1 },
      }),
    useActiveSessions: () =>
      done({
        data: [
          { id: 10, device_name: 'web', user: { id: 1, name: 'Admin', email: 'admin@sgia.cl', role: 'AD-01' }, is_current: true, last_used_at: null, expires_at: null, created_at: '2026-11-18T09:00:00Z' },
          { id: 11, device_name: 'mobile', user: { id: 3, name: 'Ana Docente', email: 'docente@sgia.cl', role: 'PRO-01' }, is_current: false, last_used_at: null, expires_at: null, created_at: '2026-11-18T09:00:00Z' },
        ],
        meta: { currentPage: 1, lastPage: 1, perPage: 50, total: 2 },
      }),
    useRevokeSession: () => ({ mutateAsync: mockRevoke, isPending: false }),
  };
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <MonitoreoPage />
    </MemoryRouter>,
  );

describe('Monitoreo (AD-01)', () => {
  beforeEach(() => {
    loading = false;
    mockRevoke.mockReset();
  });

  it('muestra el estado de los servicios, los intentos y las cuentas marcadas', () => {
    renderPage();

    expect(screen.getByText('Responde en 1.4 ms')).toBeDefined();
    expect(screen.getByText('2 pendientes · 3 fallidos')).toBeDefined();
    expect(screen.getAllByText('Con fallas')).toHaveLength(1);
    expect(screen.getByText(/bloqueados por exceso de intentos/).textContent).toContain('2');
    expect(screen.getByRole('img', { name: /Inicios de sesión por hora/ })).toBeDefined();
    expect(screen.getAllByText('victima@sgia.cl').length).toBeGreaterThan(0);
    expect(screen.getByText('Bloqueado por exceso de intentos')).toBeDefined();
    expect(screen.getByText('Sesión cerrada por administración')).toBeDefined();
  });

  it('cierra la sesión de otro usuario tras confirmar y no ofrece cerrar la propia', async () => {
    mockRevoke.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderPage();

    const rows = screen.getAllByRole('row');
    const own = rows.find((r) => r.textContent?.includes('admin@sgia.cl'))!;
    expect(within(own).getByText('Esta sesión')).toBeDefined();
    expect(within(own).queryByRole('button')).toBeNull();

    const other = rows.find((r) => r.textContent?.includes('docente@sgia.cl'))!;
    await user.click(within(other).getByRole('button', { name: 'Cerrar sesión' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog.textContent).toContain('App móvil');
    await user.click(within(dialog).getByRole('button', { name: 'Cerrar sesión' }));

    await waitFor(() => expect(mockRevoke).toHaveBeenCalledWith(11));
  });

  it('mientras el servidor responde muestra esquemas de carga anunciados', () => {
    loading = true;
    renderPage();

    const statuses = screen.getAllByRole('status').map((s) => s.textContent);
    expect(statuses).toEqual(
      expect.arrayContaining(['Revisando servicios…', 'Cargando intentos de conexión…', 'Cargando sesiones…']),
    );
  });
});

describe('cliente de monitoreo', () => {
  it('pide la ventana de horas y cierra sesiones por id', async () => {
    const mockFetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data: { window_hours: 168 } }) } as Response)
      .mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) } as Response);

    expect((await fetchLoginActivity(168)).window_hours).toBe(168);
    await revokeSession(11);

    expect(String(mockFetch.mock.calls[0]?.[0])).toContain('/monitoring/logins?hours=168');
    expect(String(mockFetch.mock.calls[1]?.[0])).toContain('/monitoring/sessions/11');
    expect(mockFetch.mock.calls[1]?.[1]?.method).toBe('DELETE');
    mockFetch.mockRestore();
  });

  it('timeAgo usa tiempo relativo y fecha corta pasado un día', () => {
    const now = new Date('2026-11-18T12:00:00Z').getTime();
    expect(timeAgo(null, now)).toBe('Nunca');
    expect(timeAgo('2026-11-18T11:55:00Z', now)).toBe('hace 5 minutos');
    expect(timeAgo('2026-11-18T09:00:00Z', now)).toBe('hace 3 horas');
    expect(timeAgo('2026-11-15T09:00:00Z', now)).not.toMatch(/hace/);
  });
});
