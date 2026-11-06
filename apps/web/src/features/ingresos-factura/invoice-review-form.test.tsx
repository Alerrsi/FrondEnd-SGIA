import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiRequestError } from '@sgia/api-client';
import type { AnnualBudget, InvoiceIntake, Producto } from '@sgia/types';

import { InvoiceReviewForm } from './components/invoice-review-form';

const mockConfirm = vi.fn();
let mockRole = 'DIR-01';

vi.mock('@/features/auth/context/auth-context', () => ({
  useOptionalAuth: () => ({ user: { rol: mockRole } }),
}));

vi.mock('@sgia/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sgia/api-client')>()),
  useCajones: () => ({
    data: {
      data: [{ id: 7, codigo: 'CAJ-A2', location: { nombre: 'Pañol TI' } }],
    },
  }),
  useConfirmInvoiceIntake: () => ({
    mutateAsync: mockConfirm,
    isPending: false,
  }),
  usePurchases: () => ({ data: { data: [] } }),
  useCategories: () => ({ data: { data: [] } }),
  useCareers: () => ({ data: { data: [] } }),
  useCreateProducto: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const catalog = [
  { id: 1, nombre: 'Cable UTP Cat6', type: 'insumo' },
  { id: 2, nombre: 'Osciloscopio Rigol', type: 'equipo' },
] as Producto[];

const intake = {
  id: 5,
  annual_budget_id: 3,
  purchase_id: null,
  document_number: null,
  status: 'borrador',
  total_deducted: 0,
  has_file: true,
  user_id: 1,
  received_at: null,
  items: [],
  raw_ocr_payload: {
    invoice_number: 'F-881',
    supplier_name: 'Electro Sur',
    supplier_id: null,
    ocr_available: true,
    items: [
      { name: 'Cable UTP Cat6', quantity: 10, unit_price: 990 },
      { name: 'Osciloscopio Rigol', quantity: 2, unit_price: 350000 },
    ],
  },
} as InvoiceIntake;

const budget = {
  id: 3,
  career_id: 2,
  year: 2026,
  initial_amount: 1_000_000,
  available_amount: 800_000,
  free_amount: 800_000,
  reserved_amount: 0,
  consumed_amount: 200_000,
} as AnnualBudget;

describe('InvoiceReviewForm (REQ-17)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRole = 'DIR-01';
  });

  it('precarga los ítems del OCR, exige cajón al equipo y confirma con el payload correcto', async () => {
    mockConfirm.mockResolvedValueOnce({
      ...intake,
      status: 'confirmado',
      total_deducted: 709_900,
    });
    const user = userEvent.setup();
    render(
      <InvoiceReviewForm intake={intake} catalog={catalog} budget={budget} purchaseReserved={0} />,
    );

    expect((screen.getByLabelText('N° de factura') as HTMLInputElement).value).toBe('F-881');
    expect((screen.getByLabelText('Producto del ítem 1') as HTMLSelectElement).value).toBe('1');
    expect((screen.getByLabelText('Producto del ítem 2') as HTMLSelectElement).value).toBe('2');
    // Insumo: no pide cajón. Equipo: sí.
    expect(screen.queryByLabelText('Cajón del ítem 1')).toBeNull();

    await user.click(screen.getByRole('button', { name: /confirmar e ingresar stock/i }));
    expect(
      await screen.findByText('Los equipos y maquetas necesitan un cajón para crear sus unidades.'),
    ).toBeDefined();
    expect(mockConfirm).not.toHaveBeenCalled();

    await user.selectOptions(screen.getByLabelText('Cajón del ítem 2'), '7');
    await user.click(screen.getByRole('button', { name: /confirmar e ingresar stock/i }));

    await waitFor(() =>
      expect(mockConfirm).toHaveBeenCalledWith({
        id: 5,
        payload: {
          document_number: 'F-881',
          items: [
            {
              product_id: 1,
              quantity: 10,
              unit_price: 990,
              detected_name: 'Cable UTP Cat6',
            },
            {
              product_id: 2,
              quantity: 2,
              unit_price: 350000,
              detected_name: 'Osciloscopio Rigol',
              cajon_id: 7,
            },
          ],
        },
      }),
    );
  });

  it('avisa cuando el total supera el disponible', async () => {
    render(
      <InvoiceReviewForm
        intake={intake}
        catalog={catalog}
        budget={{ ...budget, free_amount: 100_000 }}
        purchaseReserved={0}
      />,
    );
    expect(await screen.findByRole('alert')).toBeDefined();
    expect(screen.getByRole('alert').textContent).toMatch(/supera lo libre/);
  });

  describe('exceso sobre el presupuesto (over_budget)', () => {
    const overBudgetError = () =>
      new ApiRequestError(422, {
        message: 'Excede',
        code: 'over_budget',
        over_by: '50000.00',
        free_amount: '100000.00',
        total: '150000.00',
      });
    const renderForm = () =>
      render(
        <InvoiceReviewForm
          intake={{
            ...intake,
            raw_ocr_payload: {
              ...intake.raw_ocr_payload,
              items: [{ name: 'Cable UTP Cat6', quantity: 10, unit_price: 990 }],
            },
          }}
          catalog={catalog}
          budget={budget}
          purchaseReserved={0}
        />,
      );
    const submit = (user: ReturnType<typeof userEvent.setup>) =>
      user.click(screen.getByRole('button', { name: /confirmar e ingresar stock/i }));

    it('DIR-01: alerta, luego cartel final y solo entonces reenvía con allow_over_budget', async () => {
      mockConfirm.mockRejectedValueOnce(overBudgetError());
      mockConfirm.mockResolvedValueOnce({ ...intake, status: 'confirmado', total_deducted: 150000 });
      const user = userEvent.setup();
      renderForm();
      await submit(user);

      await user.click(await screen.findByRole('button', { name: 'Continuar' }));
      // Tras el aviso 1 todavía no se reenvía.
      expect(mockConfirm).toHaveBeenCalledTimes(1);
      await user.click(
        await screen.findByRole('button', { name: 'Autorizar exceso y confirmar factura' }),
      );

      await waitFor(() => expect(mockConfirm).toHaveBeenCalledTimes(2));
      expect(mockConfirm.mock.calls[1]?.[0].payload.allow_over_budget).toBe(true);
      expect(mockConfirm.mock.calls[0]?.[0].payload.allow_over_budget).toBeUndefined();
    });

    it('DIR-01: cancelar en el aviso 1 no reenvía', async () => {
      mockConfirm.mockRejectedValueOnce(overBudgetError());
      const user = userEvent.setup();
      renderForm();
      await submit(user);
      await user.click(await screen.findByRole('button', { name: 'Cancelar' }));
      expect(mockConfirm).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('button', { name: 'Continuar' })).toBeNull();
    });

    it.each(['AD-01', 'PAN-01'])('%s: no ve la alerta y se le explica que solo DIR-01 autoriza', async (role) => {
      mockRole = role;
      mockConfirm.mockRejectedValueOnce(overBudgetError());
      const user = userEvent.setup();
      renderForm();
      await submit(user);
      expect(await screen.findByText(/Solo el director de carrera puede autorizar/)).toBeDefined();
      expect(screen.queryByRole('button', { name: 'Continuar' })).toBeNull();
      expect(mockConfirm).toHaveBeenCalledTimes(1);
    });
  });
});
