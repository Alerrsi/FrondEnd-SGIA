import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PrestamosMenuPage from './prestamos-menu-page';

vi.mock('@sgia/api-client', () => ({
  useLoans: () => ({
    data: {
      data: [],
      meta: { total: 0 },
    },
    isLoading: false,
  }),
}));

describe('PrestamosMenuPage (REQ-10)', () => {
  it('renders loan management hub cards properly', () => {
    render(
      <MemoryRouter>
        <PrestamosMenuPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Centro Operativo de Préstamos/i)).toBeDefined();
    expect(screen.getByText(/Mostrador y Devoluciones/i)).toBeDefined();
    expect(screen.getByText(/Cola de Solicitudes Remotas/i)).toBeDefined();
    expect(screen.getByText(/Historial y Auditoría/i)).toBeDefined();
  });
});
