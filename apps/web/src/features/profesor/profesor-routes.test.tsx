import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { RequireRole } from '@/features/auth/components/protected-route';

let mockRole = 'PRO-01';

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({ user: { id: 1, nombre: 'Usuario', rol: mockRole }, isAuthenticated: true }),
}));

function renderRoute(path: string, allowed: Array<'AD-01' | 'PRO-01' | 'PAN-01' | 'DIR-01'>) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path={path}
          element={
            <RequireRole allowedRoles={allowed}>
              <div>Contenido protegido</div>
            </RequireRole>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('rutas del profesor y del panel', () => {
  it('PRO-01 entra a /profesor/*', () => {
    mockRole = 'PRO-01';
    renderRoute('/profesor/solicitudes', ['PRO-01']);
    expect(screen.getByText('Contenido protegido')).toBeDefined();
  });

  it('AD-01, DIR-01 y PAN-01 ven la página de acceso denegado en /profesor/*', () => {
    for (const role of ['AD-01', 'DIR-01', 'PAN-01']) {
      mockRole = role;
      const { unmount } = renderRoute('/profesor/solicitudes', ['PRO-01']);
      expect(screen.queryByText('Contenido protegido')).toBeNull();
      unmount();
    }
  });

  it('PRO-01 ve la página de acceso denegado en el panel administrativo', () => {
    mockRole = 'PRO-01';
    renderRoute('/usuarios', ['AD-01']);
    expect(screen.queryByText('Contenido protegido')).toBeNull();
  });
});
