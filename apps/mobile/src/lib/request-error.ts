import { ApiRequestError, apiErrorToMessage } from '@sgia/api-client';

/** Mensaje para el usuario: validación del backend, o un texto propio para `5xx` y fallos de red. */
export function requestErrorMessage(error: unknown): string {
  if (!(error instanceof ApiRequestError)) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
  }
  if (error.status >= 500) {
    return 'El servidor tuvo un problema. Inténtalo de nuevo en unos minutos.';
  }
  return apiErrorToMessage(error);
}
