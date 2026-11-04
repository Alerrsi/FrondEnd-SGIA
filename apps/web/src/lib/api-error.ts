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

/**
 * Errores de validación (422) por campo: `{ "items.0.unit_price": "..." }` con el primer mensaje de cada campo.
 * Vacío si el error no es de validación.
 */
export function apiFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiRequestError) || !error.body?.errors) return {};
  const result: Record<string, string> = {};
  for (const [field, messages] of Object.entries(error.body.errors)) {
    if (Array.isArray(messages) && typeof messages[0] === 'string') result[field] = messages[0];
  }
  return result;
}
