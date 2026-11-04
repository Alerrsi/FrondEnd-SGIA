import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createUsuario,
  updateUsuario,
  useAuditLogs,
  useCreateStoreroom,
  useRoles,
  useStorerooms,
  useUsers,
} from '@sgia/api-client';

const jsonResponse = (body: unknown, status = 200) =>
  ({ ok: status < 400, status, json: async () => body }) as Response;

describe('Administración: usuarios, pañoles, roles y auditoría', () => {
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

  const rawUser = {
    id: 5,
    name: 'Marta Díaz',
    email: 'marta@inacap.cl',
    role: 'PAN-01',
    is_active: true,
    storeroom_id: 'PAN-TEMUCO',
    careers: [{ id: 2, name: 'Ingeniería en Informática', code: 'II', level: 'profesional' }],
  };

  it('useUsers filtra por pañol y carrera y normaliza storeroom_id y careers', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({ data: [rawUser], meta: { current_page: 1, last_page: 1, per_page: 10, total: 1 } }),
    );

    const { result } = renderHook(() => useUsers({ storeroom_id: 'PAN-TEMUCO', career_id: 2 }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const url = String(mockFetch.mock.calls[0]?.[0]);
    expect(url).toContain('storeroom_id=PAN-TEMUCO');
    expect(url).toContain('career_id=2');
    const user = result.current.data?.data[0];
    expect(user?.storeroom_id).toBe('PAN-TEMUCO');
    expect(user?.careers?.[0]?.code).toBe('II');
    expect(user?.rol).toBe('PAN-01');
  });

  it('createUsuario envía storeroom_id y career_ids (y no los campos antiguos)', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(jsonResponse({ data: rawUser }, 201));

    await createUsuario({
      nombre: 'Marta Díaz',
      email: 'marta@inacap.cl',
      rol: 'PAN-01',
      password: 'Clave1234',
      storeroom_id: 'PAN-TEMUCO',
      career_ids: [2, 3],
    });

    const body = JSON.parse(String(mockFetch.mock.calls[0]?.[1]?.body)) as Record<string, unknown>;
    expect(body.storeroom_id).toBe('PAN-TEMUCO');
    expect(body.career_ids).toEqual([2, 3]);
    expect(body).not.toHaveProperty('panol_id');
    expect(body).not.toHaveProperty('carreras');
  });

  it('updateUsuario: storeroom_id null lo quita y career_ids ausente no toca las carreras', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(jsonResponse({ data: rawUser }));

    await updateUsuario(5, { nombre: 'Marta D.', storeroom_id: null });

    const body = JSON.parse(String(mockFetch.mock.calls[0]?.[1]?.body)) as Record<string, unknown>;
    expect(body.storeroom_id).toBeNull();
    expect(body).not.toHaveProperty('career_ids');
  });

  it('useStorerooms pagina y convierte los contadores', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({
        data: [
          { id: 1, name: 'Pañol TI Temuco', code: 'PAN-TEMUCO', locations_count: '4', users_count: 2 },
        ],
        meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
      }),
    );

    const { result } = renderHook(() => useStorerooms({ search: 'temuco' }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(String(mockFetch.mock.calls[0]?.[0])).toContain('/storerooms?search=temuco');
    expect(result.current.data?.data[0]).toMatchObject({
      code: 'PAN-TEMUCO',
      locations_count: 4,
      users_count: 2,
    });
  });

  it('useCreateStoreroom envía los datos e invalida el listado', async () => {
    const mockFetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ data: { id: 2, name: 'Bodega Norte', code: 'BOD-NORTE' } }, 201));
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateStoreroom(), { wrapper });
    await result.current.mutateAsync({ name: 'Bodega Norte', code: 'bod-norte' });

    expect(JSON.parse(String(mockFetch.mock.calls[0]?.[1]?.body))).toEqual({
      name: 'Bodega Norte',
      code: 'bod-norte',
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['storerooms'] });
  });

  it('useRoles acepta la respuesta envuelta en data', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({ data: [{ id: 1, code: 'AD-01', name: 'Administrador' }] }),
    );
    const { result } = renderHook(() => useRoles(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]?.code).toBe('AD-01');
  });

  it('useAuditLogs filtra por acción con prefijo y por autor', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({
        data: [
          {
            id: 1,
            action: 'user.role_changed',
            auditable_type: 'user',
            auditable_id: 5,
            user: { id: 1, name: 'Admin' },
            created_at: '2026-11-03T12:00:00+00:00',
          },
        ],
        meta: { current_page: 1, last_page: 1, per_page: 20, total: 1 },
      }),
    );

    const { result } = renderHook(
      () => useAuditLogs({ action: 'user.', auditable_type: 'user', user_id: 1, from: '2026-11-01' }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const url = String(mockFetch.mock.calls[0]?.[0]);
    expect(url).toContain('/audit-logs?');
    expect(url).toContain('action=user.');
    expect(url).toContain('auditable_type=user');
    expect(url).toContain('user_id=1');
    expect(result.current.data?.data[0]?.action).toBe('user.role_changed');
  });
});
