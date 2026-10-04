import { ApiRequestError } from '@sgia/api-client';

export function apiErrorToMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.body?.errors && typeof error.body.errors === 'object') {
      const firstKey = Object.keys(error.body.errors)[0];
      const errorList = firstKey ? (error.body.errors as Record<string, unknown>)[firstKey] : null;
      if (Array.isArray(errorList) && typeof errorList[0] === 'string') {
        return errorList[0];
      }
    }
    return error.body?.message ?? `Error ${error.status}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Error inesperado';
}
