import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { canAccessRoute, getRoleDefaultPath } from '@/features/auth/types/roles';
import InicioPage from './pages/inicio-page';
import { getInicioModules } from './lib/inicio-content';

let mockRole = 'PAN-01';

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({
    user: { id: 1, nombre: 'Camila Rojas', email: 'c@inacap.cl', rol: mockRole, activo: true },
    isAuthenticated: true,
  }),
}));

const page = (total: number) => ({ data: { data: [], meta: { total } }, isLoading: false, isError: false });
const mockUseLoans = vi.fn((params: unknown) => {
  void params;
  return page(3);
});

vi.mock('@sgia/api-client', () => ({
  usePendingLoans: () => ({
    data: {
      data: [{ id: 41, items: [{ id: 1 }, { id: 2 }], user: { nombre: 'Pedro Soto' } }],
      meta: { total: 4 },
    },
    isLoading: false,
    isError: false,
  }),
  useApiClientExecutiveKpis: () => ({
    data: {
      activosDisponibles: 120,
      activosEnPrestamo: 18,
      activosEnTaller: 2,
      activosDeBaja: 1,
      prestamosActivosHoy: 7,
      tasaAtrasosPct: 12.5,
      alertasCriticasNoResueltas: 3,
      tasaRotacionMensualPct: 4,
    },
    isLoading: false,
    isError: false,
  }),
  useLoans: (params: unknown) => mockUseLoans(params),
  useCriticalStockAlerts: () => page(0),
  usePurchaseRequests: ({ status }: { status: string }) => page(status === 'borrador' ? 2 : 0),
  useAuditLogs: () => ({
    data: {
      data: [{ id: 1, action: 'user.created', auditable_type: 'user', auditable_id: 5, user: { id: 1, nombre: 'Admin' }, created_at: '2026-11-16T10:00:00Z' }],
      meta: { total: 1 },
    },
    isLoading: false,
    isError: false,
  }),
  useLoginActivity: () => ({
    data: { totals: { successful: 9, failed: 3, throttled: 1 }, flagged_accounts: [{ email: 'x@sgia.cl', failed: 6 }] },
    isLoading: false,
  }),
  useSystemHealth: () => ({
    data: { status: 'degraded', checks: { database: { ok: true }, storage: { ok: true }, queue: { ok: false } } },
    isLoading: false,
  }),
  useMyLoanRequests: () => ({
    data: [
      { id: 1, estado: 'pendiente' },
      { id: 2, estado: 'pendiente' },
      { id: 3, estado: 'preparado' },
      { id: 4, estado: 'devuelto' },
    ],
    isLoading: false,
  }),
}));

function renderInicio() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <InicioPage />
    </MemoryRouter>,
  );
}

const todayLinks = () =>
  within(screen.getByRole('region', { name: 'Lo que te toca hoy' }))
    .getAllByRole('link')
    .map((a) => [a.getAttribute('aria-label'), a.getAttribute('href')]);

describe('Inicio (/)', () => {
  it('es la página de llegada de los cuatro roles web', () => {
    for (const role of ['AD-01', 'DIR-01', 'PAN-01', 'PRO-01'] as const) {
      expect(canAccessRoute(role, '/')).toBe(true);
      expect(getRoleDefaultPath(role)).toBe('/');
    }
  });

  it('saluda al pañolero y le muestra sus pendientes reales', () => {
    mockRole = 'PAN-01';
    renderInicio();

    expect(screen.getByRole('heading', { name: 'Hola, Camila' })).toBeTruthy();
    expect(todayLinks()).toEqual([
      ['Cola de solicitudes: 4 por despachar', '/prestamos/cola'],
      ['Préstamos atrasados: 3 sin devolver', '/prestamos/historial'],
      ['Stock crítico: al día', '/alertas'],
    ]);
    // El conteo de atrasados usa el filtro de la API, no el listado completo.
    expect(mockUseLoans).toHaveBeenCalledWith({ atrasado: true, per_page: 1 });
  });

  it('muestra al director el flujo de compras en curso', () => {
    mockRole = 'DIR-01';
    renderInicio();

    const links = todayLinks();
    expect(links[0]).toEqual(['Paso 1, Solicitud: 2 por aprobar', '/compras/solicitudes?status=borrador']);
    expect(links).toContainEqual(['Stock crítico: al día', '/alertas']);
  });

  it('muestra al administrador la seguridad del sistema y la actividad reciente de la auditoría', () => {
    mockRole = 'AD-01';
    renderInicio();

    expect(todayLinks()).toEqual(
      expect.arrayContaining([
        ['Estado del sistema: 1 con fallas', '/monitoreo'],
        ['Accesos rechazados: 4 en 24 h', '/monitoreo'],
      ]),
    );

    const items = screen.getAllByRole('listitem').map((li) => li.textContent ?? '');
    expect(items.some((text) => text.includes(' · Admin'))).toBe(true);
    expect(screen.getByRole('link', { name: /Ver la auditoría/ }).getAttribute('href')).toBe('/auditoria');
  });

  it('cada rol tiene su acción principal en la bienvenida', () => {
    const expected: Record<string, [string, string]> = {
      'PAN-01': ['Abrir mostrador', '/prestamos/mostrador'],
      'DIR-01': ['Nueva solicitud de compra', '/compras/solicitudes'],
      'AD-01': ['Crear usuario', '/usuarios'],
      'PRO-01': ['Solicitar equipo', '/profesor/catalogo'],
    };
    for (const [role, [label, href]] of Object.entries(expected)) {
      mockRole = role;
      const { unmount } = renderInicio();
      const hero = screen.getByRole('region', { name: 'Bienvenida' });
      expect(within(hero).getByRole('link', { name: new RegExp(label) }).getAttribute('href')).toBe(href);
      unmount();
    }
  });

  it('el director ve las cifras del pañol por GraphQL y el pañolero la cola y el escaneo', () => {
    mockRole = 'DIR-01';
    const { unmount } = renderInicio();
    const kpis = screen.getByLabelText('Cifras de los últimos 30 días');
    expect(within(kpis).getByText('12,5 %')).toBeDefined();
    expect(within(kpis).getByText('3').className).toContain('text-danger');
    unmount();

    mockRole = 'PAN-01';
    renderInicio();
    expect(within(screen.getByRole('region', { name: 'Próximas solicitudes' })).getByText('2 ítems')).toBeDefined();
    expect(screen.getByLabelText('Buscar un producto por código')).toBeDefined();
  });

  it('cuenta las solicitudes del profesor por estado', () => {
    mockRole = 'PRO-01';
    renderInicio();

    expect(todayLinks()).toEqual([
      ['En revisión: 2 esperando al pañol', '/profesor/solicitudes'],
      ['Listas para retirar: 1 por retirar', '/profesor/solicitudes'],
      ['Atrasadas: al día', '/profesor/solicitudes'],
    ]);
    expect(getInicioModules('PRO-01').map((m) => m.to)).toEqual([
      '/profesor/catalogo',
      '/profesor/solicitudes',
      '/profesor/novedades',
    ]);
  });

  it('los accesos solo incluyen rutas permitidas para cada rol', () => {
    for (const role of ['AD-01', 'DIR-01', 'PAN-01', 'PRO-01'] as const) {
      const modules = getInicioModules(role);
      expect(modules.length).toBeGreaterThan(0);
      for (const m of modules) expect(canAccessRoute(role, m.to)).toBe(true);
    }
  });
});
