import { ApiRequestError } from '@sgia/api-client';

export { apiErrorToMessage } from '@sgia/api-client';

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
