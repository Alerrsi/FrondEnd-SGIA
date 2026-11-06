import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { MaintenanceCareerSummary } from './components/maintenance-career-summary';

const state = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
vi.mock('@sgia/api-client', () => ({ useMaintenanceSummary: () => state.value }));

const by = (en_curso: number, finalizada: number, anulada: number) => ({
  en_curso,
  finalizada,
  anulada,
});

describe('MaintenanceCareerSummary', () => {
  it('muestra total, desglose y fila Total con formato es-CL', () => {
    state.value = {
      isLoading: false,
      isError: false,
      data: {
        careers: [
          {
            career_id: 1,
            name: 'Ingeniería en Sistemas',
            code: 'ISD',
            total: 1200,
            by_status: by(2, 1197, 1),
            units: 40,
          },
          {
            career_id: null,
            name: 'Sin carrera',
            code: null,
            total: 0,
            by_status: by(0, 0, 0),
            units: 0,
          },
        ],
        total: { total: 1200, by_status: by(2, 1197, 1), units: 40 },
      },
    };
    render(<MaintenanceCareerSummary />);
    expect(screen.getByText('ISD')).toBeTruthy();
    expect(screen.getByText('Sin carrera')).toBeTruthy();
    expect(screen.getAllByText('1.200').length).toBe(2);
    expect(screen.getAllByText('1.197').length).toBe(2);
  });

  it('muestra vacío, carga y error', () => {
    state.value = {
      isLoading: false,
      isError: false,
      data: { careers: [], total: { total: 0, by_status: by(0, 0, 0), units: 0 } },
    };
    const { rerender } = render(<MaintenanceCareerSummary />);
    expect(screen.getByText(/Aún no hay mantenciones/)).toBeTruthy();
    state.value = { isLoading: true };
    rerender(<MaintenanceCareerSummary />);
    expect(screen.getByText(/Cargando resumen/)).toBeTruthy();
    state.value = { isLoading: false, isError: true };
    rerender(<MaintenanceCareerSummary />);
    expect(screen.getByText(/No se pudo cargar/)).toBeTruthy();
  });
});
