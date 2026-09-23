import { QueryClient } from '@tanstack/react-query';

export function createSgiaQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export {
  QueryClientProvider,
  useQueryClient,
} from '@tanstack/react-query';
export type { QueryClient } from '@tanstack/react-query';