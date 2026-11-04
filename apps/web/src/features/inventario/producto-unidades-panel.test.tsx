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
  { id: 4, code: 'PRO-ISD-000004', status: 'en_reparacion', product_id: 7 },
];

vi.mock('@/features/auth/context/auth-context', () => ({
  useOptionalAuth: () => ({ user: { rol: 'AD-01' } }),
}));

vi.mock('@sgia/api-client', () => ({
  useProductUnits: () => ({
    data: { data: units, meta: { currentPage: 1, lastPage: 1, perPage: 10, total: 4 } },
    isLoading: false,
    isError: false,
  }),
  useUpdateEquipmentUnitStatus: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteEquipmentUnit: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateProductUnits: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCajones: () => ({ data: { data: [] }, isLoading: false }),
  useEquipmentUnitBarcode: () => ({ data: undefined, isLoading: false }),
  fetchEquipmentUnitTechnicalSheet: vi.fn(),
  useActiveMaintenance: (id: number | undefined, enabled?: boolean) => ({
    data: enabled && id === 4 ? { id: 31, status: 'en_curso' } : null,
    isLoading: false,
  }),
  useCreateMaintenanceRecord: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSuppliers: () => ({ data: { data: [] } }),
  useMaintenanceRecord: () => ({ data: undefined, isLoading: true }),
  useUpdateMaintenanceRecord: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useFinishMaintenanceRecord: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCancelMaintenanceRecord: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUnitMaintenanceDocuments: () => ({ data: { data: [], meta: { total: 0 } }, isLoading: false }),
  useUploadMaintenanceDocument: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteMaintenanceDocument: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDownloadMaintenanceDocument: () => ({ mutateAsync: vi.fn(), isPending: false }),
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

  it('con una mantención en curso oculta el selector de estado y enlaza a la mantención (422 evitado)', () => {
    render(<ProductoUnidadesPanel producto={producto} />);
    expect(screen.queryByLabelText('Cambiar estado de PRO-ISD-000004')).toBeNull();
    expect(screen.getByRole('button', { name: /en mantención/i })).toBeTruthy();
  });

  it('ofrece enviar a mantención solo las unidades disponibles y solo con permiso', () => {
    const { unmount } = render(<ProductoUnidadesPanel producto={producto} />);
    expect(screen.getByLabelText('Enviar PRO-ISD-000001 a mantención')).toBeTruthy();
    expect(screen.queryByLabelText('Enviar PRO-ISD-000002 a mantención')).toBeNull();
    unmount();
    render(<ProductoUnidadesPanel producto={producto} canMaintain={false} />);
    expect(screen.queryByLabelText('Enviar PRO-ISD-000001 a mantención')).toBeNull();
    // Los documentos siguen siendo de lectura para todos.
    expect(screen.getByLabelText('Documentos de PRO-ISD-000001')).toBeTruthy();
  });

  it('oculta acciones de escritura sin permiso', () => {
    render(<ProductoUnidadesPanel producto={producto} canWrite={false} canDelete={false} />);
    expect(screen.queryByText('Agregar unidades')).toBeNull();
    expect(screen.queryByLabelText('Eliminar PRO-ISD-000001')).toBeNull();
  });
});
