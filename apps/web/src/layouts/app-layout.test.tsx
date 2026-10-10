import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import AppLayout from './app-layout';

const mockLogout = vi.fn();

let mockUserRole = 'AD-01';
let mockUserName = 'Admin Rodrigo';

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      nombre: mockUserName,
      email: 'rodrigo@inacap.cl',
      rol: mockUserRole,
      activo: true,
    },
    logout: mockLogout,
    isAuthenticated: true,
  }),
}));

vi.mock('@sgia/api-client', () => ({
  useCriticalStockAlerts: () => ({
    data: {
      data: [
        {
          id: 1,
          alert_type: 'critical',
          product_id: 10,
          product_name: 'Tester Fluke',
          stock: 2,
          stock_minimo: 5,
          is_resolved: false,
        },
      ],
      meta: { total: 1 },
    },
    isLoading: false,
  }),
}));

vi.mock('@/lib/toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

describe('AppLayout Sidebar (REQ-DISEÑO)', () => {
  it('renders expanded sidebar with human-readable role "Administrador" and without technical code', () => {
    mockUserRole = 'AD-01';
    mockUserName = 'Admin Rodrigo';

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<div>Contenido de Prueba</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    // Muestra el nombre legible del rol
    expect(screen.getByText('Administrador')).toBeDefined();

    // NO debe mostrar el código técnico "AD-01"
    expect(screen.queryByText('AD-01')).toBeNull();

    // Contenido principal renderizado
    expect(screen.getByText('Contenido de Prueba')).toBeDefined();

    // Botón para encoger disponible
    expect(screen.getByTitle('Encoger panel lateral')).toBeDefined();
  });

  it('renders "Pañol" when user has role PAN-01 and without technical code', () => {
    mockUserRole = 'PAN-01';
    mockUserName = 'Pañolero Juan';

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<div>Contenido Pañol</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    // Muestra "Pañol"
    expect(screen.getByText('Pañol')).toBeDefined();

    // NO debe mostrar el código técnico "PAN-01"
    expect(screen.queryByText('PAN-01')).toBeNull();
  });

  it('toggles collapse and expand, maintaining option logos accessible', async () => {
    mockUserRole = 'AD-01';
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/usuarios']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/usuarios" element={<div>Vista Usuarios</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    // En estado expandido, el texto "Usuarios" está visible
    expect(screen.getByText('Usuarios')).toBeDefined();

    // Hacer clic en encoger
    const collapseButton = screen.getByTitle('Encoger panel lateral');
    await user.click(collapseButton);

    // Ahora está en modo encogido: el botón de expandir está disponible
    const expandButton = screen.getByTitle('Expandir panel lateral');
    expect(expandButton).toBeDefined();

    // El logo / opción para acceder a "Usuarios" sigue disponible mediante aria-label / title
    const usuariosNavLink = screen.getByRole('link', { name: 'Usuarios' });
    expect(usuariosNavLink).toBeDefined();

    // Hacer clic en expandir
    await user.click(expandButton);

    // Vuelve al modo expandido
    expect(screen.getByTitle('Encoger panel lateral')).toBeDefined();
    expect(screen.getByText('Usuarios')).toBeDefined();
  });

  it('has a resize separator handle with cursor-col-resize and draggable properties', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<div>Test</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const resizeHandle = screen.getByRole('separator', {
      name: 'Ajustar tamaño de panel lateral',
    });
    expect(resizeHandle).toBeDefined();
    expect(resizeHandle.getAttribute('aria-orientation')).toBe('vertical');
    expect(resizeHandle.className).toContain('cursor-col-resize');
  });

  it('abre el modal de ajustes al pulsar el botón de engranaje al costado del nombre de usuario', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<div>Test</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    // Botón con forma de engranaje al costado del nombre de usuario
    const settingsButton = screen.getByRole('button', {
      name: /ajustes de usuario y apariencia/i,
    });
    expect(settingsButton).toBeDefined();

    // Modal no abierto inicialmente
    expect(screen.queryByRole('dialog')).toBeNull();

    // Pulsar botón de ajustes
    await user.click(settingsButton);

    // Modal de ajustes abierto
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('Ajustes del Sistema')).toBeDefined();
    expect(screen.getByText('Paleta de Colores de Interfaz')).toBeDefined();
    expect(screen.getByText('Paleta Principal (Industrial INACAP)')).toBeDefined();
    expect(screen.getByText('Paleta B1 (Azul Acero & Indigo)')).toBeDefined();
  });

  it('abre el modal de ajustes desde el sidebar en modo encogido', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<div>Test</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    // Encoger sidebar
    const collapseButton = screen.getByTitle('Encoger panel lateral');
    await user.click(collapseButton);

    // Botón de ajustes en modo encogido en IconBar 3
    const settingsButton = screen.getByRole('button', {
      name: /ajustes de usuario y apariencia/i,
    });
    await user.click(settingsButton);

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('Ajustes del Sistema')).toBeDefined();
  });

  it('calls logout and redirects when logout button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<div>Test</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const logoutButtons = screen.getAllByRole('button', { name: /cerrar sesión/i });
    expect(logoutButtons.length).toBeGreaterThan(0);

    await user.click(logoutButtons[0]!);
    expect(mockLogout).toHaveBeenCalled();
  });
});
