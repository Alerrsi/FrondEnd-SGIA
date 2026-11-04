import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MaintenanceRecord } from '@sgia/types';

import { MaintenanceChecklistSheet } from './components/maintenance-checklist-sheet';
import { checklistMissing } from './lib/maintenance-labels';

const record: MaintenanceRecord = {
  id: 9,
  equipment_unit_id: 4,
  equipment_unit: { id: 4, code: 'PRO-II-000004', status: 'en_reparacion', product_id: 1, product: { id: 1, name: 'Switch' } },
  maintenance_type: 'correctiva',
  execution_mode: 'medios_propios',
  status: 'en_curso',
  rev_a_approved: true,
  rev_b_approved: false,
  rev_c_approved: null,
  pfg_approved: false,
  requires_additional_maintenance: false,
  applies_recf: false,
  repair_cost: null,
  spare_parts_used: null,
  technical_notes: null,
};

const mockUpdate = vi.fn();
const mockFinish = vi.fn();

vi.mock('@sgia/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sgia/api-client')>()),
  useMaintenanceRecord: () => ({ data: record, isLoading: false }),
  useUpdateMaintenanceRecord: () => ({ mutateAsync: mockUpdate, isPending: false }),
  useFinishMaintenanceRecord: () => ({ mutateAsync: mockFinish, isPending: false }),
  useCancelMaintenanceRecord: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

describe('checklistMissing', () => {
  it('REV-C "No aplica" (null) no bloquea; REV-A/B y PFG sí', () => {
    expect(
      checklistMissing({ rev_a_approved: true, rev_b_approved: true, rev_c_approved: null, pfg_approved: true }),
    ).toEqual([]);
    expect(
      checklistMissing({ rev_a_approved: true, rev_b_approved: false, rev_c_approved: false, pfg_approved: null }),
    ).toEqual(['REV-B', 'REV-C', 'PFG']);
  });
});

describe('MaintenanceChecklistSheet (REQ-18)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('no cierra como operativa si falta el checklist y no llama a finish', async () => {
    const user = userEvent.setup();
    render(<MaintenanceChecklistSheet recordId={9} onClose={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /marcar operativa/i }));
    expect(await screen.findByText(/Falta aprobar: REV-B, PFG/)).toBeDefined();
    expect(mockFinish).not.toHaveBeenCalled();
  });

  it('con el checklist completo guarda y cierra como operativa', async () => {
    mockUpdate.mockResolvedValue(record);
    mockFinish.mockResolvedValue(record);
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<MaintenanceChecklistSheet recordId={9} onClose={onClose} />);
    await user.click(screen.getByLabelText('REV-B aprobada'));
    await user.click(screen.getByLabelText('PFG aprobada'));
    await user.click(screen.getByRole('button', { name: /marcar operativa/i }));

    await waitFor(() => expect(mockFinish).toHaveBeenCalledWith({ id: 9, payload: { result: 'operativo' } }));
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 9,
        payload: expect.objectContaining({ rev_b_approved: true, pfg_approved: true, rev_c_approved: null }),
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });
});
