import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { CategoryQueryParams } from '@sgia/types';
import { fetchCategories } from '../services/categories';

export const categoryKeys = {
  list: (params?: CategoryQueryParams) => ['categories', 'list', params] as const,
};

export function useCategories(params?: CategoryQueryParams) {
  return useQuery({
    queryKey: categoryKeys.list(params),
    queryFn: () => fetchCategories(params),
    placeholderData: keepPreviousData,
  });
}
