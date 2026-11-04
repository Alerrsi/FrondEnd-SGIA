import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { BudgetSummaryRow } from '@sgia/types';

import { BudgetSummaryGrid } from './components/budget-summary-grid';

function row(over: Partial<BudgetSummaryRow>): BudgetSummaryRow {
  return {
    id: 1,
    career_id: 1,
    career: { id: 1, name: 'Ingeniería en Informática', code: 'II', level: 'profesional' },
    year: 2026,
    initial_amount: 6_000_000,
    reserved_amount: 2_000_000,
    consumed_amount: 1_000_000,
    available_amount: 3_000_000,
    execution_percent: 50,
    ...over,
  } as BudgetSummaryRow;
}

const rows = [
  row({ id: 1 }),
  row({
    id: 2,
    career_id: 3,
    career: { id: 3, name: 'Analista Programador', code: 'AP', level: 'tecnico' },
  } as Partial<BudgetSummaryRow>),
];

const handlers = { onOpen: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() };

describe('BudgetSummaryGrid', () => {
  it('muestra una tarjeta por presupuesto, ordenadas por carrera', () => {
    render(<BudgetSummaryGrid rows={rows} canManage={false} {...handlers} />);
    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(2);
    expect(cards[0]?.textContent).toContain('Analista Programador');
    expect(cards[1]?.textContent).toContain('Ingeniería en Informática');
  });

  it('usa una grilla de hasta 3 columnas', () => {
    const { container } = render(
      <BudgetSummaryGrid rows={rows} canManage={false} {...handlers} />,
    );
    expect(container.firstElementChild?.className).toContain('lg:grid-cols-3');
  });

  it('abre el detalle al hacer clic en la tarjeta', async () => {
    const user = userEvent.setup();
    render(<BudgetSummaryGrid rows={rows} canManage={false} {...handlers} />);
    await user.click(screen.getByRole('article', { name: /Analista Programador/ }));
    expect(handlers.onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }));
  });

  it('solo muestra el menú de acciones a quien administra', () => {
    const { rerender } = render(<BudgetSummaryGrid rows={rows} canManage={false} {...handlers} />);
    expect(screen.queryByRole('button', { name: /Acciones de/ })).toBeNull();
    rerender(<BudgetSummaryGrid rows={rows} canManage {...handlers} />);
    expect(screen.getAllByRole('button', { name: /Acciones de/ })).toHaveLength(2);
  });

  it('muestra el estado vacío', () => {
    render(<BudgetSummaryGrid rows={[]} canManage {...handlers} />);
    expect(screen.getByText('No hay presupuestos para el año seleccionado.')).toBeDefined();
  });
});
