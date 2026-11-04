import type {
  Career,
  CreateStudentPayload,
  PaginatedResponse,
  Prestamo,
  Student,
  StudentQueryParams,
  UpdateStudentPayload,
} from '@sgia/types';
import { ApiRequestError, del, get, patch, post } from '../http';
import { normalizePrestamo } from './loans';
import { buildQuery, toPaginated, unwrap, type RawPaginated } from './shared';

// Estudiantes (FU-04 / REQ-20). Lectura y escritura: PAN-01 y AD-01; borrado solo AD-01.

export interface RawStudent {
  id: number;
  rut: string;
  full_name?: string | null;
  email?: string | null;
  career_id?: number | null;
  career?: Career | null;
  loans_count?: number | string | null;
  created_at?: string;
  updated_at?: string;
}

export function normalizeStudent(raw: RawStudent): Student {
  return {
    id: raw.id,
    rut: raw.rut,
    full_name: raw.full_name ?? null,
    email: raw.email ?? null,
    career_id: raw.career_id ?? raw.career?.id ?? null,
    career: raw.career ?? null,
    loans_count: raw.loans_count === undefined || raw.loans_count === null ? undefined : Number(raw.loans_count),
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

export async function fetchStudents(
  params?: StudentQueryParams,
): Promise<PaginatedResponse<Student>> {
  const res = await get<RawPaginated<RawStudent>>(`/students${buildQuery(params)}`);
  return toPaginated(res, normalizeStudent);
}

/**
 * Búsqueda exacta para el checkout. Acepta `12.345.678-5`, `12345678-5` o `123456785`.
 * Devuelve `null` si el estudiante no existe (404): es un resultado esperado del flujo, no un error.
 */
export async function fetchStudentByRut(rut: string): Promise<Student | null> {
  try {
    const res = await get<{ data?: RawStudent } | RawStudent>(
      `/students/by-rut/${encodeURIComponent(rut.trim())}`,
    );
    return normalizeStudent(unwrap(res));
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return null;
    throw error;
  }
}

export async function fetchStudent(id: number): Promise<Student> {
  return normalizeStudent(unwrap(await get<{ data?: RawStudent } | RawStudent>(`/students/${id}`)));
}

export async function createStudent(payload: CreateStudentPayload): Promise<Student> {
  return normalizeStudent(
    unwrap(await post<CreateStudentPayload, { data?: RawStudent } | RawStudent>('/students', payload)),
  );
}

export async function updateStudent(id: number, payload: UpdateStudentPayload): Promise<Student> {
  return normalizeStudent(
    unwrap(
      await patch<UpdateStudentPayload, { data?: RawStudent } | RawStudent>(
        `/students/${id}`,
        payload,
      ),
    ),
  );
}

/** `422` (`errors.student`) si el estudiante tiene préstamos. */
export async function deleteStudent(id: number): Promise<void> {
  await del<void>(`/students/${id}`);
}

/** Historial de préstamos del estudiante (paginado, más reciente primero; mismo formato que `GET /api/loans`). */
export async function fetchStudentLoans(
  id: number,
  params?: { per_page?: number; page?: number },
): Promise<PaginatedResponse<Prestamo>> {
  const res = await get<RawPaginated<Record<string, unknown>>>(
    `/students/${id}/loans${buildQuery(params)}`,
  );
  return toPaginated(res, normalizePrestamo);
}
