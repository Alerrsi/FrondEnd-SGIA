import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
