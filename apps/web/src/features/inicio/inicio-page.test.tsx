import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { TooltipProvider } from '@/components/ui/tooltip';
import { canAccessRoute } from '@/features/auth/types/roles';
import InicioPage from './pages/inicio-page';
import { getInicioModules } from './lib/inicio-content';

const mockLogout = vi.fn();
let mockRole = 'PAN-01';

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({
    user: { id: 1, nombre: 'Camila Rojas', email: 'c@inacap.cl', rol: mockRole, activo: true },
    logout: mockLogout,
    isAuthenticated: true,
  }),
}));

vi.mock('@/contexts/theme-context', () => ({
  useTheme: () => ({
    theme: 'light',
    resolvedTheme: 'light',
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
    isSystem: false,
  }),
}));

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

function renderInicio() {
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={['/inicio']}>
        <Routes>
          <Route path="/inicio" element={<InicioPage />} />
          <Route path="/login" element={<div>Pantalla de login</div>} />
        </Routes>
      </MemoryRouter>
    </TooltipProvider>,
  );
}

describe('Portada /inicio', () => {
  beforeEach(() => {
    mockLogout.mockClear();
  });

  it('está abierta para los cuatro roles web', () => {
    for (const role of ['AD-01', 'DIR-01', 'PAN-01', 'PRO-01'] as const) {
      expect(canAccessRoute(role, '/inicio')).toBe(true);
    }
  });

  it('saluda al usuario y muestra la acción principal del pañolero', () => {
    mockRole = 'PAN-01';
    renderInicio();
    expect(screen.getByText('Hola, Camila')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Abrir mostrador/ }).getAttribute('href')).toBe(
      '/prestamos/mostrador',
    );
  });

  it('el profesor solo ve sus módulos y la acción del catálogo', () => {
    mockRole = 'PRO-01';
    renderInicio();
    expect(screen.getByRole('link', { name: /Ver catálogo/ }).getAttribute('href')).toBe(
      '/profesor/catalogo',
    );
    expect(getInicioModules('PRO-01').map((m) => m.to)).toEqual([
      '/profesor/catalogo',
      '/profesor/solicitudes',
      '/profesor/novedades',
    ]);
  });

  it('los accesos rápidos solo incluyen rutas permitidas para cada rol', () => {
    for (const role of ['AD-01', 'DIR-01', 'PAN-01', 'PRO-01'] as const) {
      const modules = getInicioModules(role);
      expect(modules.length).toBeGreaterThan(0);
      for (const m of modules) expect(canAccessRoute(role, m.to)).toBe(true);
    }
  });

  it('recorre los accesos rápidos con siguiente y anterior', async () => {
    mockRole = 'PRO-01';
    const user = userEvent.setup();
    renderInicio();
    expect(screen.getByText('01 / 03')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Módulo siguiente' }));
    expect(screen.getByText('02 / 03')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Módulo anterior' }));
    await user.click(screen.getByRole('button', { name: 'Módulo anterior' }));
    expect(screen.getByText('03 / 03')).toBeTruthy();
  });

  it('cierra sesión y vuelve al login', async () => {
    mockRole = 'DIR-01';
    const user = userEvent.setup();
    renderInicio();
    await user.click(screen.getByRole('button', { name: /Salir/ }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Pantalla de login')).toBeTruthy();
  });
});
