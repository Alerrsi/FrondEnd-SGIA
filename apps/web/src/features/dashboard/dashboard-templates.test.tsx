import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from './pages/dashboard-page';
import { mockMetricsApi } from './metrics-api-mock';

vi.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="chart-bar" />,
  Line: () => <div data-testid="chart-line" />,
  Doughnut: () => <div data-testid="chart-doughnut" />,
  PolarArea: () => <div data-testid="chart-polar" />,
}));

vi.mock('@/contexts/theme-context', () => ({
  useTheme: () => ({ theme: 'dark', resolvedTheme: 'dark' }),
}));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <DashboardPage />
    </QueryClientProvider>,
  );
}

describe('REQ-15: plantillas de dashboard con nombre (hasta 9 gráficos)', () => {
  beforeEach(() => {
    localStorage.clear();
    mockMetricsApi();
  });

  it('crea una plantilla, le agrega un gráfico y no mezcla el panel principal', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Préstamos Diarios por Semana');
    expect(screen.getAllByTestId(/^chart-card-/).length).toBe(3);

    await user.click(screen.getByRole('button', { name: /Nueva plantilla/i }));
    await user.type(screen.getByTestId('template-name-input'), 'Resumen semestral');
    await user.click(screen.getByRole('button', { name: /Crear plantilla/i }));

    // Queda seleccionada y vacía (0/9).
    const tab = await screen.findByRole('tab', { name: /Resumen semestral/i });
    await waitFor(() => expect(tab.getAttribute('aria-selected')).toBe('true'));
    await waitFor(() => expect(screen.queryAllByTestId(/^chart-card-/).length).toBe(0));
    expect(tab.textContent).toContain('0/9');

    // Se agrega un gráfico a la plantilla.
    await user.click(await screen.findByRole('button', { name: /Préstamos por estado/i }));
    await waitFor(() => expect(screen.getAllByTestId(/^chart-card-/).length).toBe(1));
    await waitFor(() => expect(screen.getByRole('tab', { name: /Resumen semestral/i }).textContent).toContain('1/9'));

    // El panel principal conserva sus tres gráficos.
    await user.click(screen.getByRole('tab', { name: /Panel principal/i }));
    await waitFor(() => expect(screen.getAllByTestId(/^chart-card-/).length).toBe(3));
  });

  it('rechaza un nombre repetido y borra la plantilla con sus gráficos', async () => {
    const user = userEvent.setup();
    mockMetricsApi({ dashboardTemplates: [{ id: 7, name: 'Operaciones' }] });
    renderPage();

    await user.click(await screen.findByRole('button', { name: /Nueva plantilla/i }));
    await user.type(screen.getByTestId('template-name-input'), 'Operaciones');
    await user.click(screen.getByRole('button', { name: /Crear plantilla/i }));
    // Sigue abierto el diálogo: no se creó otra pestaña.
    await waitFor(() => expect(screen.getAllByRole('tab', { name: /Operaciones/i, hidden: true }).length).toBe(1));
    await user.click(screen.getByRole('button', { name: /Cancelar/i }));

    await user.click(screen.getByRole('tab', { name: /Operaciones/i }));
    await user.click(await screen.findByRole('button', { name: /Eliminar plantilla/i }));
    await user.click(screen.getByRole('button', { name: /^Eliminar$/i }));
    await waitFor(() => expect(screen.queryByRole('tab', { name: /Operaciones/i })).toBeNull());
    expect(screen.getByRole('tab', { name: /Panel principal/i }).getAttribute('aria-selected')).toBe('true');
  });
});
