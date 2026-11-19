import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FailedLoginQueryParams } from '@sgia/types';
import {
  fetchActiveSessions,
  fetchFailedLogins,
  fetchLoginActivity,
  fetchSystemHealth,
  revokeSession,
} from '../services/monitoring';

export const monitoringKeys = {
  all: ['monitoring'] as const,
  logins: (hours: number) => ['monitoring', 'logins', hours] as const,
  failedLogins: (params?: FailedLoginQueryParams) => ['monitoring', 'failed-logins', params] as const,
  sessions: (params?: { per_page?: number; page?: number }) => ['monitoring', 'sessions', params] as const,
  health: ['monitoring', 'health'] as const,
};

// Los paneles se refrescan solos: es un tablero que queda abierto.
const REFRESH_MS = 60_000;

export function useLoginActivity(hours = 24) {
  return useQuery({
    queryKey: monitoringKeys.logins(hours),
    queryFn: () => fetchLoginActivity(hours),
    placeholderData: keepPreviousData,
    refetchInterval: REFRESH_MS,
  });
}

export function useFailedLogins(params?: FailedLoginQueryParams) {
  return useQuery({
    queryKey: monitoringKeys.failedLogins(params),
    queryFn: () => fetchFailedLogins(params),
    placeholderData: keepPreviousData,
    refetchInterval: REFRESH_MS,
  });
}

export function useActiveSessions(params?: { per_page?: number; page?: number }) {
  return useQuery({
    queryKey: monitoringKeys.sessions(params),
    queryFn: () => fetchActiveSessions(params),
    placeholderData: keepPreviousData,
    refetchInterval: REFRESH_MS,
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: revokeSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: monitoringKeys.all }),
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: monitoringKeys.health,
    queryFn: fetchSystemHealth,
    refetchInterval: 30_000,
  });
}
