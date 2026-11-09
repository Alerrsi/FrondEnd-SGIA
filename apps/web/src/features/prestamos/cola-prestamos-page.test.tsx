import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { LoanReview, LoanReviewUnit, Prestamo } from '@sgia/types';

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

// Solicitud ampliada: horario, laboratorio y pañol.
mockPendingLoans.push({
  id: 3,
  codigo: 'SOL-2026-003',
  estado: 'pendiente',
  origen: 'remoto',
  asignatura: 'Redes de Computadores',
  career_id: 3,
  career: { id: 3, name: 'Ingeniería en Informática', code: 'II' },
  loan_date: '2026-11-12',
  start_time: '08:30',
  end_time: '10:00',
  storeroom_id: 1,
  storeroom: { id: 1, name: 'Pañol Temuco', code: 'PAN-TEMUCO' },
  location_id: 12,
  location: { id: 12, nombre: 'Laboratorio de Redes', tipo: 'sala' },
  teacher: { id: 7, name: 'Ana Docente' },
  items: [],
} as Prestamo);

function unit(id: number, code: string, sala: string, cajon: string): LoanReviewUnit {
  return {
    id,
    code,
    serial_number: `SN-${id}`,
    status: 'disponible',
    cajon: { id: id * 10, codigo: cajon, descripcion: null },
    location: { id: id * 100, nombre: sala, tipo: 'sala', storeroom_id: 1 },
  };
}

const routerA = unit(301, 'EQP-IC-000014', 'Laboratorio de Redes', 'C-02');
const routerB = unit(302, 'EQP-IC-000015', 'Bodega de Redes', 'C-04');
const routerC = unit(305, 'EQP-IC-000018', 'Sala de Respaldo', 'C-09');

const mockReview: LoanReview = {
  loan_id: 1,
  code: 'SOL-2026-001',
  status: 'pendiente',
  storeroom: { id: 1, name: 'Pañol Temuco' },
  can_approve: true,
  items: [
    {
      item_id: 1,
      product_id: 101,
      name: 'Router Cisco Catalyst 2960',
      quantity: 2,
      has_units: true,
      available_quantity: 3,
      shortage: 0,
      location: null,
      cajon: null,
      suggested_units: [routerA, routerB],
      available_units: [routerB, routerA, routerC],
    },
    {
      item_id: 2,
      product_id: 102,
      name: 'Cable Consola RJ45 a USB',
      quantity: 2,
      has_units: false,
      available_quantity: 10,
      shortage: 0,
      location: { id: 12, nombre: 'Pañol Central', tipo: 'sala', storeroom_id: 1 },
      cajon: { id: 4, codigo: 'C-04', descripcion: null },
      suggested_units: [],
      available_units: [],
    },
  ],
};

const mockAuth = vi.hoisted(() => ({ rol: 'PAN-01' }));
const mockUsePendingLoans = vi.fn();

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({ user: { id: 1, nombre: 'Usuario', rol: mockAuth.rol } }),
}));

const mockAprobarMutateAsync = vi.fn();
const mockRechazarMutateAsync = vi.fn();
const mockRefetch = vi.fn();
const mockReviewRefetch = vi.fn();
const mockUseLoanReview = vi.fn();
const reviewState = vi.hoisted(() => ({
  data: undefined as unknown,
  error: null as unknown,
  isLoading: false,
}));
const apiErrors = vi.hoisted(() => {
  class ApiRequestError extends Error {
    status: number;
    body: { message?: string; errors?: Record<string, string[]> } | null;
    constructor(status: number, body: { message?: string } | null) {
      super(body?.message ?? `Error ${status}`);
      this.status = status;
      this.body = body;
    }
  }
  return { ApiRequestError };
});

