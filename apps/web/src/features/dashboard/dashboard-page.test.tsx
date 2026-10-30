import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from './pages/dashboard-page';
import { mockMetricsApi } from './metrics-api-mock';

// Mock react-chartjs-2 to avoid canvas issues in happy-dom
vi.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="chart-bar">Mock Bar Chart</div>,
  Line: () => <div data-testid="chart-line">Mock Line Chart</div>,
  Doughnut: () => <div data-testid="chart-doughnut">Mock Doughnut Chart</div>,
  PolarArea: () => <div data-testid="chart-polar">Mock PolarArea Chart</div>,
}));

vi.mock('@/contexts/theme-context', () => ({
  useTheme: () => ({
    theme: 'dark',
    resolvedTheme: 'dark',
  }),
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>,
  );
}

describe('REQ-14: Dashboards Analíticos y Métricas Dinámicas (DashboardPage)', () => {
  beforeEach(() => {
    localStorage.clear();
    mockMetricsApi();
  });

  it('renders dashboard layout and charts from default template', async () => {
    renderWithClient(<DashboardPage />);

    expect(screen.getByText(/Dashboards Analíticos y Métricas/i)).toBeDefined();
    expect(await screen.findByText('Disponibles')).toBeDefined();
    expect(await screen.findByText('En Préstamo')).toBeDefined();
    expect(await screen.findByText('Tasa Atrasos')).toBeDefined();

    // Default charts
    expect(screen.getByText('Préstamos Diarios por Semana')).toBeDefined();
    expect(screen.getByText('Estado y Atrasos de Préstamos')).toBeDefined();
    expect(screen.getByText('Alertas Críticas por Especialidad')).toBeDefined();
  });

  it('switches between templates properly', async () => {
    const user = userEvent.setup();
    renderWithClient(<DashboardPage />);

    const demandaButton = screen.getByText('Demanda y Desgaste por Carrera');
    await user.click(demandaButton);

    expect(screen.getByText('Insumos Consumidos por Especialidad')).toBeDefined();
    expect(screen.getByText('Ranking de Equipos Más Solicitados')).toBeDefined();
  });

  it('reemplaza botón de nuevo gráfico: solo se pueden añadir mediante Abrir Catálogo de Widgets', async () => {
    const user = userEvent.setup();
    renderWithClient(<DashboardPage />);

    // El botón tradicional "Nuevo Gráfico" ya no existe
    expect(screen.queryByRole('button', { name: /Nuevo Gráfico/i })).toBeNull();

    // El acceso a agregar gráficos es mediante "Abrir Catálogo de Widgets"
    const catalogBtn = screen.getByRole('button', { name: /Abrir Catálogo de Widgets/i });
    expect(catalogBtn).toBeDefined();

    await user.click(catalogBtn);

    // Al hacer clic, se activa el modo edición y se abre el catálogo lateral
    expect(screen.getByText(/Formas Gráficas Genéricas/i)).toBeDefined();
    expect(screen.getByTestId('edit-mode-banner')).toBeDefined();
  });
});
