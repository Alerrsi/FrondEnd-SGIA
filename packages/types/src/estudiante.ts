import type { Career } from './unidad';

/**
 * Estudiante que retira préstamos presenciales (REQ-20).
 * El RUT llega normalizado `12345678-K` (sin puntos, DV en mayúscula) y es único.
 */
export interface Student {
  id: number;
  rut: string;
  full_name?: string | null;
  email?: string | null;
  career_id?: number | null;
  career?: Career | null;
  loans_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface StudentQueryParams {
  /** RUT (con o sin puntos) o nombre. */
  search?: string;
  career_id?: number;
  per_page?: number;
  page?: number;
}

export interface CreateStudentPayload {
  rut: string;
  full_name?: string | null;
  email?: string | null;
  career_id?: number | null;
}

export type UpdateStudentPayload = Partial<CreateStudentPayload>;
