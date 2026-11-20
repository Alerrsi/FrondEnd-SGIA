import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import type { CajonEntity } from '@sgia/types';

import { AsignarCajonesDialog } from './components/asignar-cajones-dialog';

const R1: CajonEntity = { id: 8, codigo: 'ARMARIO-LAB', barcode: 'E301-ARMARIO-LAB', location_id: 2, estante_id: 4 };
const R2: CajonEntity = { id: 6, codigo: 'MESA-1-CAJON', barcode: 'E301-MESA-1-CAJON', location_id: 2, estante_id: null };

// Justo después de guardar, mientras se refrescan las dos consultas, el cajón asignado aún figura como suelto.
vi.mock('@sgia/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sgia/api-client')>()),
  useCajones: (params?: { sin_estante?: boolean }) => ({
    data: { data: params?.sin_estante ? [{ ...R1, estante_id: null }, R2] : [R1] },
    isLoading: false,
  }),
  useUpdateCajon: () => ({ mutateAsync: vi.fn() }),
}));

describe('AsignarCajonesDialog (REQ-22)', () => {
  it('muestra cada cajón una sola vez aunque venga en las dos listas', () => {
    render(<AsignarCajonesDialog open onClose={vi.fn()} locationId={2} estante={{ id: 4, codigo: 'E2E-1' }} />);

    const dialog = screen.getByRole('dialog', { name: 'Cajones del estante E2E-1' });
    expect(within(dialog).getAllByRole('checkbox')).toHaveLength(2);
    expect((within(dialog).getByRole('checkbox', { name: /E301-ARMARIO-LAB/ }) as HTMLInputElement).checked).toBe(true);
  });
});
