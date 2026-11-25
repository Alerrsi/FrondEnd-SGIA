import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { MaintenanceRecordQueryParams } from '@sgia/types';

import MantencionesPage from './pages/mantenciones-page';

const by = (en_curso: number, finalizada: number, anulada: number) => ({ en_curso, finalizada, anulada });

const state = vi.hoisted(() => ({
  summary: {} as Record<string, unknown>,
  dueTotal: 2,
  recordCalls: [] as MaintenanceRecordQueryParams[],
  exportReport: (() => undefined) as (...args: unknown[]) => unknown,
}));

const SUMMARY = {
  careers: [
    { career_id: 1, name: 'Analista Programador', code: 'AP', total: 4, by_status: by(1, 3, 0), units: 4 },
    { career_id: 2, name: 'Ingeniería en Ciberseguridad', code: 'IC', total: 2, by_status: by(0, 1, 1), units: 2 },
    { career_id: 3, name: 'Ingeniería en Informática', code: 'II', total: 0, by_status: by(0, 0, 0), units: 0 },
    { career_id: null, name: 'Sin carrera', code: null, total: 1, by_status: by(1, 0, 0), units: 1 },
  ],
  total: { total: 7, by_status: by(2, 4, 1), units: 7 },
};

const RECORD = {
  id: 50,
  equipment_unit_id: 9,
  equipment_unit: { id: 9, code: 'EQP-AP-000014', status: 'en_reparacion', product_id: 1, product: { id: 1, name: 'Kit Arduino Uno R3', maintenance_priority: 'A' } },
  maintenance_type: 'calibracion',
  execution_mode: 'medios_propios',
  status: 'en_curso',
  started_at: '2026-10-23',
  responsible: { id: 2, name: 'Pañolero' },
};

vi.mock('@sgia/api-client', () => ({
  // Botón «Exportar Excel» (docs/reportes-excel.md).
  hasReportFilters: () => false,
  useExportReport: () => ({ mutateAsync: state.exportReport, isPending: false }),
  useMaintenanceSummary: () => state.summary,
  useEquipmentUnits: () => ({
    data: { data: [{ id: 1, code: 'EQP-AP-000007' }, { id: 2, code: 'MAQ-ISD-000004' }].slice(0, state.dueTotal), meta: { total: state.dueTotal } },
  }),
  useMaintenanceRecords: (params: MaintenanceRecordQueryParams) => {
    state.recordCalls.push(params);
    return { data: { data: [RECORD], meta: { currentPage: 1, lastPage: 1, total: 1 } }, isLoading: false, isError: false, refetch: vi.fn() };
  },
}));

vi.mock('@/features/equipos/utils/download', () => ({ downloadBlob: vi.fn() }));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() } }));

vi.mock('@/features/mantenciones/components/maintenance-checklist-sheet', () => ({
  MaintenanceChecklistSheet: ({ recordId }: { recordId: number | null }) => <div data-testid="checklist">{recordId ?? ''}</div>,
}));

const lastCall = () => state.recordCalls.at(-1)!;

function renderPage() {
  return render(
    <MemoryRouter>
      <MantencionesPage />
    </MemoryRouter>,
  );
}

