import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateStudentPayload,
  Student,
  StudentQueryParams,
  UpdateStudentPayload,
} from '@sgia/types';
import {
  createStudent,
  fetchStudent,
  fetchStudentByRut,
  fetchStudentLoans,
  fetchStudents,
  updateStudent,
  updateStudentStatus,
} from '../services/students';

export const studentKeys = {
  all: ['students'] as const,
  list: (params?: StudentQueryParams) => ['students', 'list', params] as const,
  detail: (id: number) => ['students', 'detail', id] as const,
  byRut: (rut: string) => ['students', 'by-rut', rut] as const,
  loans: (id: number, params?: { per_page?: number; page?: number }) =>
    ['students', 'loans', id, params] as const,
};

export function useStudents(params?: StudentQueryParams) {
  return useQuery({
    queryKey: studentKeys.list(params),
    queryFn: () => fetchStudents(params),
    placeholderData: keepPreviousData,
  });
}

export function useStudent(id: number | undefined) {
  return useQuery({
    queryKey: studentKeys.detail(id ?? 0),
    queryFn: () => fetchStudent(id as number),
    enabled: id !== undefined,
  });
}

/**
 * Búsqueda exacta por RUT para el checkout. El dato es `null` cuando el estudiante no existe (404),
 * que es un resultado normal del flujo: no cuenta como error de la consulta.
 */
export function useStudentByRut(rut: string | undefined) {
  return useQuery<Student | null>({
    queryKey: studentKeys.byRut(rut ?? ''),
    queryFn: () => fetchStudentByRut(rut as string),
    enabled: Boolean(rut),
    retry: false,
    staleTime: 0,
  });
}

export function useStudentLoans(
  id: number | undefined,
  params?: { per_page?: number; page?: number },
) {
  return useQuery({
    queryKey: studentKeys.loans(id ?? 0, params),
    queryFn: () => fetchStudentLoans(id as number, params),
    enabled: id !== undefined,
    placeholderData: keepPreviousData,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation<Student, Error, CreateStudentPayload>({
    mutationFn: createStudent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: studentKeys.all }),
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation<Student, Error, { id: number; payload: UpdateStudentPayload }>({
    mutationFn: ({ id, payload }) => updateStudent(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: studentKeys.all }),
  });
}

export function useUpdateStudentStatus() {
  const queryClient = useQueryClient();
  return useMutation<Student, Error, { id: number; isActive: boolean }>({
    mutationFn: ({ id, isActive }) => updateStudentStatus(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: studentKeys.all }),
  });
}
