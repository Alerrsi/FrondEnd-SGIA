import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Supplier } from '@sgia/types';

import ProveedoresPage from './pages/proveedores-page';

const suppliers: Supplier[] = [
  {
    id: 1,
    name: 'Distribuidora TechPro Ltda.',
    contact_name: 'Carlos Muñoz',
    email: 'ventas@techpro.cl',
    phone: null,
    category: 'Redes',
    areas: ['informatica'],
    is_active: true,
    created_at: '2026-01-15T00:00:00Z',
    updated_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 2,
    name: 'Insumos Digitales SpA',
    contact_name: 'María López',
    email: 'contacto@insumosdigitales.cl',
    phone: null,
    category: 'Electrónica',
    areas: ['diseno'],
    is_active: true,
    created_at: '2026-02-20T00:00:00Z',
    updated_at: '2026-02-20T00:00:00Z',
  },
];

const mockSuppliersParams = vi.fn();
const mockExportMutateAsync = vi.fn();

vi.mock('@sgia/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sgia/api-client')>()),
  useExportReport: () => ({ mutateAsync: mockExportMutateAsync, isPending: false }),
  useSetSupplierStatus: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSuppliers: (params?: Record<string, unknown>) => {
    mockSuppliersParams(params);
    return {
      data: { data: suppliers, meta: { currentPage: 1, lastPage: 1, perPage: 20, total: 2 } },
      isLoading: false,
      isError: false,
      isFetching: false,
    };
  },
}));

vi.mock('@/features/proveedores/components/supplier-form-dialog', () => ({ SupplierFormDialog: () => null }));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() } }));

describe('ProveedoresPage: búsqueda en el servidor (docs/centro-reportes.md, decisión 14)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('envía `search` al listado y al Excel y ya no filtra la página en el navegador', async () => {
    const user = userEvent.setup();
    mockExportMutateAsync.mockRejectedValue(new Error('sin red'));
    render(<ProveedoresPage />);

    await user.type(screen.getByPlaceholderText(/Buscar proveedor/i), 'techpro');

    await waitFor(() =>
      expect(mockSuppliersParams).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'techpro', page: 1 })),
    );
    // La respuesta del servidor se muestra tal cual (el mock devuelve ambos).
    expect(screen.getByText('Insumos Digitales SpA')).toBeDefined();

    await user.click(screen.getByRole('button', { name: 'Exportar Excel' }));
    await waitFor(() =>
      expect(mockExportMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/suppliers/export',
          params: { search: 'techpro', category: undefined, area: undefined },
        }),
      ),
    );
  });
});
