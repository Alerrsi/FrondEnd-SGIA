import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PrestamosMenuPage from './prestamos-menu-page';

const counts = vi.hoisted(() => ({ pending: 0, ready: 0, active: 0, overdue: 0 }));
const useLoans = vi.hoisted(() => vi.fn());
const usePendingLoans = vi.hoisted(() => vi.fn());

vi.mock('@sgia/api-client', () => ({ useLoans, usePendingLoans }));

const page = (total: number) => ({ data: { data: [], meta: { total } }, isLoading: false });

function renderHub(next: Partial<typeof counts>) {
  Object.assign(counts, { pending: 0, ready: 0, active: 0, overdue: 0 }, next);
  usePendingLoans.mockImplementation(() => page(counts.pending));
  useLoans.mockImplementation((params: { estado?: string }) => {
    if (params.estado === 'preparado') return page(counts.ready);
    if (params.estado === 'activo') return page(counts.active);
    if (params.estado === 'atrasado') return page(counts.overdue);
    return page(0);
  });
  return render(
    <MemoryRouter>
      <PrestamosMenuPage />
    </MemoryRouter>,
  );
}

describe('PrestamosMenuPage (REQ-10)', () => {
  it('renders loan management hub cards properly', () => {
    renderHub({});

    expect(screen.getByText(/Centro Operativo de Préstamos/i)).toBeDefined();
    expect(screen.getByText(/Mostrador y Devoluciones/i)).toBeDefined();
    expect(screen.getByText(/Cola de Solicitudes Remotas/i)).toBeDefined();
    expect(screen.getByText(/Historial y Auditoría/i)).toBeDefined();
    expect(screen.getByText('Al día')).toBeDefined();
  });

  it('dice qué cuenta cada número', () => {
    renderHub({ pending: 1, ready: 2, active: 4, overdue: 3 });

    expect(screen.getByText(/Entregados sin devolver:/).textContent).toBe('Entregados sin devolver: 4 · 3 vencidos');
    expect(screen.getByText(/por revisar/).textContent).toBe('1 por revisar');
    expect(screen.getByText(/Aprobadas, esperando retiro:/).textContent).toBe('Aprobadas, esperando retiro: 2');
    expect(screen.getByText(/sin devolver$/).textContent).toBe('3 vencidos sin devolver');
  });

  it('la cola cuenta solo las solicitudes remotas (misma consulta que la cola)', () => {
    renderHub({ pending: 1 });

    expect(usePendingLoans).toHaveBeenCalledWith({ per_page: 1 });
    expect(useLoans).toHaveBeenCalledWith({ estado: 'preparado', tipo: 'remoto', per_page: 1 });
    expect(useLoans).not.toHaveBeenCalledWith(expect.objectContaining({ estado: 'pendiente' }));
  });

  it('sin atrasos no muestra el vencido ni el aviso rojo', () => {
    renderHub({ active: 2, overdue: 0 });

    expect(screen.getByText(/Entregados sin devolver:/).textContent).toBe('Entregados sin devolver: 2');
    expect(screen.queryByText(/vencido/)).toBeNull();
  });
});