vi.mock('@sgia/api-client', () => ({
  ApiRequestError: apiErrors.ApiRequestError,
  useLoanReview: (id: number | undefined) => {
    mockUseLoanReview(id);
    return {
      data: id === undefined ? undefined : reviewState.data,
      error: id === undefined ? null : reviewState.error,
      isLoading: id !== undefined && reviewState.isLoading,
      isFetching: false,
      refetch: mockReviewRefetch,
    };
  },
  usePendingLoans: (params: unknown) => {
    mockUsePendingLoans(params);
    return {
      data: { data: mockPendingLoans },
      isLoading: false,
      isFetching: false,
      refetch: mockRefetch,
    };
  },
  useStorerooms: () => ({
    data: { data: [{ id: 1, name: 'Pañol Temuco', code: 'PAN-TEMUCO' }] },
    isLoading: false,
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

function renderPage() {
  return render(
    <MemoryRouter>
      <ColaPrestamosPage />
    </MemoryRouter>,
  );
}

async function openReview(user: ReturnType<typeof userEvent.setup>) {
  renderPage();
  await user.click(screen.getByRole('button', { name: 'Revisar solicitud SOL-2026-001' }));
  return screen.findByRole('dialog');
}

const ROUTER = 'Router Cisco Catalyst 2960';

async function scanCodes(user: ReturnType<typeof userEvent.setup>, codes: string[]) {
  await user.click(screen.getByRole('button', { name: `Cambiar elementos de ${ROUTER}` }));
  for (const code of codes) {
    await user.type(screen.getByLabelText('Código de la unidad'), `${code}{Enter}`);
  }
}

describe('REQ-10: Cola de Despacho de Solicitudes Remotas (ColaPrestamosPage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.rol = 'PAN-01';
    reviewState.data = mockReview;
    reviewState.error = null;
    reviewState.isLoading = false;
  });

  it('renderiza la cola de solicitudes pendientes con datos del docente e ítems', () => {
    render(
      <MemoryRouter>
        <ColaPrestamosPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Cola de Despacho de Solicitudes Remotas')).toBeDefined();
    expect(screen.getByText('SOL-2026-001')).toBeDefined();
    expect(screen.getByText('Prof. Carlos Rivera')).toBeDefined();
    expect(screen.getByText('Asignatura: Redes Avanzadas CCNA · Carrera: —')).toBeDefined();
    expect(
      screen.getByText('Asignatura: Redes de Computadores · Carrera: Ingeniería en Informática'),
    ).toBeDefined();
    expect(screen.getByText('Router Cisco Catalyst 2960')).toBeDefined();
    expect(screen.getByText(/Rack R-01/)).toBeDefined();

    // Check second loan
    expect(screen.getByText('SOL-2026-002')).toBeDefined();
    expect(screen.getByText('Prof. Andrea Soto')).toBeDefined();
    expect(screen.getByText('Osciloscopio Digital Rigol')).toBeDefined();
  });

  it('la tarjeta ofrece Revisar en lugar de aprobar directamente', () => {
    renderPage();

    expect(screen.getAllByRole('button', { name: /Revisar solicitud/i }).length).toBe(3);
    expect(screen.queryByRole('button', { name: /Aprobar \/ Preparar/i })).toBeNull();
    expect(mockUseLoanReview).toHaveBeenLastCalledWith(undefined);
  });

  it('abre el modal de rechazo, valida motivo obligatorio y envía el rechazo', async () => {
    mockRechazarMutateAsync.mockResolvedValueOnce({
      id: 2,
      estado: 'RECHAZADA',
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ColaPrestamosPage />
      </MemoryRouter>,
    );

    const rejectButtons = screen.getAllByRole('button', { name: /Rechazar/i });
    await user.click(rejectButtons[1]!); // Reject second loan

    expect(screen.getByText('Rechazar Solicitud Remota')).toBeDefined();
    expect(screen.getAllByText(/SOL-2026-002/i).length).toBeGreaterThanOrEqual(1);

    const submitRejectBtn = screen.getByRole('button', {
      name: /Confirmar Rechazo/i,
    }) as HTMLButtonElement;
    expect(submitRejectBtn.disabled).toBe(true);

    const textarea = screen.getByPlaceholderText(/mantención preventiva|sin stock/i);
    await user.type(textarea, 'Sin stock disponible de osciloscopios en pañol');

    expect(submitRejectBtn.disabled).toBe(false);
    await user.click(submitRejectBtn);

    await waitFor(() => {
      expect(mockRechazarMutateAsync).toHaveBeenCalledWith({
        id: 2,
        payload: {
          rejection_reason: 'Sin stock disponible de osciloscopios en pañol',
        },
      });
    });
  });

  it('muestra fecha, horario, laboratorio, pañol, carrera y profesor de cada solicitud', () => {
    render(
      <MemoryRouter>
        <ColaPrestamosPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Ana Docente')).toBeDefined();
    expect(screen.getByText('12-11-2026 · 08:30 - 10:00')).toBeDefined();
    expect(screen.getByText('Laboratorio de Redes')).toBeDefined();
    expect(screen.getByText('Pañol Temuco')).toBeDefined();
    expect(screen.getByText(/Ingeniería en Informática/)).toBeDefined();
    // Solicitudes antiguas: el texto libre del bloque y la sala.
    expect(screen.getByText('08:30 - 10:00')).toBeDefined();
    expect(screen.getByText('Lab 102')).toBeDefined();
  });

  it('el pañolero no ve el filtro de pañol: el backend le muestra solo su cola', () => {
    render(
      <MemoryRouter>
        <ColaPrestamosPage />
      </MemoryRouter>,
    );

    expect(screen.queryByLabelText('Filtro de pañol')).toBeNull();
    expect(mockUsePendingLoans).toHaveBeenLastCalledWith(undefined);
  });

  it('el administrador filtra la cola por pañol', async () => {
    mockAuth.rol = 'AD-01';
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ColaPrestamosPage />
      </MemoryRouter>,
    );

    await user.selectOptions(screen.getByLabelText('Filtro de pañol'), '1');
    expect(mockUsePendingLoans).toHaveBeenLastCalledWith({ storeroom_id: 1 });
  });

  describe('Revisión de la solicitud', () => {
    it('Revisar despliega los detalles, la propuesta y la ubicación de cada unidad', async () => {
      const user = userEvent.setup();
      const dialog = await openReview(user);

      expect(mockUseLoanReview).toHaveBeenLastCalledWith(1);
      expect(within(dialog).getByText('Prof. Carlos Rivera')).toBeDefined();
      expect(within(dialog).getByText('Redes Avanzadas CCNA')).toBeDefined();

      const row = within(within(dialog).getByTestId('unidad-EQP-IC-000014'));
      expect(row.getByText('N/S: SN-301')).toBeDefined();
      expect(row.getByText(/Laboratorio de Redes/)).toBeDefined();
      expect(row.getByText('C-02')).toBeDefined();
      expect(within(dialog).getByTestId('unidad-EQP-IC-000015')).toBeDefined();
    });

    it('ordena las unidades por sala y cajón', async () => {
      const user = userEvent.setup();
      const dialog = await openReview(user);

      const rows = within(dialog).getAllByTestId(/^unidad-/);
      expect(rows.map((row) => row.dataset.testid)).toEqual([
        'unidad-EQP-IC-000015',
        'unidad-EQP-IC-000014',
      ]);
    });

    it('el insumo muestra su ubicación sin Cambiar elementos', async () => {
      const user = userEvent.setup();
      const dialog = await openReview(user);

      const insumo = within(within(dialog).getByRole('region', { name: 'Cable Consola RJ45 a USB' }));
      expect(insumo.getByText(/Pañol Central/)).toBeDefined();
      expect(insumo.getByText('C-04')).toBeDefined();
      expect(insumo.queryByRole('button', { name: /Cambiar/ })).toBeNull();
    });

    it('los elementos solo cambian si el pañol lo pide: el panel de escaneo parte cerrado', async () => {
      const user = userEvent.setup();
      const dialog = await openReview(user);

      expect(within(dialog).queryByLabelText('Código de la unidad')).toBeNull();
      expect(within(dialog).getByTestId('unidad-EQP-IC-000014')).toBeDefined();
      expect(within(dialog).getByTestId('unidad-EQP-IC-000015')).toBeDefined();
    });

    it('al escanear la cantidad solicitada reemplaza los elementos y muestra su ubicación', async () => {
      const user = userEvent.setup();
      const dialog = await openReview(user);

      await scanCodes(user, ['  eqp-ic-000018 ', 'EQP-IC-000015']);

      expect(within(dialog).queryByLabelText('Código de la unidad')).toBeNull();
      expect(within(dialog).queryByTestId('unidad-EQP-IC-000014')).toBeNull();
      const row = within(within(dialog).getByTestId('unidad-EQP-IC-000018'));
      expect(row.getByText(/Sala de Respaldo/)).toBeDefined();
      expect(row.getByText('C-09')).toBeDefined();
      expect(row.getByText('Cambiada')).toBeDefined();
      expect(
        within(within(dialog).getByTestId('unidad-EQP-IC-000015')).queryByText('Cambiada'),
      ).toBeNull();
    });

    it('muestra el avance, deja el campo listo para el siguiente escaneo y bloquea Aprobar', async () => {
      const user = userEvent.setup();
      const dialog = await openReview(user);

      await scanCodes(user, ['EQP-IC-000018']);

      expect(within(dialog).getByText('1 de 2')).toBeDefined();
      const field = within(dialog).getByLabelText('Código de la unidad') as HTMLInputElement;
      expect(field.value).toBe('');
      expect(document.activeElement).toBe(field);
      expect(within(dialog).getByTestId('unidad-EQP-IC-000014')).toBeDefined();
      expect((within(dialog).getByRole('button', { name: 'Aprobar' }) as HTMLButtonElement).disabled).toBe(true);
    });

    it('Cancelar mantiene la selección anterior', async () => {
      const user = userEvent.setup();
      const dialog = await openReview(user);

      await scanCodes(user, ['EQP-IC-000018']);
      await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

      expect(within(dialog).queryByLabelText('Código de la unidad')).toBeNull();
      expect(within(dialog).getByTestId('unidad-EQP-IC-000014')).toBeDefined();
      expect(within(dialog).queryByTestId('unidad-EQP-IC-000018')).toBeNull();
    });

    it('un código inexistente muestra el error y no cuenta', async () => {
      const user = userEvent.setup();
      const dialog = await openReview(user);

      await scanCodes(user, ['NO-EXISTE']);

      expect(within(dialog).getByRole('alert').textContent).toBe(
        'El código NO-EXISTE no está disponible en este pañol para este producto.',
      );
      expect(within(dialog).getByText('0 de 2')).toBeDefined();
    });

    it('un código escaneado dos veces muestra el error y no cuenta', async () => {
      const user = userEvent.setup();
      const dialog = await openReview(user);

      await scanCodes(user, ['EQP-IC-000018', 'EQP-IC-000018']);

      expect(within(dialog).getByRole('alert').textContent).toBe(
        'El código EQP-IC-000018 ya fue escaneado.',
      );
      expect(within(dialog).getByText('1 de 2')).toBeDefined();
    });

    it('sin otras unidades disponibles no se puede cambiar', async () => {
      reviewState.data = {
        ...mockReview,
        items: [
          {
            ...mockReview.items[0]!,
            available_quantity: 2,
            available_units: [routerA, routerB],
          },
        ],
      } satisfies LoanReview;
      const user = userEvent.setup();
      const dialog = await openReview(user);

      const change = within(dialog).getByRole('button', { name: `Cambiar elementos de ${ROUTER}` });
      expect((change as HTMLButtonElement).disabled).toBe(true);
    });

    it('Restablecer vuelve a la propuesta del sistema', async () => {
      const user = userEvent.setup();
      const dialog = await openReview(user);

      const reset = within(dialog).getByRole('button', { name: /Restablecer propuesta/ });
      expect((reset as HTMLButtonElement).disabled).toBe(true);

      await scanCodes(user, ['EQP-IC-000018', 'EQP-IC-000015']);
      expect((reset as HTMLButtonElement).disabled).toBe(false);
      await user.click(reset);

      expect(within(dialog).getByTestId('unidad-EQP-IC-000014')).toBeDefined();
      expect(within(dialog).queryByTestId('unidad-EQP-IC-000018')).toBeNull();
      expect(within(dialog).queryByText('Cambiada')).toBeNull();
    });

    it('con faltante indica qué falta, deshabilita Aprobar y permite rechazar', async () => {
      reviewState.data = {
        ...mockReview,
        can_approve: false,
        items: [
          {
            ...mockReview.items[0]!,
            available_quantity: 1,
            shortage: 1,
            suggested_units: [routerA],
            available_units: [routerA],
          },
        ],
      } satisfies LoanReview;
      const user = userEvent.setup();
      const dialog = await openReview(user);

      expect(within(dialog).getByText('Faltan 1 unidad(es) en este pañol.')).toBeDefined();
      const approve = within(dialog).getByRole('button', { name: 'Aprobar' }) as HTMLButtonElement;
      expect(approve.disabled).toBe(true);

      await user.click(within(dialog).getByRole('button', { name: 'Rechazar' }));
      expect(await screen.findByText('Rechazar Solicitud Remota')).toBeDefined();
    });

    it('sin cambios aprueba enviando todas las unidades propuestas, sin insumos', async () => {
      mockAprobarMutateAsync.mockResolvedValueOnce({ id: 1 });
      const user = userEvent.setup();
      const dialog = await openReview(user);

      await user.click(within(dialog).getByRole('button', { name: 'Aprobar' }));

      expect(mockAprobarMutateAsync).toHaveBeenCalledWith({
        id: 1,
        payload: { items: [{ item_id: 1, unit_ids: [301, 302] }] },
      });
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });

    it('aprueba con los elementos escaneados', async () => {
      mockAprobarMutateAsync.mockResolvedValueOnce({ id: 1 });
      const user = userEvent.setup();
      const dialog = await openReview(user);

      await scanCodes(user, ['EQP-IC-000018', 'EQP-IC-000015']);
      await user.click(within(dialog).getByRole('button', { name: 'Aprobar' }));

      expect(mockAprobarMutateAsync).toHaveBeenCalledWith({
        id: 1,
        payload: { items: [{ item_id: 1, unit_ids: [305, 302] }] },
      });
    });

    it('ante un 422 mantiene el diálogo, avisa y vuelve a pedir la revisión', async () => {
      mockAprobarMutateAsync.mockRejectedValueOnce(
        new apiErrors.ApiRequestError(422, { message: 'La unidad ya no está disponible.' }),
      );
      const user = userEvent.setup();
      const dialog = await openReview(user);

      await user.click(within(dialog).getByRole('button', { name: 'Aprobar' }));

      const alert = await within(dialog).findByRole('alert');
      expect(alert.textContent).toContain('La unidad ya no está disponible.');
      expect(alert.textContent).toContain('La propuesta pudo cambiar');
      expect(mockReviewRefetch).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('dialog')).toBeDefined();
    });

    it('otro error al aprobar no vuelve a pedir la revisión', async () => {
      mockAprobarMutateAsync.mockRejectedValueOnce(
        new apiErrors.ApiRequestError(500, { message: 'Error del servidor' }),
      );
      const user = userEvent.setup();
      const dialog = await openReview(user);

      await user.click(within(dialog).getByRole('button', { name: 'Aprobar' }));

      expect((await within(dialog).findByRole('alert')).textContent).toContain('Error del servidor');
      expect(mockReviewRefetch).not.toHaveBeenCalled();
    });

    it('si la revisión falla, muestra el error, permite reintentar y no deja aprobar', async () => {
      reviewState.data = undefined;
      reviewState.error = new apiErrors.ApiRequestError(422, {
        message: 'El préstamo ya no está pendiente.',
      });
      const user = userEvent.setup();
      const dialog = await openReview(user);

      expect(within(dialog).getByRole('alert').textContent).toContain(
        'El préstamo ya no está pendiente.',
      );
      expect(
        (within(dialog).getByRole('button', { name: 'Aprobar' }) as HTMLButtonElement).disabled,
      ).toBe(true);

      await user.click(within(dialog).getByRole('button', { name: 'Reintentar' }));
      expect(mockReviewRefetch).toHaveBeenCalledTimes(1);
    });

    it('al cerrar con cambios pide confirmación', async () => {
      const user = userEvent.setup();
      const dialog = await openReview(user);

      await scanCodes(user, ['EQP-IC-000018', 'EQP-IC-000015']);
      await user.click(within(dialog).getByRole('button', { name: 'Cerrar' }));

      expect(await screen.findByText('¿Descartar los cambios de unidades?')).toBeDefined();
    });
  });
});
