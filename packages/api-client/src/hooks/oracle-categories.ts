import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateOracleCategoryPayload, OracleCategory } from '@sgia/types';
import { createOracleCategory, fetchOracleCategories } from '../services/oracle-categories';

export const oracleCategoryKeys = {
  all: ['oracle-categories'] as const,
};

export function useOracleCategories() {
  return useQuery({
    queryKey: oracleCategoryKeys.all,
    queryFn: fetchOracleCategories,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateOracleCategory() {
  const queryClient = useQueryClient();
  return useMutation<OracleCategory, Error, CreateOracleCategoryPayload>({
    mutationFn: createOracleCategory,
    onSuccess: (created) => {
      // La nueva queda disponible al instante en el selector, ordenada por nombre.
      queryClient.setQueryData<OracleCategory[]>(oracleCategoryKeys.all, (prev) =>
        [...(prev ?? []).filter((c) => c.id !== created.id), created].sort((a, b) =>
          a.name.localeCompare(b.name, 'es'),
        ),
      );
      queryClient.invalidateQueries({ queryKey: oracleCategoryKeys.all });
    },
  });
}
