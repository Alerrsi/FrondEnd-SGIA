import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  downloadMaintenanceDocumentFile,
  uploadMaintenanceDocument,
  useActiveMaintenance,
  useCancelMaintenanceRecord,
  useFinishMaintenanceRecord,
  useMaintenanceRecords,
  useUnitMaintenanceDocuments,
} from '@sgia/api-client';

const jsonResponse = (body: unknown, status = 200) =>
  ({ ok: status < 400, status, json: async () => body }) as Response;

const rawRecord = {
  id: 9,
  equipment_unit_id: 4,
  equipment_unit: {
    id: 4,
    code: 'PRO-II-000004',
    status: 'en_reparacion',
    product_id: 1,
    product: { id: 1, name: 'Switch Cisco 2960', maintenance_priority: 'A' },
  },
  maintenance_type: 'correctiva',
  execution_mode: 'medios_propios',
  status: 'en_curso',
  rev_a_approved: 1,
  rev_b_approved: false,
  rev_c_approved: null,
  pfg_approved: null,
  requires_additional_maintenance: false,
  applies_recf: null,
  repair_cost: '15000.50',
  spare_parts_used: null,
  technical_notes: 'Cambio de fuente',
  started_at: '2026-11-02T14:00:00+00:00',
  finished_at: null,
  documents: [],
};

describe('Mantenciones (REQ-18) y documentos (REQ-19): cliente API', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('useMaintenanceRecords filtra, normaliza el checklist y conserva null = "No aplica"', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({
        data: [rawRecord],
        meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
      }),
    );

    const { result } = renderHook(
      () => useMaintenanceRecords({ status: 'en_curso', maintenance_type: 'correctiva', from: '2026-11-01' }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const url = String(mockFetch.mock.calls[0]?.[0]);
    expect(url).toContain('/maintenance-records?');
    expect(url).toContain('status=en_curso');
    expect(url).toContain('maintenance_type=correctiva');

    const record = result.current.data?.data[0];
    expect(record?.repair_cost).toBe(15000.5);
    expect(record?.rev_a_approved).toBe(true);
    expect(record?.rev_b_approved).toBe(false);
    expect(record?.rev_c_approved).toBeNull();
    expect(record?.pfg_approved).toBeNull();
    expect(record?.equipment_unit?.product?.maintenance_priority).toBe('A');
  });

  it('useActiveMaintenance devuelve la mantención en curso de la unidad', async () => {
    const mockFetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ data: [rawRecord], meta: { total: 1 } }));

    const { result } = renderHook(() => useActiveMaintenance(4), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const url = String(mockFetch.mock.calls[0]?.[0]);
    expect(url).toContain('equipment_unit_id=4');
    expect(url).toContain('status=en_curso');
    expect(url).toContain('per_page=1');
    expect(result.current.data?.id).toBe(9);
  });

  it('useActiveMaintenance devuelve null si no hay mantención en curso y respeta enabled', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(jsonResponse({ data: [], meta: { total: 0 } }));
    const { result } = renderHook(() => useActiveMaintenance(4), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();

    const spy = vi.spyOn(globalThis, 'fetch');
    spy.mockClear();
    const disabled = renderHook(() => useActiveMaintenance(5, false), { wrapper });
    expect(disabled.result.current.fetchStatus).toBe('idle');
    expect(spy).not.toHaveBeenCalled();
  });

  it('useFinishMaintenanceRecord cierra como operativa e invalida unidades, productos e informes', async () => {
    const mockFetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse({ data: { ...rawRecord, status: 'finalizada', result: 'operativo' } }),
      );
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useFinishMaintenanceRecord(), { wrapper });
    const record = await result.current.mutateAsync({ id: 9, payload: { result: 'operativo' } });

    const call = mockFetch.mock.calls[0];
    expect(String(call?.[0])).toContain('/maintenance-records/9/finish');
    expect(call?.[1]?.method).toBe('POST');
    expect(JSON.parse(String(call?.[1]?.body))).toEqual({ result: 'operativo' });
    expect(record.status).toBe('finalizada');
    for (const key of ['maintenance', 'equipment-units', 'products', 'incident-reports']) {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: [key] });
    }
  });

  it('useCancelMaintenanceRecord envía el motivo opcional', async () => {
    const mockFetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ data: { ...rawRecord, status: 'anulada' } }));

    const { result } = renderHook(() => useCancelMaintenanceRecord(), { wrapper });
    await result.current.mutateAsync({ id: 9, payload: { reason: 'Abierta por error' } });

    const call = mockFetch.mock.calls[0];
    expect(String(call?.[0])).toContain('/maintenance-records/9/cancel');
    expect(JSON.parse(String(call?.[1]?.body))).toEqual({ reason: 'Abierta por error' });
  });

  it('useUnitMaintenanceDocuments serializa current como 1 y marca vencidos', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({
        data: [
          {
            id: 1,
            equipment_unit_id: 4,
            document_type: 'certificado_calibracion',
            title: 'Calibración 2025',
            valid_until: '2025-01-10',
            is_expired: true,
            file_url: 'https://api.test/storage/x.pdf',
          },
          {
            id: 2,
            equipment_unit_id: 4,
            document_type: 'manual',
            title: 'Manual',
            valid_until: null,
          },
        ],
        meta: { current_page: 1, last_page: 1, per_page: 15, total: 2 },
      }),
    );

    const { result } = renderHook(
      () => useUnitMaintenanceDocuments(4, { current: true, expiring_within_days: 30 }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const url = String(mockFetch.mock.calls[0]?.[0]);
    expect(url).toContain('/equipment-units/4/maintenance-documents?');
    expect(url).toContain('current=1');
    expect(url).toContain('expiring_within_days=30');

    const [expired, noExpiry] = result.current.data?.data ?? [];
    expect(expired?.is_expired).toBe(true);
    expect(noExpiry?.is_expired).toBe(false);
    expect(noExpiry?.valid_until).toBeNull();
  });

  it('uploadMaintenanceDocument envía multipart sin Content-Type manual', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse(
        { data: { id: 3, equipment_unit_id: 4, document_type: 'manual', title: 'Manual', valid_until: null } },
        201,
      ),
    );
    const file = new File(['%PDF-1.4'], 'manual.pdf', { type: 'application/pdf' });

    const doc = await uploadMaintenanceDocument(4, {
      document_type: 'manual',
      title: 'Manual',
      file,
      valid_until: '2027-01-01',
      maintenance_record_id: 9,
    });

    const call = mockFetch.mock.calls[0];
    expect(String(call?.[0])).toContain('/equipment-units/4/maintenance-documents');
    const body = call?.[1]?.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('document_type')).toBe('manual');
    expect(body.get('valid_until')).toBe('2027-01-01');
    expect(body.get('maintenance_record_id')).toBe('9');
    expect((body.get('file') as File).name).toBe('manual.pdf');
    expect((call?.[1]?.headers as Record<string, string>)['Content-Type']).toBeUndefined();
    expect(doc.id).toBe(3);
  });

  it('downloadMaintenanceDocumentFile descarga el PDF como Blob con el token', async () => {
    const blob = new Blob(['%PDF'], { type: 'application/pdf' });
    const mockFetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true, status: 200, blob: async () => blob } as Response);

    const result = await downloadMaintenanceDocumentFile(5);

    expect(String(mockFetch.mock.calls[0]?.[0])).toContain('/maintenance-documents/5/file');
    expect(result).toBe(blob);
  });
});
