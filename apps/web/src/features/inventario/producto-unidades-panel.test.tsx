import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import type { EquipmentUnit, Producto } from '@sgia/types';

import { ProductoUnidadesPanel } from './components/producto-unidades-panel';

const units: EquipmentUnit[] = [
  { id: 1, code: 'PRO-ISD-000001', serial_number: 'SN-1', status: 'disponible', product_id: 7 },
  {
    id: 2,
    code: 'PRO-ISD-000002',
    serial_number: null,
    status: 'prestado',
    product_id: 7,
    active_loan: { id: 9, code: 'PRE-2026-000009' },
  },
  { id: 3, code: 'PRO-ISD-000003', status: 'dado_de_baja', product_id: 7 },
];

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({ user: { rol: 'AD-01' } }),
}));

vi.mock('@sgia/api-client', () => ({
  useProductUnits: () => ({
    data: { data: units, meta: { currentPage: 1, lastPage: 1, perPage: 10, total: 3 } },
    isLoading: false,
    isError: false,
  }),
  useUpdateEquipmentUnitStatus: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteEquipmentUnit: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateProductUnits: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCajones: () => ({ data: { data: [] }, isLoading: false }),
  useEquipmentUnitBarcode: () => ({ data: undefined, isLoading: false }),
  fetchEquipmentUnitTechnicalSheet: vi.fn(),
}));

const producto = { id: 7, nombre: 'Router', type: 'equipo' } as Producto;

describe('ProductoUnidadesPanel', () => {
  it('lista cada unidad con su estado', () => {
    render(<ProductoUnidadesPanel producto={producto} />);
    expect(screen.getByText('PRO-ISD-000001')).toBeTruthy();
    expect(screen.getByText('PRO-ISD-000002')).toBeTruthy();
    const [first, second, third] = screen.getAllByRole('row').slice(1);
    if (!first || !second || !third) throw new Error('Se esperaban 3 filas de unidades');
    expect(within(first).getByText('Disponible')).toBeTruthy();
    expect(within(second).getByText('Prestado')).toBeTruthy();
    expect(within(third).getByText('De baja')).toBeTruthy();
    expect(screen.getByText('PRE-2026-000009')).toBeTruthy();
  });

  it('no permite cambiar estado a mano en unidades dadas de baja', () => {
    render(<ProductoUnidadesPanel producto={producto} />);
    expect(screen.getByLabelText('Cambiar estado de PRO-ISD-000001')).toBeTruthy();
    expect(screen.queryByLabelText('Cambiar estado de PRO-ISD-000003')).toBeNull();
  });

  it('oculta acciones de escritura sin permiso', () => {
    render(<ProductoUnidadesPanel producto={producto} canWrite={false} canDelete={false} />);
    expect(screen.queryByText('Agregar unidades')).toBeNull();
    expect(screen.queryByLabelText('Eliminar PRO-ISD-000001')).toBeNull();
  });
});
