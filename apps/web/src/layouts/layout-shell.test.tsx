import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { LayoutPreferenceProvider } from '@/contexts/layout-context';
import AppLayout from './app-layout';
import { findScreen, navForRole, quickActionsForRole, screensForRole } from './nav-config';

let mockUserRole = 'DIR-01';

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({
    user: { id: 1, nombre: 'Diana Muñoz', email: 'd@inacap.cl', rol: mockUserRole, activo: true },
    logout: vi.fn(),
    isAuthenticated: true,
  }),
}));

vi.mock('@sgia/api-client', () => ({
  useChangePassword: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useTokens: () => ({ data: [], isLoading: false, isError: false }),
  useRevokeOtherTokens: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCriticalStockAlerts: () => ({ data: { data: [], meta: { total: 0 } }, isLoading: false }),
}));

vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() } }));

function Where() {
  const { pathname } = useLocation();
  return <p data-testid="where">{pathname}</p>;
}

function renderShell(path = '/') {
  return render(
    <LayoutPreferenceProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="*" element={<Where />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </LayoutPreferenceProvider>,
  );
}

describe('nav-config: fuente única del menú', () => {
  it('cada rol ve solo sus pantallas y Compras trae sus páginas', () => {
    const dir = navForRole('DIR-01');
    expect(dir.map((e) => e.to)).toContain('/compras');
    expect(dir.find((e) => e.to === '/compras')?.children?.map((c) => c.to)).toContain('/compras/facturas');
    expect(navForRole('PRO-01').map((e) => e.to)).toEqual(['/', '/profesor/catalogo', '/profesor/solicitudes', '/profesor/novedades']);
    // AD-01 solo ve (no edita) el mapa de salas (REQ-22).
    expect(screensForRole('AD-01').map((s) => s.to)).toEqual(['/mapa-salas', '/usuarios', '/panoles', '/auditoria', '/monitoreo']);
  });

  it('las acciones rápidas solo apuntan a pantallas que el rol puede abrir', () => {
    for (const role of ['AD-01', 'DIR-01', 'PAN-01', 'PRO-01']) {
      const allowed = ['/', ...screensForRole(role).map((s) => s.to), ...navForRole(role).map((e) => e.to)];
      for (const action of quickActionsForRole(role)) {
        expect(allowed.some((to) => action.to === to || action.to.startsWith(`${to}/`))).toBe(true);
      }
    }
  });

  it('findScreen resuelve grupo, pantalla y detalle', () => {
    expect(findScreen('/compras/facturas')?.group?.label).toBe('Compras');
    expect(findScreen('/compras/solicitudes/12')?.entry.label).toBe('Solicitudes de compra');
    expect(findScreen('/prestamos/cola')?.entry.label).toBe('Préstamos');
    expect(findScreen('/mapa-salas/7')?.entry.label).toBe('Mapa de salas');
  });
});

describe('Layouts sidebar y header', () => {
  beforeEach(() => {
    localStorage.clear();
    mockUserRole = 'DIR-01';
  });

  it('por defecto usa el sidebar con migas de pan', () => {
    renderShell('/compras/solicitudes/7');
    expect(screen.getByRole('separator', { name: 'Ajustar tamaño de panel lateral' })).toBeDefined();
    const crumbs = screen.getByRole('navigation', { name: 'Ruta' });
    expect(within(crumbs).getByRole('link', { name: 'Compras' }).getAttribute('href')).toBe('/compras');
    expect(within(crumbs).getByText('Detalle')).toBeDefined();
  });

  it('con la preferencia «header» muestra la barra superior y el menú de cuenta', () => {
    localStorage.setItem('sgia-layout', 'header');
    renderShell('/inventario');
    expect(screen.queryByRole('separator', { name: 'Ajustar tamaño de panel lateral' })).toBeNull();
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(within(nav).getByRole('link', { name: 'Inventario' }).getAttribute('aria-current')).toBe('page');
    expect(within(nav).getByRole('button', { name: /Más/ })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Cuenta de Diana Muñoz' })).toBeDefined();
  });

  it('cambiar la navegación en Ajustes cambia de layout y se guarda', async () => {
    const user = userEvent.setup();
    renderShell('/');
    await user.click(screen.getAllByRole('button', { name: /ajustes de usuario y apariencia/i })[0]!);
    await user.click(screen.getByRole('button', { name: 'Barra superior' }));
    expect(localStorage.getItem('sgia-layout')).toBe('header');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Cuenta de Diana Muñoz' })).toBeDefined();
  });
});

describe('Buscador Ctrl K y atajos', () => {
  beforeEach(() => {
    localStorage.clear();
    mockUserRole = 'DIR-01';
  });

  it('Ctrl K abre el buscador, filtra sin tildes y Enter navega', async () => {
    const user = userEvent.setup();
    renderShell('/');
    await user.keyboard('{Control>}k{/Control}');
    const input = screen.getByRole('combobox', { name: 'Buscar pantallas y acciones' });
    await user.type(input, 'analitica');
    const options = screen.getAllByRole('option');
    expect(options.every((o) => /analítica/i.test(o.textContent ?? ''))).toBe(true);
    await user.keyboard('{Enter}');
    expect(screen.getByTestId('where').textContent).toBe('/analitica');
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('el buscador no ofrece pantallas de otros roles', async () => {
    const user = userEvent.setup();
    renderShell('/');
    await user.click(screen.getByRole('button', { name: 'Buscar pantallas y acciones' }));
    await user.type(screen.getByRole('combobox'), 'usuarios');
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByText(/Nada coincide/)).toBeDefined();
  });

  it('? abre la lista de atajos con la acción de inicio del rol', async () => {
    const user = userEvent.setup();
    renderShell('/');
    await user.keyboard('?');
    const dialog = screen.getByRole('dialog', { name: 'Atajos de teclado' });
    expect(within(dialog).getByText('Nueva solicitud de compra (en Inicio)')).toBeDefined();
  });
});
