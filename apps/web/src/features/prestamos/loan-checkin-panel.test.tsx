import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CajonEntity, Prestamo } from '@sgia/types';

import { LoanCheckinPanel } from './components/loan-checkin-panel';

const mutateAsync = vi.fn();
const fetchCajonByCode = vi.fn();

vi.mock('@sgia/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sgia/api-client')>()),
  useCheckinLoan: () => ({ mutateAsync, isPending: false }),
  fetchCajonByCode: (code: string) => fetchCajonByCode(code),
}));

vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/audio', () => ({ playScannerBeep: vi.fn() }));

const CAJONES: Record<string, CajonEntity> = {
  'PREDES-RACK-R1': { id: 9, codigo: 'Rack-R1', barcode: 'PREDES-RACK-R1', location_id: 4, location: { id: 4, nombre: 'Pañol de Redes', tipo: 'panol', code: 'PREDES', storeroom_id: '1' } },
  'PCENTRAL-CAJON-A1': { id: 1, codigo: 'Cajon-A1', barcode: 'PCENTRAL-CAJON-A1', location_id: 1, location: { id: 1, nombre: 'Pañol Central', tipo: 'panol', code: 'PCENTRAL', storeroom_id: '1' } },
  'PCENTRAL-GAVETA-01': { id: 3, codigo: 'Gaveta-01', barcode: 'PCENTRAL-GAVETA-01', location_id: 1, location: { id: 1, nombre: 'Pañol Central', tipo: 'panol', code: 'PCENTRAL', storeroom_id: '1' } },
};

const loan = {
  id: 164,
  codigo: 'REM-2026-IMZJWX',
  solicitanteNombre: 'Docente Prueba',
  estado: 'activo',
  storeroom_id: 1,
  items: [
    {
      id: 501,
      productoId: 8,
      nombre: 'Proyector Epson',
      cantidad: 2,
      units: [
        { id: 31, code: 'EQP-II-000031', status: 'prestado', returned_at: null },
        { id: 32, code: 'EQP-II-000032', status: 'prestado', returned_at: null },
      ],
    },
    { id: 503, productoId: 15, nombre: 'Cable UTP', cantidad: 2, codigoBarras: 'INS-IC-000015', cajon_id: 1, cajon_barcode: 'PCENTRAL-CAJON-A1', returned_quantity: 0 },
  ],
} as unknown as Prestamo;

async function scan(user: ReturnType<typeof userEvent.setup>, code: string) {
  await user.type(screen.getByLabelText(/Escanea/), `${code}{Enter}`);
}

function renderPanel(onDone = vi.fn()) {
  render(<LoanCheckinPanel loan={loan} soundEnabled={false} onCancel={vi.fn()} onDone={onDone} />);
  return onDone;
}

describe('LoanCheckinPanel (devolución con escaneo)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchCajonByCode.mockImplementation(async (code: string) => {
      const c = CAJONES[code.toUpperCase()];
      if (!c) throw new Error(`No existe un cajón con el código ${code}.`);
      return c;
    });
    mutateAsync.mockResolvedValue({});
  });

  it('escanea una unidad y luego su cajón: queda guardada en ese cajón', async () => {
    const user = userEvent.setup();
    renderPanel();

    await scan(user, 'EQP-II-000031');
    const row = screen.getByTestId('checkin-row-EQP-II-000031');
    expect(within(row).getByText('Esperando cajón')).toBeDefined();
    expect(screen.getByLabelText('Escanea el cajón donde guardas Proyector Epson (EQP-II-000031)')).toBeDefined();
    expect((screen.getByRole('button', { name: /Registrar devolución/ }) as HTMLButtonElement).disabled).toBe(true);

    await scan(user, 'predes-rack-r1');
    await waitFor(() => expect(within(row).getByText('PREDES-RACK-R1')).toBeDefined());
    expect(fetchCajonByCode).toHaveBeenCalledWith('predes-rack-r1');
    expect((screen.getByRole('button', { name: 'Registrar devolución (1)' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('rechaza un código que no es del préstamo', async () => {
    const user = userEvent.setup();
    renderPanel();

    await scan(user, 'EQP-XX-999999');
    expect(screen.getByRole('status').textContent).toBe('El código EQP-XX-999999 no pertenece a este préstamo.');
    expect(fetchCajonByCode).not.toHaveBeenCalled();
  });

  it('exige el cajón registrado del insumo', async () => {
    const user = userEvent.setup();
    renderPanel();

    await scan(user, 'INS-IC-000015');
    await scan(user, 'PCENTRAL-GAVETA-01');
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe(
        'Cable UTP se guarda en el cajón PCENTRAL-CAJON-A1; escanea ese cajón o reubica el producto.',
      ),
    );
    const row = screen.getByTestId('checkin-row-INS-IC-000015');
    expect(within(row).getByText('Esperando cajón')).toBeDefined();

    await scan(user, 'PCENTRAL-CAJON-A1');
    await waitFor(() => expect(within(row).getByText('PCENTRAL-CAJON-A1')).toBeDefined());
  });

  it('no deja escanear otro producto mientras falta un cajón', async () => {
    const user = userEvent.setup();
    renderPanel();

    await scan(user, 'EQP-II-000031');
    await scan(user, 'EQP-II-000032');
    expect(screen.getByRole('status').textContent).toBe('Falta escanear el cajón de Proyector Epson (EQP-II-000031).');
    expect(within(screen.getByTestId('checkin-row-EQP-II-000032')).getByText('Pendiente')).toBeDefined();
  });

  it('envía solo lo escaneado o marcado: unidad dañada, unidad extraviada e insumo pendiente', async () => {
    const user = userEvent.setup();
    const onDone = renderPanel();

    await scan(user, 'EQP-II-000031');
    await scan(user, 'PREDES-RACK-R1');
    const row31 = screen.getByTestId('checkin-row-EQP-II-000031');
    await waitFor(() => expect(within(row31).getByText('PREDES-RACK-R1')).toBeDefined());
    await user.click(within(row31).getByRole('button', { name: /Dañado/ }));
    await user.type(screen.getByLabelText('Detalle del daño de EQP-II-000031'), 'lente rayado');
    await user.click(screen.getByRole('button', { name: 'Marcar EQP-II-000032 como extraviado' }));

    await user.click(screen.getByRole('button', { name: 'Registrar devolución (2)' }));

    expect(mutateAsync).toHaveBeenCalledWith({
      loan_id: 164,
      general_notes: 'Dañado Proyector Epson (EQP-II-000031): lente rayado',
      items: [
        { item_id: 501, condition: 'dañado', damaged: true, units: [{ id: 31, cajon_id: 9 }] },
        { item_id: 501, condition: 'extraviado', units: [{ id: 32 }] },
      ],
    });
    expect(onDone).toHaveBeenCalled();
  });
});
