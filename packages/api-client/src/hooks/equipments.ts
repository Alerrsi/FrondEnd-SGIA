import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateNovedadPayload, Novedad } from '@sgia/types';
import { createNovedad, fetchEquipo, fetchEquipos } from '../services/equipments';

export const equipmentKeys = {
  all: ['equipos'] as const,
  detail: (id: number) => ['equipos', 'detail', id] as const,
};

export function useEquipos() {
  return useQuery({
    queryKey: equipmentKeys.all,
    queryFn: fetchEquipos,
  });
}

export function useEquipo(id: number | undefined) {
  return useQuery({
    queryKey: equipmentKeys.detail(id!),
    queryFn: () => fetchEquipo(id!),
    enabled: id !== undefined,
  });
}

export function useCreateNovedad() {
  const queryClient = useQueryClient();
  return useMutation<Novedad, Error, CreateNovedadPayload>({
    mutationFn: createNovedad,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: equipmentKeys.all }),
  });
}