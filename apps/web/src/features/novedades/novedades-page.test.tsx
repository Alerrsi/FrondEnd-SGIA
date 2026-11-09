import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import NovedadesPage from '@/features/novedades/pages/novedades-page';

let role = 'PAN-01';

vi.mock('@/features/auth/context/auth-context', () => ({
  useOptionalAuth: () => ({ user: { id: 7, nombre: 'Pía Pañol', rol: role } }),
}));

vi.mock('@sgia/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sgia/api-client')>()),
  useIncidentReports: () => ({
    data: { data: [], meta: { currentPage: 1, lastPage: 1, perPage: 20, total: 0 } },
    isLoading: false,
    isError: false,
  }),
  useIncidentReport: () => ({ data: undefined, isLoading: false, isError: false }),
  useCreateIncidentReport: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateIncidentReportStatus: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useEquipmentUnitByCode: () => ({ data: undefined, isError: false }),
  useLocations: () => ({ data: { data: [] } }),
}));

describe('NovedadesPage', () => {
  beforeEach(() => {
    role = 'PAN-01';
  });

  it('permite al pañolero abrir el formulario de nuevo informe', async () => {
    const user = userEvent.setup();
    render(<NovedadesPage />);

    await user.click(screen.getByRole('button', { name: /nuevo informe/i }));

    expect(screen.getByText('Nuevo informe de novedades')).toBeDefined();
    expect(screen.getByLabelText('Asignatura o actividad')).toBeDefined();
  });

  it.each(['AD-01', 'DIR-01'])('no ofrece crear informes a %s', (currentRole) => {
    role = currentRole;
    render(<NovedadesPage />);

    expect(screen.queryByRole('button', { name: /nuevo informe/i })).toBeNull();
  });
});