describe('MantencionesPage (docs/mantenciones-por-carrera.md)', () => {
  beforeEach(() => {
    state.summary = { data: SUMMARY, isLoading: false, isError: false, refetch: vi.fn() };
    state.dueTotal = 2;
    state.recordCalls = [];
    state.exportReport = vi.fn().mockResolvedValue({ blob: new Blob(['PK']), filename: 'm.xlsx', truncated: false });
  });

  it('muestra las cifras neutras, el aviso de vencidas y una fila por carrera con su barra', () => {
    renderPage();

    const resumen = screen.getByLabelText('Resumen de mantenciones');
    const enCurso = within(resumen).getByText('En curso').nextSibling as HTMLElement;
    expect(enCurso.textContent).toBe('2');
    // Sin color de estado (docs/mantenciones-por-carrera.md, decisión 8).
    expect(enCurso.className).not.toMatch(/text-(warn|ok)/);
    expect(within(resumen).getByText('Vencidas sin enviar').nextSibling?.textContent).toBe('2');

    const aviso = screen.getByRole('region', { name: 'Unidades con mantención vencida' });
    expect(within(aviso).getByText('2 unidades con la mantención vencida')).toBeDefined();
    expect(within(aviso).getByText('MAQ-ISD-000004')).toBeDefined();
    expect(aviso.className).not.toMatch(/warn/);

    const carreras = screen.getByRole('list', { name: 'Carreras' });
    const filas = within(carreras).getAllByRole('button');
    // «Todas», las que tienen mantenciones y al final las que no.
    expect(filas.map((b) => b.title || b.textContent?.slice(0, 20))).toEqual([
      'Todas las carreras7',
      'Analista Programador',
      'Ingeniería en Ciberseguridad',
      'Sin carrera',
      'Ingeniería en Informática',
    ]);
    const ap = filas[1]!;
    expect(ap.textContent).toContain('1 en curso');
    expect(ap.textContent).toContain('1 en curso, 3 finalizadas, 0 anuladas, 4 unidades');
    // Barra proporcional a la carrera con más mantenciones (4), en burdeo y grises.
    const enCursoBar = ap.querySelector('[data-segment="en_curso"]') as HTMLElement;
    expect(enCursoBar.style.width).toBe('25%');
    expect(enCursoBar.className).toContain('bg-accent');
    const finBar = ap.querySelector('[data-segment="finalizada"]') as HTMLElement;
    expect(finBar.style.width).toBe('75%');
    expect(finBar.className).toContain('bg-zinc-400');
    expect(carreras.innerHTML).not.toMatch(/bg-(warn|ok)\b/);
    // Sin mantenciones en curso: «Al día»; sin ninguna: sin barra.
    expect(filas[2]!.textContent).toContain('Al día');
    expect(filas[4]!.querySelector('[data-segment]')).toBeNull();
  });

  it('elegir una carrera filtra la bandeja; volver a tocarla o «Todas las carreras» lo quita', async () => {
    const user = userEvent.setup();
    renderPage();
    expect(lastCall()).toEqual({ status: 'en_curso', maintenance_type: undefined, page: 1, per_page: 20 });
    const todas = screen.getByRole('button', { name: /^Todas las carreras/ });
    expect(todas.getAttribute('aria-pressed')).toBe('true');

    const ap = screen.getByRole('button', { name: /Analista Programador/ });
    await user.click(ap);
    expect(ap.getAttribute('aria-pressed')).toBe('true');
    expect(todas.getAttribute('aria-pressed')).toBe('false');
    expect(lastCall()).toMatchObject({ career_id: 1, status: 'en_curso' });
    expect(screen.getByRole('heading', { name: 'Bandeja · AP · Analista Programador' })).toBeDefined();

    await user.click(ap);
    expect(ap.getAttribute('aria-pressed')).toBe('false');
    expect(lastCall().career_id).toBeUndefined();

    await user.click(screen.getByRole('button', { name: /Sin carrera/ }));
    expect(lastCall()).toMatchObject({ sin_carrera: true });
    await user.click(todas);
    expect(lastCall().sin_carrera).toBeUndefined();
    expect(screen.getByRole('heading', { name: 'Bandeja' })).toBeDefined();

    await user.click(screen.getByRole('button', { name: /Ciberseguridad/ }));
    await user.click(screen.getByRole('button', { name: 'Ver todas las carreras' }));
    expect(lastCall().career_id).toBeUndefined();
  });

  it('filtra por estado y abre el checklist de una fila', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Finalizadas' }));
    expect(lastCall()).toMatchObject({ status: 'finalizada' });
    await user.click(screen.getByRole('button', { name: 'Todas' }));
    expect(lastCall().status).toBeUndefined();

    await user.click(screen.getByRole('row', { name: 'Abrir mantención de EQP-AP-000014' }));
    expect(screen.getByTestId('checklist').textContent).toBe('50');
  });

  it('«Exportar Excel» envía el estado, el tipo y la carrera de la bandeja (docs/reportes-excel.md)', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Finalizadas' }));
    await user.click(screen.getByRole('button', { name: /Analista Programador/ }));
    await user.click(screen.getByRole('button', { name: 'Exportar Excel' }));

    expect(state.exportReport).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/maintenance-records/export',
        params: { status: 'finalizada', maintenance_type: undefined, career_id: 1 },
      }),
    );
  });

  it('sin unidades vencidas no muestra el aviso; con el resumen caído muestra error', () => {
    state.dueTotal = 0;
    state.summary = { data: undefined, isLoading: false, isError: true, refetch: vi.fn() };
    renderPage();
    expect(screen.queryByRole('region', { name: 'Unidades con mantención vencida' })).toBeNull();
    expect(screen.getByText('No se pudo cargar el resumen por carrera.')).toBeDefined();
  });
});
