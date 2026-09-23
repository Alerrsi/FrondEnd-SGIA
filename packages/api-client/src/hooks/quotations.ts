import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Cotizacion, CotizacionParams, CreateCotizacionPayload } from '@sgia/types';
import { createCotizacion, fetchQuotations } from '../services/quotations';

export const quotationKeys = {
  all: ['cotizaciones'] as const,
  list: (params?: CotizacionParams) => ['cotizaciones', 'list', params] as const,
};

export function useCotizaciones(params?: CotizacionParams) {
  return useQuery({
    queryKey: quotationKeys.list(params),
    queryFn: () => fetchQuotations(params),
  });
}

export function useCreateCotizacion() {
  const queryClient = useQueryClient();
  return useMutation<Cotizacion, Error, CreateCotizacionPayload>({
    mutationFn: createCotizacion,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: quotationKeys.all }),
  });
}