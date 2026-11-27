import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReportSubscription } from '@sgia/types';

import ReportesPage from './pages/reportes-page';

let mockRole = 'DIR-01';

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({ user: { id: 1, nombre: 'Usuaria', rol: mockRole } }),
}));
vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const SUBSCRIPTION: ReportSubscription = {
  id: 7,
  report_id: 'prestamos',
  title: 'Historial de préstamos',
  path: '/loans/export?format=excel',
  params: {},
  filters: {},
  frequency: 'monthly',
  is_active: false,
  paused_reason: 'Tu rol ya no puede ver este reporte.',
  next_send_at: null,
  last_sent_at: '2026-11-01T07:00:12-03:00',
  last_status: 'sent',
  created_at: '2026-10-26T21:40:00-03:00',
};

let list: ReportSubscription[];
let mailEnabled: boolean;
let createStatus: number;
let calls: Array<{ method: string; path: string; body: unknown }>;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function renderPage(entry = '/reportes?reporte=prestamos') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[entry]}>
        <ReportesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const writes = () => calls.filter((c) => c.method !== 'GET');

describe('Suscripción de reportes (BackEnd-SGIA/docs/suscripcion-reportes.md)', () => {
  beforeEach(() => {
    mockRole = 'DIR-01';
    list = [];
    mailEnabled = true;
    createStatus = 201;
    calls = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input), 'http://x');
      const method = init?.method ?? 'GET';
      calls.push({ method, path: url.pathname, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      if (url.pathname.includes('/me/report-subscriptions')) {
        if (method === 'GET') return json({ data: list, meta: { mail_enabled: mailEnabled, limit: 20 } });
        if (method === 'DELETE') return new Response(null, { status: 204 });
        if (url.pathname.endsWith('/send')) return json({ message: 'ok' }, 202);
        if (createStatus === 422) {
          return json({ message: 'Ya tienes una suscripción a este reporte.', errors: { report_id: ['Ya tienes una suscripción a este reporte.'] } }, 422);
        }
        return json({ data: SUBSCRIPTION }, createStatus);
      }
      if (url.searchParams.get('preview') === '1') return json({ title: 'R', sheets: [], info: [] });
      return json({ data: [] });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('guarda la frecuencia y los filtros elegidos, sin el período ni el formato', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.selectOptions(screen.getByLabelText('Estado'), 'activo');
    await user.click(screen.getByRole('button', { name: 'Recibir por correo' }));

    const dialog = screen.getByRole('dialog', { name: 'Recibir por correo' });
    expect(within(dialog).getByText('Estado: En préstamo')).toBeDefined();
    expect(within(dialog).getByText(/El período se calcula en cada envío/)).toBeDefined();
    expect(within(dialog).queryByText(/solo el resumen/)).toBeNull();
    await user.click(within(dialog).getByRole('radio', { name: /Semanal/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Suscribirme' }));

    await waitFor(() => expect(writes()).toHaveLength(1));
    expect(writes()[0]!.body).toEqual({
      report_id: 'prestamos',
      title: 'Historial de préstamos',
      path: '/loans/export?format=excel',
      params: { status: 'procesado', devuelto: '0' },
      frequency: 'weekly',
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('avisa de datos personales y de correo sin configurar, y muestra el error del servidor', async () => {
    const user = userEvent.setup();
    mockRole = 'AD-01';
    mailEnabled = false;
    createStatus = 422;
    renderPage('/reportes?reporte=usuarios');
    await waitFor(() => expect(calls.some((c) => c.path.endsWith('/me/report-subscriptions'))).toBe(true));
    await user.click(screen.getByRole('button', { name: 'Recibir por correo' }));

    const dialog = screen.getByRole('dialog', { name: 'Recibir por correo' });
    expect(within(dialog).getByText(/Llega solo el resumen y un enlace/)).toBeDefined();
    expect(within(dialog).getByText(/no está configurado/)).toBeDefined();
    expect(within(dialog).getByText('El día 1 de cada mes, el estado de ese momento.')).toBeDefined();
    await user.click(within(dialog).getByRole('button', { name: 'Suscribirme' }));
    expect((await within(dialog).findByRole('alert')).textContent).toContain('Ya tienes una suscripción');
  });

  it('con una suscripción igual abre «Mis suscripciones»: motivo de pausa, reanudar, enviar y quitar', async () => {
    const user = userEvent.setup();
    list = [SUBSCRIPTION];
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Suscrito · mensual' }));

    const sheet = screen.getByRole('dialog', { name: 'Mis suscripciones' });
    expect(await within(sheet).findByText('Tu rol ya no puede ver este reporte.')).toBeDefined();
    expect(within(sheet).getByText('Sin próximo envío')).toBeDefined();

    await user.click(within(sheet).getByRole('button', { name: 'Reanudar Historial de préstamos' }));
    await user.click(within(sheet).getByRole('button', { name: 'Enviar ahora Historial de préstamos' }));
    await user.click(within(sheet).getByRole('button', { name: 'Quitar Historial de préstamos' }));
    await user.click(screen.getByRole('button', { name: 'Quitar suscripción' }));

    await waitFor(() => expect(writes()).toHaveLength(3));
    expect(writes().map((c) => `${c.method} ${c.path.replace(/^.*\/me/, '/me')}`)).toEqual([
      'PATCH /me/report-subscriptions/7',
      'POST /me/report-subscriptions/7/send',
      'DELETE /me/report-subscriptions/7',
    ]);
    expect(writes()[0]!.body).toEqual({ is_active: true });
  });
});
