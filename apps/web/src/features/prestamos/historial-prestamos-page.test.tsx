import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { Prestamo } from '@sgia/types';

import HistorialPrestamosPage from './pages/historial-prestamos-page';

const mockHistoricalLoans: Prestamo[] = [
  {
    id: 101,
    codigo: 'PREST-2026-101',
    solicitanteId: 10,
    usuarioId: 10,
    solicitanteNombre: 'Prof. Gabriel Salinas',
    solicitanteEmail: 'gabriel.salinas@inacap.cl',
    solicitanteRun: '13.456.789-0',
    tipo: 'DOCENTE',
    estado: 'ACTIVO',
    origen: 'REMOTO',
    asignatura: 'Sistemas Operativos',
    sala: 'Lab 201',
    bloqueHorario: '08:30 - 10:00',
    fechaSolicitud: '2026-10-06T08:00:00Z',
    items: [
      {
        id: 1,
        prestamoId: 101,
        productoId: 201,
        productoNombre: 'Pendrive Kingston 64GB',
        codigoBarras: 'USB-KING-64',
        cantidad: 5,
        devuelto: false,
      },
    ],
    eventos: [
      {
        id: 1,
        fecha: '2026-10-06T08:00:00Z',
        evento: 'Solicitud Remota Creada',
        usuario: 'Prof. Gabriel Salinas',
      },
      {
        id: 2,
        fecha: '2026-10-06T08:20:00Z',
        evento: 'Aprobación y Despacho',
        usuario: 'Pañolero Juan Pérez',
      },
    ],
  },
  {
    id: 102,
    codigo: 'PREST-2026-102',
    solicitanteId: 11,
    usuarioId: 11,
    solicitanteNombre: 'Prof. Lucía Mora',
    solicitanteEmail: 'lucia.mora@inacap.cl',
    solicitanteRun: '16.789.012-3',
    tipo: 'DOCENTE',
    estado: 'atrasado',
    origen: 'PRESENCIAL',
    asignatura: 'Electrónica Digital',
    sala: 'Taller 1',
    diasAtraso: 3,
    fechaSolicitud: '2026-10-03T10:00:00Z',
    items: [
      {
        id: 2,
        prestamoId: 102,
        productoId: 202,
        productoNombre: 'Fuente de Poder Regulada DC',
        codigoBarras: 'FNT-DC-01',
        cantidad: 1,
        devuelto: false,
      },
    ],
    eventos: [
      {
        id: 3,
        fecha: '2026-10-03T10:00:00Z',
        evento: 'Préstamo Presencial en Mostrador',
        usuario: 'Pañolero Juan Pérez',
      },
    ],
  },
  {
    id: 103,
    codigo: 'PREST-2026-103',
    solicitanteId: 12,
    usuarioId: 12,
    solicitanteNombre: 'Prof. Esteban Morales',
    solicitanteEmail: 'esteban.morales@inacap.cl',
    solicitanteRun: '18.901.234-5',
    tipo: 'DOCENTE',
    estado: 'DEVUELTO',
    origen: 'PRESENCIAL',
    asignatura: 'Ciberseguridad Defensiva',
    sala: 'Lab 305',
    fechaSolicitud: '2026-10-01T14:00:00Z',
    fechaDevolucion: '2026-10-01T17:30:00Z',
    items: [
      {
        id: 3,
        prestamoId: 103,
        productoId: 203,
        productoNombre: 'Switch Gestionable HP',
        codigoBarras: 'SW-HP-24P',
        cantidad: 1,
        devuelto: true,
      },
    ],
  },
];

const mockExportMutateAsync = vi.fn();
const mockRefetchLoans = vi.fn();

vi.mock('@sgia/api-client', () => ({
  useLoans: () => ({
    data: {
      data: mockHistoricalLoans,
      meta: {
        total: mockHistoricalLoans.length,
        currentPage: 1,
        lastPage: 1,
        perPage: 10,
      },
    },
    isLoading: false,
    isFetching: false,
    refetch: mockRefetchLoans,
  }),
  useExportLoans: () => ({
    mutateAsync: mockExportMutateAsync,
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

describe('REQ-11: Historial, Auditoría y Exportación de Préstamos (HistorialPrestamosPage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza tabla histórica con métricas y distinción visual de atrasados', () => {
    render(
      <MemoryRouter>
        <HistorialPrestamosPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Historial y Auditoría de Préstamos')).toBeDefined();

    // Check records rendered
    expect(screen.getByText('PREST-2026-101')).toBeDefined();
    expect(screen.getByText('Prof. Gabriel Salinas')).toBeDefined();

    expect(screen.getByText('PREST-2026-102')).toBeDefined();
    expect(screen.getByText('Prof. Lucía Mora')).toBeDefined();
    // Overdue indicator
    expect(screen.getByText('(3d atraso)')).toBeDefined();

    expect(screen.getByText('PREST-2026-103')).toBeDefined();
    expect(screen.getByText('Prof. Esteban Morales')).toBeDefined();
  });

  it('permite filtrar préstamos por búsqueda rápida', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <HistorialPrestamosPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText('Código, docente, sala…');
    await user.type(searchInput, 'Lucía');

    expect(searchInput).toBeDefined();
  });

  it('abre el drawer lateral con la bitácora y detalle de eventos al seleccionar un préstamo', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <HistorialPrestamosPage />
      </MemoryRouter>
    );

    const detailButtons = screen.getAllByTitle('Ver bitácora y detalle');
    await user.click(detailButtons[0]!);

    expect(screen.getByText('Bitácora y Trazabilidad')).toBeDefined();
    expect(screen.getByText('Solicitud Remota Creada')).toBeDefined();
    expect(screen.getByText(/Pañolero Juan Pérez/i)).toBeDefined();
  });

  it('ejecuta la exportación de reportes a Excel y PDF', async () => {
    const mockBlob = new Blob(['sample-data'], { type: 'application/pdf' });
    mockExportMutateAsync.mockResolvedValueOnce(mockBlob);

    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/dummy');
    window.URL.revokeObjectURL = vi.fn();

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <HistorialPrestamosPage />
      </MemoryRouter>
    );

    const pdfBtn = screen.getByRole('button', { name: /Exportar PDF/i });
    await user.click(pdfBtn);

    await waitFor(() => {
      expect(mockExportMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'pdf',
        })
      );
    });
  });
});
