import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ApiRequestError,
  checkoutLoan,
  useCreateStudent,
  useStudentByRut,
  useStudents,
} from '@sgia/api-client';

const jsonResponse = (body: unknown, status = 200) =>
  ({ ok: status < 400, status, json: async () => body }) as Response;

const rawStudent = {
  id: 7,
  rut: '12345678-5',
  full_name: 'Ana Pérez',
  email: 'ana@inacap.cl',
  career_id: 2,
  career: { id: 2, name: 'Ingeniería en Informática', code: 'II', level: 'profesional' },
  loans_count: '3',
};

describe('Estudiantes (REQ-20): cliente API', () => {
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

  it('useStudents arma el query string y convierte la meta de Laravel', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({
        data: [rawStudent],
        meta: { current_page: 2, last_page: 3, per_page: 10, total: 25 },
      }),
    );

    const { result } = renderHook(
      () => useStudents({ search: '12.345', career_id: 2, page: 2, per_page: 10 }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const url = String(mockFetch.mock.calls[0]?.[0]);
    expect(url).toContain('/students?');
    expect(url).toContain('search=12.345');
    expect(url).toContain('career_id=2');
    expect(result.current.data?.data[0]?.loans_count).toBe(3);
    expect(result.current.data?.meta).toEqual({ currentPage: 2, lastPage: 3, perPage: 10, total: 25 });
  });

  it('useStudentByRut devuelve el estudiante cuando existe (200)', async () => {
    const mockFetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ data: rawStudent }));

    const { result } = renderHook(() => useStudentByRut('12.345.678-5'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(String(mockFetch.mock.calls[0]?.[0])).toContain('/students/by-rut/12.345.678-5');
    expect(result.current.data?.full_name).toBe('Ana Pérez');
    expect(result.current.data?.career?.code).toBe('II');
  });

  it('useStudentByRut devuelve null (sin error) cuando el RUT no existe (404)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({ message: 'Recurso no encontrado.' }, 404),
    );

    const { result } = renderHook(() => useStudentByRut('98765432-1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeNull();
    expect(result.current.isError).toBe(false);
  });

  it('useStudentByRut propaga errores distintos de 404', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({ message: 'Acceso denegado.' }, 403),
    );

    const { result } = renderHook(() => useStudentByRut('12345678-5'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiRequestError);
  });

  it('useStudentByRut no consulta sin RUT', () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch');
    const { result } = renderHook(() => useStudentByRut(undefined), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('useCreateStudent envía el RUT y refresca el árbol de estudiantes', async () => {
    const mockFetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ data: rawStudent }, 201));
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateStudent(), { wrapper });
    const created = await result.current.mutateAsync({ rut: '12345678-5', full_name: 'Ana Pérez' });

    const call = mockFetch.mock.calls[0];
    expect(String(call?.[0])).toContain('/students');
    expect(call?.[1]?.method).toBe('POST');
    expect(JSON.parse(String(call?.[1]?.body))).toEqual({ rut: '12345678-5', full_name: 'Ana Pérez' });
    expect(created.id).toBe(7);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['students'] });
  });
});

describe('Checkout presencial con estudiante (§10)', () => {
  beforeEach(() => vi.restoreAllMocks());

  const loanResponse = jsonResponse({
    data: {
      id: 90,
      code: 'PRE-2026-000090',
      status: 'procesado',
      student_id: 7,
      student: rawStudent,
      borrower_name: 'Ana Pérez',
      items: [],
    },
  });

  const bodyOf = (spy: ReturnType<typeof vi.spyOn>) =>
    JSON.parse(String((spy.mock.calls[0]?.[1] as RequestInit).body)) as Record<string, unknown>;

  it('con student_id envía solo el id y no exige borrower_name', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(loanResponse);

    const loan = await checkoutLoan({
      student_id: 7,
      career_id: 2,
      items: [{ product_id: 3, quantity: 2, unit_ids: [11, 12] }],
      subject: 'Redes',
    });

    const body = bodyOf(spy);
    expect(body.student_id).toBe(7);
    expect(body.career_id).toBe(2);
    expect(body).not.toHaveProperty('student_rut');
    expect(body).not.toHaveProperty('borrower_name');
    expect(body.items).toEqual([{ product_id: 3, quantity: 2, unit_ids: [11, 12] }]);
    // La respuesta trae el estudiante y el nombre sale de él.
    expect(loan.student_id).toBe(7);
    expect(loan.student?.rut).toBe('12345678-5');
    expect(loan.solicitanteNombre).toBe('Ana Pérez');
  });

  it('con student_rut nuevo envía el RUT y el nombre opcional', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(loanResponse);

    await checkoutLoan({
      student_rut: '98765432-1',
      career_id: 2,
      borrower_name: 'Luis Soto',
      items: [{ product_id: 3, quantity: 1 }],
    });

    const body = bodyOf(spy);
    expect(body.student_rut).toBe('98765432-1');
    expect(body.borrower_name).toBe('Luis Soto');
    expect(body).not.toHaveProperty('student_id');
  });

  it('student_id y student_rut son excluyentes: prevalece student_id', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(loanResponse);

    await checkoutLoan({
      student_id: 7,
      student_rut: '12345678-5',
      career_id: 2,
      items: [{ product_id: 3, quantity: 1 }],
    });

    const body = bodyOf(spy);
    expect(body.student_id).toBe(7);
    expect(body).not.toHaveProperty('student_rut');
  });

  it('sin estudiante conserva el flujo de docente (nombre + documento)', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(loanResponse);

    await checkoutLoan({
      docente_run: '11111111-1',
      career_id: 2,
      items: [{ product_id: 3, quantity: 1 }],
      due_date: '2026-11-20',
    });

    const body = bodyOf(spy);
    expect(body.borrower_name).toBe('11111111-1');
    expect(body.borrower_document).toBe('11111111-1');
    expect(body.due_date).toBe('2026-11-20');
    expect(body).not.toHaveProperty('student_id');
  });
});
