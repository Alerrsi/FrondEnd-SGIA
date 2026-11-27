import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateReportSubscriptionPayload, UpdateReportSubscriptionPayload } from '@sgia/types';
import {
  createReportSubscription,
  deleteReportSubscription,
  fetchReportSubscriptions,
  sendReportSubscription,
  updateReportSubscription,
} from '../services/report-subscriptions';

export const reportSubscriptionKeys = {
  all: ['report-subscriptions'] as const,
};

export function useReportSubscriptions(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: reportSubscriptionKeys.all,
    queryFn: fetchReportSubscriptions,
    enabled: options?.enabled ?? true,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: reportSubscriptionKeys.all });
}

export function useCreateReportSubscription() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: CreateReportSubscriptionPayload) => createReportSubscription(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateReportSubscription() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateReportSubscriptionPayload & { id: number }) =>
      updateReportSubscription(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteReportSubscription() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: number) => deleteReportSubscription(id), onSuccess: invalidate });
}

export function useSendReportSubscription() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: number) => sendReportSubscription(id), onSuccess: invalidate });
}
