import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiRequestError } from '@sgia/api-client';
import type { InvoiceIntake } from '@sgia/types';

import { CancelInvoiceIntakeDialog } from './components/cancel-invoice-intake-dialog';

const mockCancel = vi.fn();

vi.mock('@sgia/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sgia/api-client')>()),
  useCancelInvoiceIntake: () => ({ mutateAsync: mockCancel, isPending: false }),
}));

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const confirmed = {
  id: 5,
  annual_budget_id: 3,
  purchase_id: null,
  document_number: 'F-881',
  status: 'confirmado',
  total_deducted: 709_900,
  has_file: true,
  user_id: 1,
  received_at: null,
  items: [],
  raw_ocr_payload: {
    invoice_number: null,
    supplier_name: null,
    supplier_id: null,
    items: [],
    ocr_available: true,
  },
} as InvoiceIntake;

describe('CancelInvoiceIntakeDialog (REQ-17)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('explica la reversa completa al anular una factura confirmada', () => {
    render(<CancelInvoiceIntakeDialog intake={confirmed} onClose={vi.fn()} />);
    expect(screen.getByText(/da de baja las unidades/i)).toBeDefined();
    expect(screen.getByRole('button', { name: 'Anular y revertir' })).toBeDefined();
  });

  it('muestra el 422 en items cuando la reversa no es posible y no cierra', async () => {
    const reason =
      'No se puede anular: la unidad PRO-ISD-000004 de Osciloscopio Rigol no está disponible o ya tiene préstamos.';
    mockCancel.mockRejectedValueOnce(
      new ApiRequestError(422, {
        message: reason,
        errors: { items: [reason] },
      }),
    );
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<CancelInvoiceIntakeDialog intake={confirmed} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Anular y revertir' }));

    expect(mockCancel).toHaveBeenCalledWith(5);
    expect((await screen.findByRole('alert')).textContent).toContain('PRO-ISD-000004');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('un borrador se anula sin efecto sobre stock', () => {
    render(
      <CancelInvoiceIntakeDialog intake={{ ...confirmed, status: 'borrador' }} onClose={vi.fn()} />,
    );
    expect(screen.getByText(/no se modifica stock ni presupuesto/i)).toBeDefined();
  });
});
