import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createIncidentReport,
  fetchIncidentReports,
  fetchMyIncidentReports,
  updateIncidentReportStatus,
} from '@sgia/api-client';

const jsonResponse = (body: unknown, status = 200) =>
  ({ ok: status < 400, status, json: async () => body }) as Response;

const basePayload = {
  subject: 'Redes de Computadores',
  location_id: 12,
  problems: [
    { type: 'falla_equipo' as const, description: 'El switch no enciende.' },
    { type: 'falta_insumo' as const, description: 'Faltan cables UTP.' },
  ],
  signature: 'data:image/png;base64,AAAA',
};

describe('Informe de novedades: cliente API', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('sin foto envía JSON a POST /incident-reports', async () => {
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse({ data: { id: 41, code: 'NV-2026-A1B2C3', status: 'reportado', problems: [] } }, 201),
      );

    const report = await createIncidentReport({ ...basePayload, equipment_code: 'EQ-IC-000123' });

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/incident-reports');
    expect(url).not.toContain('/equipment/');
    expect(init.method).toBe('POST');
    const body = JSON.parse(String(init.body));
    expect(body.problems).toHaveLength(2);
    expect(body.equipment_code).toBe('EQ-IC-000123');
    expect(body).not.toHaveProperty('evidence_photo');
    expect(report.code).toBe('NV-2026-A1B2C3');
    expect(report.is_legacy).toBe(false);
  });

  it('con foto envía multipart con problems[i][type] y problems[i][description]', async () => {
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ data: { id: 42, status: 'reportado', problems: [] } }, 201));
    const photo = new Blob(['x'], { type: 'image/png' });

    await createIncidentReport({ ...basePayload, evidence_photo: photo });

    const init = spy.mock.calls[0]![1] as RequestInit;
    expect(init.body).toBeInstanceOf(FormData);
    const form = init.body as FormData;
    expect(form.get('subject')).toBe('Redes de Computadores');
    expect(form.get('location_id')).toBe('12');
    expect(form.get('problems[0][type]')).toBe('falla_equipo');
    expect(form.get('problems[1][description]')).toBe('Faltan cables UTP.');
    expect(form.get('evidence_photo')).toBeInstanceOf(Blob);
  });

  it('marca como anteriores los informes sin problemas y arma la bandeja con filtros', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({
        data: [{ id: 1, status: 'reportado', problems: null, is_legacy: true }],
        meta: { current_page: 2, last_page: 3, per_page: 20, total: 50 },
      }),
    );

    const page = await fetchIncidentReports({ status: 'en_revision', search: 'switch', page: 2 });

    const url = spy.mock.calls[0]![0] as string;
    expect(url).toContain('status=en_revision');
    expect(url).toContain('search=switch');
    expect(page.data[0]!.is_legacy).toBe(true);
    expect(page.meta).toEqual({ currentPage: 2, lastPage: 3, perPage: 20, total: 50 });
  });

  it('el seguimiento del docente usa /mine y el cambio de estado PATCH /status', async () => {
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ data: [] }))
      .mockResolvedValueOnce(jsonResponse({ data: { id: 5, status: 'resuelto' } }));

    await fetchMyIncidentReports({ per_page: 10 });
    const updated = await updateIncidentReportStatus(5, 'resuelto');

    expect(spy.mock.calls[0]![0]).toContain('/incident-reports/mine');
    expect(spy.mock.calls[1]![0]).toContain('/incident-reports/5/status');
    expect((spy.mock.calls[1]![1] as RequestInit).method).toBe('PATCH');
    expect(updated.status).toBe('resuelto');
  });
});
