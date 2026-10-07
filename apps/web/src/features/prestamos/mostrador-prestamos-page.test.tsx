import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { Prestamo, Producto } from '@sgia/types';

import MostradorPrestamosPage from './pages/mostrador-prestamos-page';

const mockProducts: Producto[] = [
  {
    id: 101,
    nombre: 'Multímetro Fluke 115',
    codigoBarras: 'FLUKE-115-01',
    stock: 5,
    stockCritico: 2,
    categoria: 'Instrumentación',
    area: 'Electrónica',
    activo: true,
    ubicacion: { id: 1, sala: 'Pañol Central', cajon: 'Gaveta G-01', descripcion: 'Estante A' },
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  },
  {
    id: 102,
    nombre: 'Cautín Weller 40W',
    codigoBarras: 'WELLER-40W-02',
    stock: 10,
    stockCritico: 3,
    categoria: 'Soldadura',
    area: 'Electrónica',
    activo: true,
    ubicacion: { id: 2, sala: 'Pañol Central', cajon: 'Gaveta G-02', descripcion: 'Estante A' },
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  },
];

const mockActiveLoans: Prestamo[] = [
  {
    id: 50,
    codigo: 'PREST-2026-050',
    solicitanteId: 20,
    usuarioId: 20,
    solicitanteNombre: 'Prof. Mario Valenzuela',
    solicitanteEmail: 'mario.valenzuela@inacap.cl',
    solicitanteRun: '12.345.678-9',
    tipo: 'DOCENTE',
    estado: 'ACTIVO',
    origen: 'PRESENCIAL',
    asignatura: 'Redes LAN',
    sala: 'Lab Redes 2',
    fechaSolicitud: '2026-10-07T09:00:00Z',
    items: [
      {
        id: 501,
        prestamoId: 50,
        productoId: 101,
        productoNombre: 'Multímetro Fluke 115',
        codigoBarras: 'FLUKE-115-01',
        cantidad: 1,
        devuelto: false,
      },
    ],
  },
];

const mockCheckoutMutateAsync = vi.fn();
const mockCheckinMutateAsync = vi.fn();
const mockRefetchLoans = vi.fn();

vi.mock('@sgia/api-client', () => ({
  useProducts: () => ({
    data: { data: mockProducts },
  }),
  useLoans: () => ({
    data: { data: mockActiveLoans },
    isLoading: false,
    refetch: mockRefetchLoans,
  }),
  useUsers: () => ({
    data: { data: [] },
  }),
  useCheckoutLoan: () => ({
    mutateAsync: mockCheckoutMutateAsync,
    isPending: false,
  }),
  useCheckinLoan: () => ({
    mutateAsync: mockCheckinMutateAsync,
    isPending: false,
  }),
}));

vi.mock('@/lib/toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

describe('REQ-10: Operación de Mostrador de Pañol (MostradorPrestamosPage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('permite escanear código de barras de ítem, ajustar cantidad y procesar checkout presencial', async () => {
    mockCheckoutMutateAsync.mockResolvedValueOnce({ id: 99, estado: 'ACTIVO' });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <MostradorPrestamosPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Mostrador de Pañol/i)).toBeDefined();

    // Fill teacher RUN
    const runInput = screen.getByPlaceholderText('12.345.678-9 o escanear credencial');
    await user.type(runInput, '14.567.890-1');

    // Fill docente name
    const docenteInput = screen.getByPlaceholderText('Ej. Profesor Carlos Rivera');
    await user.type(docenteInput, 'Prof. Roberto Carrasco');

    // Scan / enter barcode in auto-focus input
    const barcodeInput = screen.getByPlaceholderText('Dispara con pistola o escribe SKU + Enter…');
    await user.type(barcodeInput, 'FLUKE-115-01{Enter}');

    // Product should appear in the table
    expect(screen.getByText('Multímetro Fluke 115')).toBeDefined();
    expect(screen.getByText('FLUKE-115-01')).toBeDefined();

    // Confirm checkout button
    const checkoutButton = screen.getByRole('button', { name: /Registrar Entrega de Préstamo/i });
    expect(checkoutButton).toBeDefined();

    await user.click(checkoutButton);

    await waitFor(() => {
      expect(mockCheckoutMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          docente_run: '14.567.890-1',
          items: [
            expect.objectContaining({
              barcode: 'FLUKE-115-01',
              quantity: 1,
            }),
          ],
        })
      );
    });
  });

  it('permite seleccionar un préstamo activo, reportar daños y completar check-in / devolución', async () => {
    mockCheckinMutateAsync.mockResolvedValueOnce({ id: 50, estado: 'DEVUELTO' });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <MostradorPrestamosPage />
      </MemoryRouter>
    );

    // Switch to Devoluciones tab
    const devolucionTab = screen.getByText(/Devolución y Recepción/i);
    await user.click(devolucionTab);

    expect(screen.getByText('Buscar Préstamo Activo')).toBeDefined();
    expect(screen.getByText('Prof. Mario Valenzuela')).toBeDefined();

    // Select the loan to return
    const loanCard = screen.getByText('Prof. Mario Valenzuela');
    await user.click(loanCard);

    expect(screen.getByText('Verificación de Estado por Ítem')).toBeDefined();

    // Report damage toggle
    const reportDamageBtn = screen.getByText(/Reportar daño \/ falla/i);
    await user.click(reportDamageBtn);

    // Write damage notes
    const noteInput = screen.getByPlaceholderText(/Ej. Cable cortado, fusible quemado/i);
    await user.type(noteInput, 'Punta de prueba desoldada');

    // Complete check-in
    const completeReturnBtn = screen.getByRole('button', { name: /Completar Devolución e Ingresar a Pañol/i });
    await user.click(completeReturnBtn);

    await waitFor(() => {
      expect(mockCheckinMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          loan_id: 50,
          items: [
            expect.objectContaining({
              product_id: 101,
              damaged: true,
              notes: 'Punta de prueba desoldada',
            }),
          ],
        })
      );
    });
  });
});
