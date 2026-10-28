import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import LoginPage from './login';
import { AuthProvider } from '../context/auth-context';
import { ThemeProvider } from '@/contexts/theme-context';
import { TooltipProvider } from '@/components/ui/tooltip';

describe('LoginPage', () => {
  it('renders login form properly without crashing', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>
              <MemoryRouter initialEntries={['/login']}>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                </Routes>
              </MemoryRouter>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByText('Iniciar Sesión')).toBeDefined();
    expect(screen.getByLabelText(/correo institucional/i)).toBeDefined();
    expect(screen.getByPlaceholderText('••••••••')).toBeDefined();
    expect(screen.getByRole('button', { name: /acceder/i })).toBeDefined();
  });

  describe('flujo de login (fetch simulado)', () => {
    const user = (role: string) => ({ id: 1, name: 'Ana', email: 'a@sgia.cl', role, is_active: true });

    function mockApi(loginResponse: { status: number; body: unknown }) {
      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string) => {
          const isLogin = String(url).endsWith('/login');
          const { status, body } = isLogin
            ? loginResponse
            : { status: 200, body: { data: user('PAN-01') } };
          return new Response(JSON.stringify(body), { status });
        }),
      );
    }

    async function submit() {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      render(
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <TooltipProvider>
                <MemoryRouter initialEntries={['/login']}>
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/inventario" element={<div>Pantalla inventario</div>} />
                  </Routes>
                </MemoryRouter>
              </TooltipProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>,
      );
      const u = userEvent.setup();
      await u.type(screen.getByLabelText(/correo institucional/i), 'a@sgia.cl');
      await u.type(screen.getByPlaceholderText('••••••••'), 'Clave1234');
      await u.click(screen.getByRole('button', { name: /acceder/i }));
    }

    afterEach(() => {
      vi.unstubAllGlobals();
      localStorage.clear();
    });

    it('login exitoso guarda el token y redirige según el rol', async () => {
      mockApi({ status: 200, body: { token: 'tok-123', user: user('PAN-01') } });
      await submit();

      expect(await screen.findByText('Pantalla inventario')).toBeDefined();
      expect(localStorage.getItem('sgia_token')).toBe('tok-123');
    });

    it('401 muestra el mensaje del servidor y no guarda token', async () => {
      mockApi({ status: 401, body: { message: 'Credenciales inválidas.' } });
      await submit();

      expect((await screen.findByRole('alert')).textContent).toContain('Credenciales inválidas.');
      expect(localStorage.getItem('sgia_token')).toBeNull();
    });

    it('422 muestra el primer error de validación', async () => {
      mockApi({
        status: 422,
        body: { message: 'Datos inválidos.', errors: { email: ['El correo no es válido.'] } },
      });
      await submit();

      expect((await screen.findByRole('alert')).textContent).toContain('El correo no es válido.');
    });

    it('un rol de app móvil (PRO-01) es rechazado y se limpia el token', async () => {
      mockApi({ status: 200, body: { token: 'tok-pro', user: user('PRO-01') } });
      await submit();

      expect((await screen.findByRole('alert')).textContent).toContain('Acceso restringido');
      await waitFor(() => expect(localStorage.getItem('sgia_token')).toBeNull());
    });
  });
});
