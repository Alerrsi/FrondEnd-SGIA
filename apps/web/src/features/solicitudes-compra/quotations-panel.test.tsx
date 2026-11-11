import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PurchaseRequest, PurchaseRequestQuotation } from '@sgia/types';

import { QuotationsPanel } from './components/quotations-panel';

function quotation(id: number, supplier: string, total: number): PurchaseRequestQuotation {
  return {
    id,
    supplier_id: id,
    supplier: { id, name: supplier, email: `${id}@test.cl`, areas: ['informatica'] },
    total,
    has_file: true,
    original_name: 'cotizacion.pdf',
    received_at: '2026-11-10T10:00:00Z',
    uploaded_by: 2,
    items: [],
  };
}

function request(quotations: PurchaseRequestQuotation[], extra: Partial<PurchaseRequest> = {}) {
  const quoted = quotations.length >= 3;
  const r: PurchaseRequest = {
    id: 9,
    code: 'SC-2026-0009',
    status: quoted ? 'cotizada' : 'enviada',
    status_label: null,
    annual_budget_id: 4,
    created_by: 2,
    creator_name: null,
    approved_by: 2,
    approver_name: null,
    approved_at: null,
    sent_at: null,
    selected_quotation_id: null,
    notes: null,
    items: [],
    areas: ['informatica'],
    suppliers: [],
    quotations,
    quotations_count: quotations.length,
    min_quotations: 3,
    actions: {
      can_edit: false,
      can_approve: false,
      can_send: false,
      can_resend: true,
      can_upload_quotation: true,
      can_remove_quotation: extra.selected_quotation_id == null,
      can_select_quotation: quoted,
      can_issue_order: quoted && extra.selected_quotation_id != null,
      can_cancel: true,
    },
    order: null,
    invoices: [],
    created_at: '',
    updated_at: '',
    ...extra,
  };
  return r;
}

function renderPanel(r: PurchaseRequest, canManage = true) {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <QuotationsPanel request={r} canManage={canManage} />
    </QueryClientProvider>,
  );
}

describe('QuotationsPanel', () => {
  it('con menos de 3 cotizaciones no permite elegir y avisa cuántas faltan', () => {
    renderPanel(request([quotation(1, 'A', 100), quotation(2, 'B', 90)]));
    expect(screen.getByText('Faltan 1 para poder elegir.')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Elegir' })).toBeNull();
    expect(screen.getByRole('button', { name: /Subir cotización/ })).toBeDefined();
  });

  it('con 3 permite elegir cualquiera, ordena por total y marca la menor', () => {
    renderPanel(request([quotation(1, 'Cara', 300), quotation(2, 'Barata', 100), quotation(3, 'Media', 200)]));
    const buttons = screen.getAllByRole('button', { name: 'Elegir' });
    expect(buttons).toHaveLength(3);
    expect(buttons.every((b) => !(b as HTMLButtonElement).disabled)).toBe(true);

    const rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]!).getByText('Barata')).toBeDefined();
    expect(within(rows[0]!).getByText('menor')).toBeDefined();
  });

  it('muestra la elegida y oculta acciones sin permiso de gestión', () => {
    renderPanel(
      request([quotation(1, 'A', 300), quotation(2, 'B', 100), quotation(3, 'C', 200)], {
        selected_quotation_id: 1,
      }),
      false,
    );
    expect(screen.getByText('Elegida')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Elegir' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Subir cotización/ })).toBeNull();
    // La descarga del archivo sigue disponible para lectura.
    expect(screen.getByRole('button', { name: 'Ver archivo de A' })).toBeDefined();
  });
});
