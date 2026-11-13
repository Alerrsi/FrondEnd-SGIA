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
  it('muestra tarjetas de totales, barra por carrera y agrupa las carreras sin registros', () => {
    state.value = {
      isLoading: false,
      isError: false,
      data: {
        careers: [
          { career_id: 1, name: 'Ingeniería en Sistemas', code: 'ISD', total: 1200, by_status: by(2, 1197, 1), units: 40 },
          { career_id: 2, name: 'Informática', code: 'II', total: 0, by_status: by(0, 0, 0), units: 0 },
          { career_id: null, name: 'Sin carrera', code: null, total: 0, by_status: by(0, 0, 0), units: 0 },
        ],
        total: { total: 1200, by_status: by(2, 1197, 1), units: 40 },
      },
    };
    render(<MaintenanceCareerSummary />);

    // Tarjetas con formato es-CL
    expect(screen.getAllByText('1.200').length).toBe(2); // tarjeta Total + total de la carrera
    expect(screen.getByText('1.197')).toBeTruthy();
    expect(screen.getByText('Unidades distintas')).toBeTruthy();

    // Barra con el desglose accesible
    const bar = screen.getByRole('img', { name: /Ingeniería en Sistemas: En curso: 2 · Finalizada: 1\.197 · Anulada: 1/ });
    expect(bar).toBeTruthy();

    // Las carreras sin mantenciones no ocupan fila
    expect(screen.getByText('Sin registros: II, Sin carrera')).toBeTruthy();
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
