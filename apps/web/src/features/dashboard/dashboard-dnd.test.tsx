import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from './pages/dashboard-page';
import { fakeChart, mockMetricsApi, seedCharts } from './metrics-api-mock';

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

/** Renderiza el panel y espera a que lleguen los gráficos del servidor (`/api/me/charts`). */
async function renderPanel() {
  renderWithClient(<DashboardPage />);
  await screen.findByTestId('chart-card-0');
}

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

describe('REQ-14: Drag & Drop, Modo edición y Asistente Post-Drop', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockMetricsApi();
  });

  it('activa el modo de edición y bloquea/desbloquea controles de arrastre', async () => {
    const user = userEvent.setup();
    await renderPanel();

    // En Modo Visualización: no hay drag handles ni drop zones
    expect(screen.queryByTestId('drag-handle-0')).toBeNull();
    expect(screen.queryByTestId('drop-zone-0')).toBeNull();
    expect(screen.queryByTestId('edit-mode-banner')).toBeNull();

    // Activar Modo edición
    const editModeBtn = screen.getByRole('button', { name: /Modo edición/i });
    await user.click(editModeBtn);

    // En Modo edición: aparecen drag handles, banner informativo y drop zones
    expect(screen.getByTestId('edit-mode-banner')).toBeDefined();
    expect(screen.getByTestId('drag-handle-0')).toBeDefined();
    expect(screen.getByTestId('drop-zone-0')).toBeDefined();
    expect(screen.getByRole('button', { name: /Guardar y salir/i })).toBeDefined();

    // Desactivar / Guardar y salir
    const saveBtn = screen.getByRole('button', { name: /Guardar y salir/i });
    await user.click(saveBtn);

    // Vuelve al Modo Visualización ergonómico
    expect(screen.queryByTestId('drag-handle-0')).toBeNull();
    expect(screen.queryByTestId('drop-zone-0')).toBeNull();
    expect(screen.queryByTestId('edit-mode-banner')).toBeNull();
  });

  it('abre la paleta lateral de formas y permite arrastrar widget hacia DropZone', async () => {
    const user = userEvent.setup();
    await renderPanel();

    // Entrar en modo edición
    await user.click(screen.getByRole('button', { name: /Modo edición/i }));

    // Abrir paleta lateral
    const paletteBtn = screen.getByRole('button', { name: /Abrir catálogo de widgets/i });
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

  it('cuando el usuario agarre un gráfico y salga del menú de widgets, quita el menú y enfoca las zonas de inserción', async () => {
    await renderPanel();
    vi.useFakeTimers();

    // Abrir catálogo de widgets
    const paletteBtn = screen.getByRole('button', { name: /Abrir catálogo de widgets/i });
    fireEvent.click(paletteBtn);

    // El catálogo está desplegado
    expect(screen.getByText(/Formas gráficas genéricas/i)).toBeDefined();

    // El usuario agarra el widget de línea (dragStart)
    const lineWidget = screen.getByTestId('widget-item-line');
    fireEvent.dragStart(lineWidget, {
      dataTransfer: {
        setData: vi.fn(),
        effectAllowed: 'copy',
      },
    });

    // Avanzar temporizador para que el drawer se cierre inmediatamente al iniciar el arrastre
    act(() => {
      vi.advanceTimersByTime(10);
    });

    // Se enfoca la zona donde se pueden poner los widgets
    expect(screen.getByTestId('drag-focus-banner')).toBeDefined();
    const dropZone0 = screen.getByTestId('drop-zone-0');
    expect(dropZone0.getAttribute('data-focused')).toBe('true');

    vi.useRealTimers();
  });

  it('al estar en la zona de enfoque arrastrando el gráfico fuera de widgets, se visualiza el movimiento del gráfico con el mouse hasta soltarlo y no se quita si no se ha soltado', async () => {
    await renderPanel();

    // Abrir catálogo de widgets
    const paletteBtn = screen.getByRole('button', { name: /Abrir catálogo de widgets/i });
    fireEvent.click(paletteBtn);

    // El usuario inicia arrastre de un gráfico BAR
    const barWidget = screen.getByTestId('widget-item-bar');
    fireEvent.dragStart(barWidget, {
      clientX: 200,
      clientY: 300,
      dataTransfer: {
        setData: vi.fn(),
        effectAllowed: 'copy',
      },
    });

    // Se activan las zonas de enfoque
    expect(screen.getByTestId('drag-focus-banner')).toBeDefined();
    const dropZone0 = screen.getByTestId('drop-zone-0');
    expect(dropZone0.getAttribute('data-focused')).toBe('true');

    // Visualización del gráfico en movimiento que sigue el mouse (DragGhostPreview)
    const ghost = screen.getByTestId('drag-ghost-preview');
    expect(ghost).toBeDefined();
    expect(ghost.getAttribute('data-chart-type')).toBe('BAR');
    expect(screen.getByTestId('drag-ghost-status').textContent).toContain('Arrastrando gráfico...');

    // Simular movimiento continuo del mouse por la zona de enfoque
    fireEvent.dragOver(window, {
      clientX: 450,
      clientY: 550,
    });

    // El gráfico NO debe quitarse si el usuario no ha soltado
    expect(screen.getByTestId('drag-ghost-preview')).toBeDefined();
    expect(ghost.style.left).not.toBeNull();
    expect(ghost.style.top).not.toBeNull();

    // Otro movimiento de mouse
    fireEvent.dragOver(window, {
      clientX: 600,
      clientY: 350,
    });
    expect(screen.getByTestId('drag-ghost-preview')).toBeDefined();
    expect(ghost.style.left).not.toBeNull();
    expect(ghost.style.top).not.toBeNull();

    // Finalmente, el usuario suelta en dropZone0
    fireEvent.drop(dropZone0, {
      dataTransfer: {
        getData: () => JSON.stringify({ type: 'NEW_WIDGET', chartType: 'BAR' }),
      },
    });

    // Al soltar, se retira el preview de arrastre y se abre el asistente de configuración
    expect(screen.queryByTestId('drag-ghost-preview')).toBeNull();
    expect(screen.getByText('Configurar gráfico')).toBeDefined();
  });

  it('abre el menú de configuración con el tipo soltado preseleccionado y selectores dependientes de groupBy', async () => {
    const user = userEvent.setup();
    await renderPanel();

    // Entrar en modo edición
    await user.click(screen.getByRole('button', { name: /Modo edición/i }));

    // Simular drop de widget DOUGHNUT en drop zone 1
    const dropZone1 = screen.getByTestId('drop-zone-1');
    fireEvent.drop(dropZone1, {
      dataTransfer: {
        getData: () =>
          JSON.stringify({ type: 'NEW_WIDGET', chartType: 'DOUGHNUT' }),
      },
    });

    // Se abre el asistente modal
    expect(screen.getByText('Configurar gráfico')).toBeDefined();
    // Tipo de gráfico preseleccionado: DOUGHNUT
    expect(screen.getByRole('button', { name: 'Dona' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Barras' }).getAttribute('aria-pressed')).toBe('false');

    // Seleccionar entidad LOANS
    const entitySelect = screen.getByLabelText(/¿Qué quieres medir\?/i);
    await user.selectOptions(entitySelect, 'LOANS');

    // Comprobar opciones de Agrupar por para LOANS
    const groupBySelect = screen.getByLabelText(/Agrupar por/i);
    expect(groupBySelect).toBeDefined();
    expect(screen.getByRole('option', { name: 'Estado de préstamo' })).toBeDefined();
    expect(screen.getByRole('option', { name: 'Docente solicitante' })).toBeDefined();
    expect(screen.getByRole('option', { name: 'Asignatura' })).toBeDefined();
    expect(screen.getByRole('option', { name: 'Tipo de ítem' })).toBeDefined();
  });

  it('permite cancelar el drop sin alterar los gráficos del lienzo', async () => {
    const user = userEvent.setup();
    await renderPanel();

    // Guardar número de gráficos antes del drop
    const initialChartCards = screen.getAllByTestId(/^chart-card-/);
    expect(initialChartCards.length).toBe(3);

    // Entrar en modo edición y soltar
    await user.click(screen.getByRole('button', { name: /Modo edición/i }));
    const dropZone0 = screen.getByTestId('drop-zone-0');
    fireEvent.drop(dropZone0, {
      dataTransfer: {
        getData: () =>
          JSON.stringify({ type: 'NEW_WIDGET', chartType: 'BAR' }),
      },
    });

    // Modal abierto -> Click Cancelar
    const cancelBtn = screen.getByRole('button', { name: /^Cancelar$/ });
    await user.click(cancelBtn);

    // El modal se cierra y el conteo de gráficos se mantiene intacto
    expect(screen.queryByText('Configurar gráfico')).toBeNull();
    const chartCardsAfter = screen.getAllByTestId(/^chart-card-/);
    expect(chartCardsAfter.length).toBe(3);
  });

  it('confirma el drop, crea el gráfico en el servidor y lo muestra', async () => {
    const user = userEvent.setup();
    const fetchMock = mockMetricsApi();
    await renderPanel();

    await user.click(screen.getByRole('button', { name: /Modo edición/i }));
    fireEvent.drop(screen.getByTestId('drop-zone-0'), {
      dataTransfer: { getData: () => JSON.stringify({ type: 'NEW_WIDGET', chartType: 'BAR' }) },
    });

    await user.selectOptions(screen.getByLabelText(/¿Qué quieres medir\?/i), 'EQUIPMENT');
    await user.selectOptions(screen.getByLabelText(/Agrupar por/i), 'location');
    await user.click(screen.getByRole('button', { name: /Añadir al panel/i }));

    await waitFor(() => expect(screen.getAllByTestId(/^chart-card-/).length).toBe(4));

    // POST /me/charts con la plantilla genérica de barras y los datos elegidos
    const post = fetchMock.mock.calls.find(
      ([url, init]) => String(url).endsWith('/me/charts') && init?.method === 'POST',
    );
    const body = JSON.parse(String(post?.[1]?.body)) as Record<string, unknown>;
    expect(body).toMatchObject({
      chart_template_id: 1,
      type: 'BAR',
      entity: 'EQUIPMENT',
      group_by: 'location',
    });

    // Se insertó en la posición 0: el servidor recibió el reordenamiento
    const put = fetchMock.mock.calls.find(([url]) => String(url).includes('/me/charts/positions'));
    expect(put).toBeDefined();
  });

  it('permite reordenar gráficos arrastrando de una posición a otra en DropZones', async () => {
    const user = userEvent.setup();
    await renderPanel();

    // Entrar en modo edición
    await user.click(screen.getByRole('button', { name: /Modo edición/i }));

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
    await renderPanel();

    // Entrar en modo edición
    await user.click(screen.getByRole('button', { name: /Modo edición/i }));

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

  it('muestra la zona de soltado destacada y al soltar abre el menú para elegir los datos antes de añadir el gráfico', async () => {
    const user = userEvent.setup();
    const fetchMock = mockMetricsApi();
    await renderPanel();

    // Abrir catálogo de widgets
    const paletteBtn = screen.getByRole('button', { name: /Abrir catálogo de widgets/i });
    fireEvent.click(paletteBtn);

    // Iniciar arrastre de widget DOUGHNUT
    const doughnutWidget = screen.getByTestId('widget-item-doughnut');
    fireEvent.dragStart(doughnutWidget, {
      clientX: 200,
      clientY: 300,
      dataTransfer: {
        setData: vi.fn(),
        effectAllowed: 'copy',
      },
    });

    // Se muestra la zona destacada de soltado con alta visibilidad
    const prominentDropZone = screen.getByTestId('prominent-drop-zone');
    expect(prominentDropZone).toBeDefined();
    expect(prominentDropZone.textContent).toContain('Zona Principal de Soltado Destacada');

    // Hover sobre la zona destacada
    fireEvent.dragOver(prominentDropZone, {
      dataTransfer: { dropEffect: 'copy' },
    });
    expect(prominentDropZone.textContent).toContain('¡Suelta aquí para configurar el gráfico!');

    // Soltar dentro de la zona destacada
    fireEvent.drop(prominentDropZone, {
      dataTransfer: {
        getData: () => JSON.stringify({ type: 'NEW_WIDGET', chartType: 'DOUGHNUT' }),
      },
    });

    // Soltar no añade nada todavía: primero se elige qué datos mostrar
    expect(screen.getAllByTestId(/^chart-card-/).length).toBe(3);
    expect(screen.getByText('Configurar gráfico')).toBeDefined();

    // El usuario elige una plantilla del servidor en el menú y confirma
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Préstamos por estado' }));
    await user.click(within(dialog).getByRole('button', { name: /Añadir al panel/i }));

    // El gráfico queda añadido en el lienzo (de 3 pasa a 4) y se visualiza
    await waitFor(() => expect(screen.getAllByTestId(/^chart-card-/).length).toBe(4));

    // Queda asociado a la plantilla elegida, no a la genérica de su forma
    const post = fetchMock.mock.calls.find(
      ([url, init]) => String(url).endsWith('/me/charts') && init?.method === 'POST',
    );
    expect(JSON.parse(String(post?.[1]?.body))).toMatchObject({
      chart_template_id: 10,
      entity: 'LOANS',
      group_by: 'status',
      type: 'DOUGHNUT',
    });
  });

  it('añade una plantilla del servidor con un clic y no permite repetirla', async () => {
    const user = userEvent.setup();
    const fetchMock = mockMetricsApi();
    await renderPanel();
    const posts = () =>
      fetchMock.mock.calls.filter(
        ([url, init]) => String(url).endsWith('/me/charts') && init?.method === 'POST',
      );

    await user.click(await screen.findByRole('button', { name: /Préstamos por estado/i }));
    await waitFor(() => expect(screen.getAllByTestId(/^chart-card-/).length).toBe(4));
    expect(JSON.parse(String(posts()[0]?.[1]?.body))).toEqual({ chart_template_id: 10 });

    // La plantilla ya está en el panel: su acceso directo queda deshabilitado
    const shortcut = screen.getByRole('button', { name: /Préstamos por estado/i }) as HTMLButtonElement;
    await waitFor(() => expect(shortcut.disabled).toBe(true));
    expect(shortcut.title).toContain('ya está en tu panel');
    fireEvent.click(shortcut);
    expect(posts().length).toBe(1);
    expect(screen.getAllByTestId(/^chart-card-/).length).toBe(4);

    // Las demás plantillas siguen disponibles
    expect(
      (screen.getByRole('button', { name: /Ranking de docentes/i }) as HTMLButtonElement).disabled,
    ).toBe(false);
  });

  it('un doble clic rápido sobre el mismo acceso directo crea un solo gráfico', async () => {
    const fetchMock = mockMetricsApi();
    await renderPanel();

    const shortcut = await screen.findByRole('button', { name: /Préstamos por estado/i });
    // Dos clics en el mismo tick: el botón aún no se ha deshabilitado
    fireEvent.click(shortcut);
    fireEvent.click(shortcut);

    await waitFor(() => expect(screen.getAllByTestId(/^chart-card-/).length).toBe(4));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(
      fetchMock.mock.calls.filter(
        ([url, init]) => String(url).endsWith('/me/charts') && init?.method === 'POST',
      ).length,
    ).toBe(1);
    expect(screen.getAllByTestId(/^chart-card-/).length).toBe(4);
  });

  it('respeta el máximo de 9 gráficos por plantilla', async () => {
    const user = userEvent.setup();
    const extra = [4, 5, 6, 7, 8, 9].map((n) =>
      fakeChart(n, n, `Equipos ${n}`, { entity: 'EQUIPMENT', metric: `M${n}`, timeRange: 'LAST_30_DAYS', chartType: 'BAR' }),
    );
    mockMetricsApi({ charts: [...seedCharts(), ...extra].slice(0, 7) });
    await renderPanel();
    expect(screen.getAllByTestId(/^chart-card-/).length).toBe(7);

    await user.click(await screen.findByRole('button', { name: /Préstamos por estado/i }));
    await waitFor(() => expect(screen.getAllByTestId(/^chart-card-/).length).toBe(8));
    await user.click(screen.getByRole('button', { name: /Ranking de docentes/i }));
    await waitFor(() => expect(screen.getAllByTestId(/^chart-card-/).length).toBe(9));

    expect(
      (screen.getByRole('button', { name: /Abrir catálogo de widgets/i }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('permite añadir gráficos desde el catálogo con el botón Añadir (queda guardado en el servidor)', async () => {
    const user = userEvent.setup();
    await renderPanel();
    expect(screen.getAllByTestId(/^chart-card-/).length).toBe(3);

    await user.click(screen.getByRole('button', { name: /Abrir catálogo de widgets/i }));
    const barWidget = screen.getByTestId('widget-item-bar');
    await user.click(within(barWidget).getByRole('button', { name: /Añadir/i }));

    // El botón abre el menú de configuración con Barras preseleccionado
    expect(screen.getAllByTestId(/^chart-card-/).length).toBe(3);
    expect(screen.getByRole('button', { name: 'Barras' }).getAttribute('aria-pressed')).toBe('true');
    await user.click(screen.getByRole('button', { name: /Añadir al panel/i }));
    await waitFor(() => expect(screen.getAllByTestId(/^chart-card-/).length).toBe(4));
  });

  it('oculta un gráfico (PATCH is_active) y lo recupera desde "Ocultos"', async () => {
    const user = userEvent.setup();
    const fetchMock = mockMetricsApi();
    await renderPanel();

    await user.click(screen.getAllByRole('button', { name: 'Ocultar gráfico' })[0]!);
    await waitFor(() => expect(screen.getAllByTestId(/^chart-card-/).length).toBe(2));

    const patch = fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH');
    expect(JSON.parse(String(patch?.[1]?.body))).toEqual({ is_active: false });

    const hidden = await screen.findByRole('region', { name: 'Gráficos ocultos' });
    await user.click(within(hidden).getByRole('button', { name: /Mostrar/i }));
    await waitFor(() => expect(screen.getAllByTestId(/^chart-card-/).length).toBe(3));
  });

  it('elimina un gráfico (DELETE) tras confirmar', async () => {
    const user = userEvent.setup();
    const fetchMock = mockMetricsApi();
    await renderPanel();

    await user.click(screen.getAllByRole('button', { name: 'Eliminar gráfico' })[0]!);
    await user.click(screen.getByRole('button', { name: 'Retirar gráfico' }));
    await waitFor(() => expect(screen.getAllByTestId(/^chart-card-/).length).toBe(2));
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(true);
  });
});
