import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

    expect(screen.getByText('Iniciar sesión')).toBeDefined();
    expect(screen.getByLabelText(/correo institucional/i)).toBeDefined();
    expect(screen.getByPlaceholderText('••••••••')).toBeDefined();
    expect(screen.getByRole('button', { name: /acceder/i })).toBeDefined();
  });

  describe('accesos de demostración (docs/accesos-demo.md)', () => {
    function renderLogin() {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      render(
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <TooltipProvider>
                <MemoryRouter initialEntries={['/login']}>
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/" element={<div>Pantalla inicio</div>} />
                  </Routes>
                </MemoryRouter>
              </TooltipProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>,
      );
    }

    afterEach(() => {
      vi.unstubAllEnvs();
      vi.unstubAllGlobals();
      localStorage.clear();
    });

    it('no se muestran sin contraseña de demostración', () => {
      vi.stubEnv('VITE_DEV_QUICK_LOGIN_PASSWORD', '');
      vi.stubEnv('VITE_DEMO_LOGIN_PASSWORD', '');
      renderLogin();
      expect(screen.queryByText(/entrar como/i)).toBeNull();
    });

    it('no se muestran fuera de desarrollo solo con la variable de desarrollo', () => {
      vi.stubEnv('DEV', false);
      vi.stubEnv('VITE_DEV_QUICK_LOGIN_PASSWORD', 'clave-de-prueba');
      vi.stubEnv('VITE_DEMO_LOGIN_PASSWORD', '');
      renderLogin();
      expect(screen.queryByText(/entrar como/i)).toBeNull();
    });

    it('un build de presentación los muestra con VITE_DEMO_LOGIN_PASSWORD', () => {
      vi.stubEnv('DEV', false);
      vi.stubEnv('VITE_DEMO_LOGIN_PASSWORD', 'clave-demo');
      renderLogin();
      expect(screen.getByText(/entrar como/i)).toBeDefined();
      for (const label of ['Administrador', 'Director', 'Pañolero', 'Docente']) {
        expect(screen.getByRole('button', { name: new RegExp(label) })).toBeDefined();
      }
    });

    it('un clic entra con la cuenta del rol y lleva al inicio', async () => {
      vi.stubEnv('DEV', true);
      vi.stubEnv('VITE_DEV_QUICK_LOGIN_PASSWORD', 'clave-de-prueba');
      const fetchMock = vi.fn(async (url: string) => {
        const body = String(url).endsWith('/login')
          ? { token: 'tok-dir', user: { id: 2, name: 'Director', email: 'director@sgia.cl', role: 'DIR-01', is_active: true } }
          : { data: { id: 2, name: 'Director', email: 'director@sgia.cl', role: 'DIR-01', is_active: true } };
        return new Response(JSON.stringify(body), { status: 200 });
      });
      vi.stubGlobal('fetch', fetchMock);
      renderLogin();

      await userEvent.click(screen.getByRole('button', { name: /Director/ }));

      expect(await screen.findByText('Pantalla inicio')).toBeDefined();
      const [, init] = fetchMock.mock.calls.find(([u]) => String(u).endsWith('/login')) as unknown as [string, RequestInit];
      expect(JSON.parse(String(init.body))).toMatchObject({
        email: 'director@sgia.cl',
        password: 'clave-de-prueba',
        device_name: 'web',
      });
      expect(localStorage.getItem('sgia_token')).toBe('tok-dir');
    });
  });

  describe('flujo de login (fetch simulado)', () => {
    const user = (role: string) => ({ id: 1, name: 'Ana', email: 'a@sgia.cl', role, is_active: true });

    function mockApi(loginResponse: { status: number; body: unknown }, meRole = 'PAN-01') {
      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string) => {
          const isLogin = String(url).endsWith('/login');
          const { status, body } = isLogin
            ? loginResponse
            : { status: 200, body: { data: user(meRole) } };
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
                    <Route path="/" element={<div>Pantalla inicio</div>} />
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

    it('login exitoso guarda el token y lleva al inicio', async () => {
      mockApi({ status: 200, body: { token: 'tok-123', user: user('PAN-01') } });
      await submit();

      expect(await screen.findByText('Pantalla inicio')).toBeDefined();
      expect(localStorage.getItem('sgia_token')).toBe('tok-123');
    });

    it('el profesor (PRO-01) entra a la web y llega al inicio', async () => {
      mockApi({ status: 200, body: { token: 'tok-pro', user: user('PRO-01') } }, 'PRO-01');
      await submit();

      expect(await screen.findByText('Pantalla inicio')).toBeDefined();
      expect(localStorage.getItem('sgia_token')).toBe('tok-pro');
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
  });
});
