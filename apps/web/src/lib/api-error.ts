import { ApiRequestError } from '@sgia/api-client';

export function apiErrorToMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return error.body?.message ?? `Error ${error.status}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Error inesperado';
}