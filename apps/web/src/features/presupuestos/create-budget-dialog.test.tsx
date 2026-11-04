import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiRequestError } from '@sgia/api-client';

import { CreateBudgetDialog } from './components/create-budget-dialog';

const mockCreate = vi.fn();

vi.mock('@sgia/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sgia/api-client')>()),
  useCareers: () => ({
    data: {
      data: [{ id: 2, name: 'Ingeniería en Informática', code: 'ISD', level: 'profesional' }],
    },
  }),
  useCreateBudget: () => ({ mutateAsync: mockCreate, isPending: false }),
}));

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

describe('CreateBudgetDialog (REQ-16)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('valida en cliente antes de llamar a la API', async () => {
    const user = userEvent.setup();
    render(<CreateBudgetDialog open onClose={vi.fn()} defaultYear={2026} />);

    await user.click(screen.getByRole('button', { name: /crear presupuesto/i }));

    expect(await screen.findByText('Selecciona la carrera.')).toBeDefined();
    expect(screen.getByText('Ingresa el monto inicial.')).toBeDefined();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('envía carrera, año y monto, y muestra el 422 de duplicado en el campo', async () => {
    mockCreate.mockRejectedValueOnce(
      new ApiRequestError(422, {
        message: 'Ya existe un presupuesto para esa carrera y año.',
        errors: { career_id: ['Ya existe un presupuesto para esa carrera y año.'] },
      }),
    );
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CreateBudgetDialog open onClose={onClose} defaultYear={2026} />);

    await user.selectOptions(screen.getByLabelText('Carrera'), '2');
    await user.type(screen.getByLabelText('Monto inicial (CLP)'), '1500000');
    await user.click(screen.getByRole('button', { name: /crear presupuesto/i }));

    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith({
        career_id: 2,
        year: 2026,
        initial_amount: 1_500_000,
      }),
    );
    expect(
      await screen.findByText('Ya existe un presupuesto para esa carrera y año.'),
    ).toBeDefined();
    expect(onClose).not.toHaveBeenCalled();
  });
});
