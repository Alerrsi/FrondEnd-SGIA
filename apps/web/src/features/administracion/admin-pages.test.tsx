import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiRequestError } from '@sgia/api-client';

import { StoreroomFormDialog } from './components/storeroom-form-dialog';
import { auditActionLabel, auditDetails } from './lib/audit-labels';
import { storeroomFormSchema } from './lib/storeroom-schema';
import AuditoriaPage from './pages/auditoria-page';

const mockCreate = vi.fn();
const auditSpy = vi.fn();

vi.mock('@sgia/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sgia/api-client')>()),
  useCreateStoreroom: () => ({ mutateAsync: mockCreate, isPending: false }),
  useUpdateStoreroom: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUsers: () => ({ data: { data: [{ id: 1, nombre: 'Admin' }] } }),
  useAuditLogs: (params: unknown) => {
    auditSpy(params);
    return {
      isLoading: false,
      isError: false,
      data: {
        data: [
          {
            id: 1,
            action: 'user.role_changed',
            auditable_type: 'user',
            auditable_id: 5,
            user: { id: 1, name: 'Admin' },
            old_values: { role: 'PRO-01' },
            new_values: { role: 'PAN-01' },
            created_at: '2026-11-03T15:30:00+00:00',
          },
        ],
        meta: { currentPage: 1, lastPage: 1, perPage: 20, total: 1 },
      },
    };
  },
}));
vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

describe('esquema de pañol', () => {
  it('el código admite letras, números y guiones', () => {
    const base = { name: 'Pañol TI', general_location: '' };
    expect(storeroomFormSchema.safeParse({ ...base, code: 'PAN-TEMUCO' }).success).toBe(true);
    expect(storeroomFormSchema.safeParse({ ...base, code: 'PAN TEMUCO' }).success).toBe(false);
  });
});

describe('StoreroomFormDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('envía el código en mayúsculas', async () => {
    mockCreate.mockResolvedValue({});
    const user = userEvent.setup();
    render(<StoreroomFormDialog open onClose={vi.fn()} storeroom={null} />);
    await user.type(screen.getByLabelText('Nombre'), 'Bodega Norte');
    await user.type(screen.getByLabelText('Código'), 'bod-norte');
    await user.click(screen.getByRole('button', { name: /crear pañol/i }));
    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith({ name: 'Bodega Norte', code: 'BOD-NORTE', general_location: null }),
    );
  });

  it('muestra el 422 de código duplicado en el campo', async () => {
    mockCreate.mockRejectedValue(
      new ApiRequestError(422, { message: 'Código en uso.', errors: { code: ['El código ya existe.'] } }),
    );
    const user = userEvent.setup();
    render(<StoreroomFormDialog open onClose={vi.fn()} storeroom={null} />);
    await user.type(screen.getByLabelText('Nombre'), 'Pañol X');
    await user.type(screen.getByLabelText('Código'), 'PAN-X');
    await user.click(screen.getByRole('button', { name: /crear pañol/i }));
    expect(await screen.findByText('El código ya existe.')).toBeDefined();
  });
});

describe('Auditoría', () => {
  beforeEach(() => vi.clearAllMocks());

  it('etiqueta acciones y entrega el detalle antes/después', () => {
    expect(auditActionLabel('user.role_changed')).toBe('Cambio de rol');
    expect(auditActionLabel('otra.cosa')).toBe('otra.cosa');
    expect(auditDetails({ old_values: { a: 1 }, new_values: {}, metadata: null }).map(([l]) => l)).toEqual(['Antes']);
  });

  it('filtra por prefijo de acción y muestra el detalle al expandir', async () => {
    const user = userEvent.setup();
    render(<AuditoriaPage />);
    expect(screen.getByText('Cambio de rol', { selector: 'span' })).toBeDefined();

    await user.selectOptions(screen.getByLabelText('Filtrar por acción'), 'user.');
    await waitFor(() => expect(auditSpy).toHaveBeenLastCalledWith(expect.objectContaining({ action: 'user.' })));

    await user.click(screen.getByRole('button', { name: 'Detalle' }));
    expect(screen.getByText(/"role": "PAN-01"/)).toBeDefined();
  });
});
