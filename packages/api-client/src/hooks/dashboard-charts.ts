import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ChartTemplate,
  CreateUserChartPayload,
  UpdateUserChartPayload,
  UserChart,
  UserChartPosition,
  UserChartQueryParams,
} from '@sgia/types';
import {
  createMyChart,
  deleteMyChart,
  fetchChartTemplates,
  fetchMyCharts,
  updateMyChart,
  updateMyChartPositions,
} from '../services/dashboard-charts';

export const chartKeys = {
  all: ['my-charts'] as const,
  templates: ['chart-templates'] as const,
  list: (params?: UserChartQueryParams) => ['my-charts', 'list', params] as const,
};

/** Las plantillas están sembradas en el backend y casi nunca cambian. */
export function useChartTemplates() {
  return useQuery<ChartTemplate[]>({
    queryKey: chartKeys.templates,
    queryFn: fetchChartTemplates,
    staleTime: 1000 * 60 * 30,
  });
}

export function useMyCharts(params?: UserChartQueryParams) {
  return useQuery<UserChart[]>({
    queryKey: chartKeys.list(params),
    queryFn: () => fetchMyCharts(params),
  });
}

export function useCreateMyChart() {
  const queryClient = useQueryClient();
  return useMutation<UserChart, Error, CreateUserChartPayload>({
    mutationFn: createMyChart,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chartKeys.all }),
  });
}

export function useUpdateMyChart() {
  const queryClient = useQueryClient();
  return useMutation<UserChart, Error, { id: number; payload: UpdateUserChartPayload }>({
    mutationFn: ({ id, payload }) => updateMyChart(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chartKeys.all }),
  });
}

/**
 * Reordena con actualización optimista: el panel responde al soltar y, si el backend rechaza
 * (`422`: id ajeno o posición repetida), se restaura el orden anterior.
 */
export function useUpdateMyChartPositions() {
  const queryClient = useQueryClient();
  return useMutation<
    UserChart[],
    Error,
    UserChartPosition[],
    { previous: Array<[readonly unknown[], UserChart[] | undefined]> }
  >({
    mutationFn: updateMyChartPositions,
    onMutate: async (positions) => {
      await queryClient.cancelQueries({ queryKey: chartKeys.all });
      const previous = queryClient.getQueriesData<UserChart[]>({ queryKey: chartKeys.all });
      const byId = new Map(positions.map((p) => [p.id, p.position]));
      queryClient.setQueriesData<UserChart[]>({ queryKey: chartKeys.all }, (charts) =>
        charts
          ?.map((chart) => ({ ...chart, position: byId.get(chart.id) ?? chart.position }))
          .sort((a, b) => a.position - b.position),
      );
      return { previous };
    },
    onError: (_error, _positions, context) => {
      for (const [key, data] of context?.previous ?? []) queryClient.setQueryData(key, data);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: chartKeys.all }),
  });
}

export function useDeleteMyChart() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: deleteMyChart,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chartKeys.all }),
  });
}
