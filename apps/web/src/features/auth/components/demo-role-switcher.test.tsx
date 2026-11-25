import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from '../context/auth-context';
import { DemoRoleSwitcher } from './demo-role-switcher';

const panol = { id: 3, name: 'Pañolero', email: 'panol@sgia.cl', role: 'PAN-01', is_active: true };
const director = { id: 2, name: 'Director', email: 'director@sgia.cl', role: 'DIR-01', is_active: true };

function mockApi() {
  let current = panol;
  const fetchMock = vi.fn(async (url: string) => {
    const path = String(url);
    if (path.endsWith('/logout')) return new Response(null, { status: 204 });
    if (path.endsWith('/login')) {
      current = director;
      return new Response(JSON.stringify({ token: 'tok-dir', user: director }), { status: 200 });
    }
    return new Response(JSON.stringify({ data: current }), { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function renderSwitcher(path = '/inventario') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/" element={<div>Pantalla inicio</div>} />
            <Route path="/inventario" element={<div>Pantalla inventario</div>} />
          </Routes>
          <DemoRoleSwitcher />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('DemoRoleSwitcher', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('no aparece sin contraseña de demostración', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_DEMO_LOGIN_PASSWORD', '');
    localStorage.setItem('sgia_token', 'tok-panol');
    mockApi();
    renderSwitcher();
    await screen.findByText('Pantalla inventario');
    expect(screen.queryByRole('button', { name: /cambiar rol/i })).toBeNull();
  });

  it('muestra el rol actual y cambia a otro sin pasar por el login', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_DEMO_LOGIN_PASSWORD', 'clave-demo');
    localStorage.setItem('sgia_token', 'tok-panol');
    const fetchMock = mockApi();
    renderSwitcher();

    const trigger = await screen.findByRole('button', { name: /cambiar rol/i });
    expect(trigger.textContent).toContain('Pañolero');

    const user = userEvent.setup();
    await user.click(trigger);
    expect(screen.getByRole('menuitem', { name: /Pañolero/ }).getAttribute('data-disabled')).not.toBeNull();
    await user.click(screen.getByRole('menuitem', { name: /Director/ }));

    expect(await screen.findByText('Pantalla inicio')).toBeDefined();
    expect(localStorage.getItem('sgia_token')).toBe('tok-dir');
    const paths = fetchMock.mock.calls.map(([u]) => String(u));
    const logoutAt = paths.findIndex((p) => p.endsWith('/logout'));
    const loginAt = paths.findIndex((p) => p.endsWith('/login'));
    expect(logoutAt).toBeGreaterThan(-1);
    expect(loginAt).toBeGreaterThan(logoutAt);
    expect((await screen.findByRole('button', { name: /cambiar rol/i })).textContent).toContain('Director');
  });
});
