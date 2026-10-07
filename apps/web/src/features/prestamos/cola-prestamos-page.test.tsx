import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { Prestamo } from '@sgia/types';

import ColaPrestamosPage from './pages/cola-prestamos-page';

const mockPendingLoans: Prestamo[] = [
  {
    id: 1,
    codigo: 'SOL-2026-001',
    solicitanteId: 10,
    usuarioId: 10,
    solicitanteNombre: 'Prof. Carlos Rivera',
    solicitanteEmail: 'carlos.rivera@inacap.cl',
    solicitanteRun: '15.234.567-8',
    tipo: 'DOCENTE',
    estado: 'PENDIENTE',
    origen: 'REMOTO',
    asignatura: 'Redes Avanzadas CCNA',
    sala: 'Lab 102',
    bloqueHorario: '08:30 - 10:00',
    fechaSolicitud: '2026-10-07T08:00:00Z',
    items: [
      {
        id: 1,
        prestamoId: 1,
        productoId: 101,
        productoNombre: 'Router Cisco Catalyst 2960',
        nombre: 'Router Cisco Catalyst 2960',
        codigoBarras: 'CISCO-2960-01',
        cantidad: 2,
        devuelto: false,
        stockActual: 5,
        sala: 'Pañol Central',
        cajon: 'Rack R-01',
      },
      {
        id: 2,
        prestamoId: 1,
        productoId: 102,
        productoNombre: 'Cable Consola RJ45 a USB',
        nombre: 'Cable Consola RJ45 a USB',
        codigoBarras: 'CAB-CONS-02',
        cantidad: 2,
        devuelto: false,
        stockActual: 10,
        sala: 'Pañol Central',
        cajon: 'Cajón C-04',
      },
    ],
  },
  {
    id: 2,
    codigo: 'SOL-2026-002',
    solicitanteId: 12,
    usuarioId: 12,
    solicitanteNombre: 'Prof. Andrea Soto',
    solicitanteEmail: 'andrea.soto@inacap.cl',
    solicitanteRun: '17.890.123-4',
    tipo: 'DOCENTE',
    estado: 'PENDIENTE',
    origen: 'REMOTO',
    asignatura: 'Microcontroladores',
    sala: 'Taller Electrónica',
    bloqueHorario: '10:15 - 11:45',
    fechaSolicitud: '2026-10-07T09:30:00Z',
    items: [
      {
        id: 3,
        prestamoId: 2,
        productoId: 103,
        productoNombre: 'Osciloscopio Digital Rigol',
        nombre: 'Osciloscopio Digital Rigol',
        codigoBarras: 'OSC-RIGOL-01',
        cantidad: 1,
        devuelto: false,
        stockActual: 0,
        sala: 'Pañol Central',
        cajon: 'Estante E-02',
      },
    ],
  },
];

const mockAprobarMutateAsync = vi.fn();
const mockRechazarMutateAsync = vi.fn();
const mockRefetch = vi.fn();

vi.mock('@sgia/api-client', () => ({
  usePendingLoans: () => ({
    data: { data: mockPendingLoans },
    isLoading: false,
    isFetching: false,
    refetch: mockRefetch,
  }),
  useAprobarPrestamo: () => ({
    mutateAsync: mockAprobarMutateAsync,
    isPending: false,
  }),
  useRechazarPrestamo: () => ({
    mutateAsync: mockRechazarMutateAsync,
    isPending: false,
  }),
}));

vi.mock('@/lib/toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('REQ-10: Cola de Despacho de Solicitudes Remotas (ColaPrestamosPage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza la cola de solicitudes pendientes con datos del docente e ítems', () => {
    render(
      <MemoryRouter>
        <ColaPrestamosPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Cola de Despacho de Solicitudes Remotas')).toBeDefined();
    expect(screen.getByText('SOL-2026-001')).toBeDefined();
    expect(screen.getByText('Prof. Carlos Rivera')).toBeDefined();
    expect(screen.getByText('Redes Avanzadas CCNA')).toBeDefined();
    expect(screen.getByText('Router Cisco Catalyst 2960')).toBeDefined();
    expect(screen.getByText(/Rack R-01/)).toBeDefined();

    // Check second loan
    expect(screen.getByText('SOL-2026-002')).toBeDefined();
    expect(screen.getByText('Prof. Andrea Soto')).toBeDefined();
    expect(screen.getByText('Osciloscopio Digital Rigol')).toBeDefined();
  });

  it('permite aprobar y preparar una solicitud remota', async () => {
    mockAprobarMutateAsync.mockResolvedValueOnce({ id: 1, estado: 'PREPARADO' });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ColaPrestamosPage />
      </MemoryRouter>
    );

    const approveButtons = screen.getAllByRole('button', { name: /Aprobar \/ Preparar/i });
    expect(approveButtons.length).toBeGreaterThanOrEqual(1);

    await user.click(approveButtons[0]!);

    expect(mockAprobarMutateAsync).toHaveBeenCalledWith({ id: 1 });
  });

  it('abre el modal de rechazo, valida motivo obligatorio y envía el rechazo', async () => {
    mockRechazarMutateAsync.mockResolvedValueOnce({ id: 2, estado: 'RECHAZADA' });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ColaPrestamosPage />
      </MemoryRouter>
    );

    const rejectButtons = screen.getAllByRole('button', { name: /Rechazar/i });
    await user.click(rejectButtons[1]!); // Reject second loan

    expect(screen.getByText('Rechazar Solicitud Remota')).toBeDefined();
    expect(screen.getAllByText(/SOL-2026-002/i).length).toBeGreaterThanOrEqual(1);

    const submitRejectBtn = screen.getByRole('button', { name: /Confirmar Rechazo/i }) as HTMLButtonElement;
    expect(submitRejectBtn.disabled).toBe(true);

    const textarea = screen.getByPlaceholderText(/mantención preventiva|sin stock/i);
    await user.type(textarea, 'Sin stock disponible de osciloscopios en pañol');

    expect(submitRejectBtn.disabled).toBe(false);
    await user.click(submitRejectBtn);

    await waitFor(() => {
      expect(mockRechazarMutateAsync).toHaveBeenCalledWith({
        id: 2,
        payload: { rejection_reason: 'Sin stock disponible de osciloscopios en pañol' },
      });
    });
  });
});
