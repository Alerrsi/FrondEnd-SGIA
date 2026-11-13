import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type {
  ChartTemplate,
  CreateDashboardTemplatePayload,
  CreateUserChartPayload,
  DashboardTemplate,
  UpdateDashboardTemplatePayload,
  UpdateUserChartPayload,
  UserChart,
  UserChartPosition,
  UserChartQueryParams,
} from '@sgia/types';
import {
  createMyChart,
  createMyDashboardTemplate,
  deleteMyChart,
  deleteMyDashboardTemplate,
  fetchChartTemplates,
  fetchMyCharts,
  fetchMyDashboardTemplates,
  updateMyDashboardTemplate,
  updateMyChart,
  updateMyChartPositions,
} from '../services/dashboard-charts';

export const chartKeys = {
  all: ['my-charts'] as const,
  templates: ['chart-templates'] as const,
  dashboardTemplates: ['my-dashboard-templates'] as const,
  list: (params?: UserChartQueryParams) => ['my-charts', 'list', params] as const,
};

/** Los gráficos cambian el `charts_count` de las plantillas de dashboard. */
function invalidateCharts(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: chartKeys.dashboardTemplates });
  return queryClient.invalidateQueries({ queryKey: chartKeys.all });
}

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
    onSuccess: () => invalidateCharts(queryClient),
  });
}

export function useUpdateMyChart() {
  const queryClient = useQueryClient();
  return useMutation<UserChart, Error, { id: number; payload: UpdateUserChartPayload }>({
    mutationFn: ({ id, payload }) => updateMyChart(id, payload),
    onSuccess: () => invalidateCharts(queryClient),
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
    { positions: UserChartPosition[]; dashboardTemplateId?: number | null },
    { previous: Array<[readonly unknown[], UserChart[] | undefined]> }
  >({
    mutationFn: ({ positions, dashboardTemplateId }) =>
      updateMyChartPositions(positions, dashboardTemplateId),
    onMutate: async ({ positions }) => {
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
    onSettled: () => invalidateCharts(queryClient),
  });
}

export function useDeleteMyChart() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: deleteMyChart,
    onSuccess: () => invalidateCharts(queryClient),
  });
}

/** Plantillas de dashboard con nombre del usuario (cada una con hasta 9 gráficos). */
export function useMyDashboardTemplates() {
  return useQuery<DashboardTemplate[]>({
    queryKey: chartKeys.dashboardTemplates,
    queryFn: fetchMyDashboardTemplates,
  });
}

export function useCreateMyDashboardTemplate() {
  const queryClient = useQueryClient();
  return useMutation<DashboardTemplate, Error, CreateDashboardTemplatePayload>({
    mutationFn: createMyDashboardTemplate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chartKeys.dashboardTemplates }),
  });
}

export function useUpdateMyDashboardTemplate() {
  const queryClient = useQueryClient();
  return useMutation<DashboardTemplate, Error, { id: number; payload: UpdateDashboardTemplatePayload }>({
    mutationFn: ({ id, payload }) => updateMyDashboardTemplate(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chartKeys.dashboardTemplates }),
  });
}

export function useDeleteMyDashboardTemplate() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: deleteMyDashboardTemplate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chartKeys.dashboardTemplates });
      return queryClient.invalidateQueries({ queryKey: chartKeys.all });
    },
  });
}
