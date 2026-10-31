import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Producto } from '@sgia/types';

import { InventarioTable } from './components/inventario-table';

vi.mock('@sgia/api-client', () => ({
  useLocations: () => ({ data: { data: [] }, isLoading: false }),
  useCajones: () => ({ data: { data: [] }, isLoading: false }),
  useProductUnits: (id: number | undefined) => ({
    data: {
      data:
        id === 1
          ? [
              {
                id: 11,
                code: 'PRO-ISD-000001',
                serial_number: 'SN-9',
                status: 'disponible',
                product_id: 1,
                cajon: {
                  id: 5,
                  codigo: 'Cajon-A2',
                  location_id: 3,
                  location: { id: 3, nombre: 'Pañol TI', tipo: 'panol' },
                },
              },
            ]
          : [],
      meta: { currentPage: 1, lastPage: 1, perPage: 100, total: id === 1 ? 1 : 0 },
    },
    isLoading: false,
    isError: false,
  }),
}));

const base = {
  codigoBarras: 'X',
  stock: 5,
  stockCritico: 1,
  activo: true,
  ubicacion: { id: 1, sala: 'S', cajon: 'C' },
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

const productos: Producto[] = [
  { ...base, id: 1, nombre: 'Router', type: 'equipo' },
  { ...base, id: 2, nombre: 'Cable UTP', type: 'insumo' },
];

describe('InventarioTable instancias desplegables', () => {
  it('solo equipos y maquetas tienen flecha', () => {
    render(<InventarioTable productos={productos} />);
    expect(screen.getByLabelText('Ver instancias de Router')).toBeTruthy();
    expect(screen.queryByLabelText('Ver instancias de Cable UTP')).toBeNull();
  });

  it('despliega y oculta las instancias con código y ubicación', async () => {
    const user = userEvent.setup();
    render(<InventarioTable productos={productos} />);
    await user.click(screen.getByLabelText('Ver instancias de Router'));
    expect(screen.getByText('PRO-ISD-000001')).toBeTruthy();
    expect(screen.getByText(/Pañol TI · Cajon-A2/)).toBeTruthy();
    await user.click(screen.getByLabelText('Ocultar instancias de Router'));
    expect(screen.queryByText('PRO-ISD-000001')).toBeNull();
  });
});
