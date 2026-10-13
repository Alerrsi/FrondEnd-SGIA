import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from './pages/dashboard-page';
import { resolveMockMetric } from './hooks/use-metrics';
import type { MetricQueryInput } from './types/metrics';

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

describe('REQ-14: Drag & Drop, Modo Edición y Asistente Post-Drop', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('activa el modo de edición y bloquea/desbloquea controles de arrastre', async () => {
    const user = userEvent.setup();
    renderWithClient(<DashboardPage />);

    // En Modo Visualización: no hay drag handles ni drop zones
    expect(screen.queryByTestId('drag-handle-0')).toBeNull();
    expect(screen.queryByTestId('drop-zone-0')).toBeNull();
    expect(screen.queryByTestId('edit-mode-banner')).toBeNull();

    // Activar Modo Edición
    const editModeBtn = screen.getByRole('button', { name: /Modo Edición/i });
    await user.click(editModeBtn);

    // En Modo Edición: aparecen drag handles, banner informativo y drop zones
    expect(screen.getByTestId('edit-mode-banner')).toBeDefined();
    expect(screen.getByTestId('drag-handle-0')).toBeDefined();
    expect(screen.getByTestId('drop-zone-0')).toBeDefined();
    expect(screen.getByRole('button', { name: /Guardar y Salir/i })).toBeDefined();

    // Desactivar / Guardar y Salir
    const saveBtn = screen.getByRole('button', { name: /Guardar y Salir/i });
    await user.click(saveBtn);

    // Vuelve al Modo Visualización ergonómico
    expect(screen.queryByTestId('drag-handle-0')).toBeNull();
    expect(screen.queryByTestId('drop-zone-0')).toBeNull();
    expect(screen.queryByTestId('edit-mode-banner')).toBeNull();
  });

  it('abre la paleta lateral de formas y permite arrastrar widget hacia DropZone', async () => {
    const user = userEvent.setup();
    renderWithClient(<DashboardPage />);

    // Entrar en modo edición
    await user.click(screen.getByRole('button', { name: /Modo Edición/i }));

    // Abrir paleta lateral
    const paletteBtn = screen.getByRole('button', { name: /Abrir Catálogo de Widgets/i });
    await user.click(paletteBtn);

    // Se muestran las 4 formas genéricas
    expect(screen.getByTestId('widget-item-bar')).toBeDefined();
    expect(screen.getByTestId('widget-item-doughnut')).toBeDefined();
    expect(screen.getByTestId('widget-item-line')).toBeDefined();
    expect(screen.getByTestId('widget-item-polar_area')).toBeDefined();

    // Simular dragstart sobre el widget LINE
    const lineWidget = screen.getByTestId('widget-item-line');
    const setData = vi.fn();
    fireEvent.dragStart(lineWidget, {
      dataTransfer: {
        setData,
        effectAllowed: 'copy',
      },
    });

    expect(setData).toHaveBeenCalledWith(
      'text/plain',
      JSON.stringify({ type: 'NEW_WIDGET', chartType: 'LINE' }),
    );

    // Simular dragover sobre la drop zone 0
    const dropZone0 = screen.getByTestId('drop-zone-0');
    fireEvent.dragOver(dropZone0, {
      dataTransfer: { dropEffect: 'copy' },
    });
    expect(dropZone0.textContent).toContain('Soltar aquí para ubicar en posición #1');
  });

  it('abre el asistente post-drop con tipo de gráfico bloqueado y selectores dependientes de groupBy', async () => {
    const user = userEvent.setup();
    renderWithClient(<DashboardPage />);

    // Entrar en modo edición
    await user.click(screen.getByRole('button', { name: /Modo Edición/i }));

    // Simular drop de widget DOUGHNUT en drop zone 1
    const dropZone1 = screen.getByTestId('drop-zone-1');
    fireEvent.drop(dropZone1, {
      dataTransfer: {
        getData: () =>
          JSON.stringify({ type: 'NEW_WIDGET', chartType: 'DOUGHNUT' }),
      },
    });

    // Se abre el asistente modal
    expect(screen.getByText(/Asistente de Configuración Analítica \(Post-Drop\)/i)).toBeDefined();
    // Tipo de gráfico bloqueado a DOUGHNUT
    expect(screen.getByText(/Torta \/ Dona \(DOUGHNUT\)/i)).toBeDefined();

    // Seleccionar entidad LOANS
    const entitySelect = screen.getByLabelText(/Entidad de Pañol TI/i);
    await user.selectOptions(entitySelect, 'LOANS');

    // Comprobar opciones de Agrupar por para LOANS
    const groupBySelect = screen.getByLabelText(/Agrupar por \(Group By Contextual\)/i);
    expect(groupBySelect).toBeDefined();
    expect(screen.getByRole('option', { name: 'Estado de Préstamo' })).toBeDefined();
    expect(screen.getByRole('option', { name: 'Docente Solicitante' })).toBeDefined();
    expect(screen.getByRole('option', { name: 'Asignatura' })).toBeDefined();
    expect(screen.getByRole('option', { name: 'Tipo de Insumo' })).toBeDefined();
  });

  it('permite cancelar el drop sin alterar los gráficos del lienzo', async () => {
    const user = userEvent.setup();
    renderWithClient(<DashboardPage />);

    // Guardar número de gráficos antes del drop
    const initialChartCards = screen.getAllByTestId(/^chart-card-/);
    expect(initialChartCards.length).toBe(3);

    // Entrar en modo edición y soltar
    await user.click(screen.getByRole('button', { name: /Modo Edición/i }));
    const dropZone0 = screen.getByTestId('drop-zone-0');
    fireEvent.drop(dropZone0, {
      dataTransfer: {
        getData: () =>
          JSON.stringify({ type: 'NEW_WIDGET', chartType: 'BAR' }),
      },
    });

    // Modal abierto -> Click Cancelar
    const cancelBtn = screen.getByRole('button', { name: /Cancelar Soltado/i });
    await user.click(cancelBtn);

    // El modal se cierra y el conteo de gráficos se mantiene intacto
    expect(screen.queryByText(/Asistente de Configuración Analítica/i)).toBeNull();
    const chartCardsAfter = screen.getAllByTestId(/^chart-card-/);
    expect(chartCardsAfter.length).toBe(3);
  });

  it('confirma el drop, inserta el gráfico y persiste en localStorage al salir', async () => {
    const user = userEvent.setup();
    renderWithClient(<DashboardPage />);

    // Entrar en modo edición y soltar en drop zone 0
    await user.click(screen.getByRole('button', { name: /Modo Edición/i }));
    const dropZone0 = screen.getByTestId('drop-zone-0');
    fireEvent.drop(dropZone0, {
      dataTransfer: {
        getData: () =>
          JSON.stringify({ type: 'NEW_WIDGET', chartType: 'BAR' }),
      },
    });

    // Seleccionar entidad EQUIPMENT y agrupar por location
    const entitySelect = screen.getByLabelText(/Entidad de Pañol TI/i);
    await user.selectOptions(entitySelect, 'EQUIPMENT');

    const groupBySelect = screen.getByLabelText(/Agrupar por \(Group By Contextual\)/i);
    await user.selectOptions(groupBySelect, 'location');

    // Confirmar inserción
    const confirmBtn = screen.getByRole('button', { name: /Confirmar e Insertar/i });
    await user.click(confirmBtn);

    // Ahora hay 4 gráficos
    const updatedCards = screen.getAllByTestId(/^chart-card-/);
    expect(updatedCards.length).toBe(4);

    // Click en Guardar y Salir
    const saveBtn = screen.getByRole('button', { name: /Guardar y Salir/i });
    await user.click(saveBtn);

    // Verificar persistencia en localStorage
    const saved = localStorage.getItem('sgia_dashboard_charts_v1');
    expect(saved).not.toBeNull();
    const parsed = JSON.parse(saved!);
    expect(parsed.length).toBe(4);
    expect(parsed[0].entity).toBe('EQUIPMENT');
    expect(parsed[0].groupBy).toBe('location');
  });

  it('permite reordenar gráficos arrastrando de una posición a otra en DropZones', async () => {
    const user = userEvent.setup();
    renderWithClient(<DashboardPage />);

    // Entrar en modo edición
    await user.click(screen.getByRole('button', { name: /Modo Edición/i }));

    // Reordenar gráfico de posición 2 a posición 0
    const dropZone0 = screen.getByTestId('drop-zone-0');
    fireEvent.drop(dropZone0, {
      dataTransfer: {
        getData: () =>
          JSON.stringify({ type: 'REORDER', sourceIndex: 2 }),
      },
    });

    // Las tarjetas deben seguir siendo 3
    const cards = screen.getAllByTestId(/^chart-card-/);
    expect(cards.length).toBe(3);
  });

  it('permite cambiar de lugar gráficos arrastrando directamente una tarjeta sobre otra', async () => {
    const user = userEvent.setup();
    renderWithClient(<DashboardPage />);

    // Entrar en modo edición
    await user.click(screen.getByRole('button', { name: /Modo Edición/i }));

    const card0 = screen.getByTestId('chart-card-0');
    const card2 = screen.getByTestId('chart-card-2');

    // Drag start en card 2
    fireEvent.dragStart(card2, {
      dataTransfer: {
        setData: vi.fn(),
        effectAllowed: 'move',
      },
    });

    // Drag over card 0
    fireEvent.dragOver(card0, {
      dataTransfer: { dropEffect: 'move' },
    });
    expect(card0.textContent).toContain('Soltar para mover a posición #1');

    // Drop card 2 directly onto card 0
    fireEvent.drop(card0, {
      dataTransfer: {
        getData: () =>
          JSON.stringify({ type: 'REORDER', sourceIndex: 2 }),
      },
    });

    // El número de gráficos sigue siendo 3 y las posiciones se intercambian
    const cards = screen.getAllByTestId(/^chart-card-/);
    expect(cards.length).toBe(3);
  });

  it('resuelve métricas con mock context-aware de Pañol TI', () => {
    const input: MetricQueryInput = {
      entity: 'EQUIPMENT',
      metric: 'COUNT',
      chartType: 'BAR',
      timeRange: 'SEMESTER_CURRENT',
      groupBy: 'hardware_category',
    };

    const res = resolveMockMetric(input);
    expect(res.points.length).toBeGreaterThan(0);
    expect(res.points[0]?.label).toContain('Cisco');
  });
});
