import type { ApiError } from '@sgia/types';

export interface TokenStorage {
  getToken(): string | null | Promise<string | null>;
  setToken(token: string): void | Promise<void>;
  clearToken(): void | Promise<void>;
}

export interface ApiClientOptions {
  baseUrl: string;
  tokenStorage?: TokenStorage;
  onUnauthorized?: () => void;
  /** Solo en desarrollo: registra en consola los errores que `apiErrorToMessage` oculta al usuario. */
  debug?: boolean;
}

const defaultOptions: ApiClientOptions = {
  baseUrl: '/api',
};

let clientOptions: ApiClientOptions = defaultOptions;

export function configureApiClient(options: Partial<ApiClientOptions>): void {
  clientOptions = { ...clientOptions, ...options };
}

export function getApiClientOptions(): ApiClientOptions {
  return clientOptions;
}

async function resolveToken(): Promise<string | null> {
  if (!clientOptions.tokenStorage) return null;
  return clientOptions.tokenStorage.getToken();
}

function buildUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const base = clientOptions.baseUrl.replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');
  if (base.endsWith('/api') && cleanPath.startsWith('api/')) {
    return `${base.slice(0, -4)}/${cleanPath}`;
  }
  return `${base}/${cleanPath}`;
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly body: ApiError | null;

  constructor(status: number, body: ApiError | null) {
    super(body?.message ?? `Error HTTP ${status}`);
    this.name = 'ApiRequestError';
    this.status = status;
    this.body = body;
  }
}

const SERVER_ERROR_MESSAGE = 'Ocurrió un error en el servidor. Intenta nuevamente o contacta al administrador.';
const NETWORK_ERROR_MESSAGE = 'No se pudo conectar con el servidor. Revisa tu conexión e intenta nuevamente.';
const UNEXPECTED_ERROR_MESSAGE = 'Ocurrió un error inesperado. Intenta nuevamente.';

const STATUS_MESSAGES: Record<number, string> = {
  401: 'Tu sesión expiró. Inicia sesión nuevamente.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'Recurso no encontrado.',
  413: 'El archivo es demasiado grande.',
  429: 'Demasiadas solicitudes. Espera un momento e intenta de nuevo.',
};

/**
 * Mensaje para el usuario: el primer error de validación o, si no hay, el del servidor.
 *
 * Auditoría de seguridad (BackEnd-SGIA/docs/auditoria-seguridad.md, F1): nunca muestra el cuerpo de un 5xx
 * (con APP_DEBUG trae SQL y trazas) ni el texto de errores de JavaScript o de red (`Failed to fetch`,
 * `Unexpected token '<'`, `Cannot read properties of undefined`); esos van a la consola solo en desarrollo.
 */
export function apiErrorToMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status >= 500) {
      logInDev(error);
      return SERVER_ERROR_MESSAGE;
    }
    if (error.body?.errors && typeof error.body.errors === 'object') {
      const firstKey = Object.keys(error.body.errors)[0];
      const errorList = firstKey ? (error.body.errors as Record<string, unknown>)[firstKey] : null;
      if (Array.isArray(errorList) && typeof errorList[0] === 'string') {
        return errorList[0];
      }
    }
    const message = error.body?.message;
    if (typeof message === 'string' && message.trim() !== '') return message;
    return STATUS_MESSAGES[error.status] ?? 'No se pudo completar la solicitud.';
  }
  if (error instanceof TypeError && /fetch|network|load failed/i.test(error.message)) {
    logInDev(error);
    return NETWORK_ERROR_MESSAGE;
  }
  if (error instanceof Error && error.constructor === Error && error.message.trim() !== '') {
    // Errores propios (`throw new Error('…')`) con texto pensado para el usuario.
    return error.message;
  }
  logInDev(error);
  return UNEXPECTED_ERROR_MESSAGE;
}

function logInDev(error: unknown): void {
  if (clientOptions.debug) console.warn('[api] error no mostrado al usuario:', error);
}

/**
 * Un 401 siempre termina la sesión. Un 403 solo si la cuenta fue desactivada y había un
 * token en uso: sin token es el intento de login, donde el formulario muestra el mensaje.
 */
function endsSession(status: number, body: ApiError | null, token: string | null): boolean {
  if (status === 401) return true;
  return status === 403 && body?.code === 'account_inactive' && Boolean(token);
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await resolveToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path), { ...options, headers });

  if (!response.ok) {
    let body: ApiError | null = null;
    try {
      body = (await response.json()) as ApiError;
    } catch {
      body = null;
    }

    if (endsSession(response.status, body, token)) {
      clientOptions.onUnauthorized?.();
    }

    throw new ApiRequestError(response.status, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/** Firefox fija la orientación según el tamaño de página y la impresora térmica la gira: pide la etiqueta ya en vertical. */
export function labelQuery(): string {
  return typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent ?? '') ? '?orientation=portrait' : '';
}

export interface BlobResponse {
  blob: Blob;
  headers: Headers;
}

/** Como `getBlob`, pero entrega también las cabeceras (nombre del archivo, avisos del reporte). */
export async function getBlobResponse(
  path: string,
  options?: RequestInit,
): Promise<BlobResponse> {
  const token = await resolveToken();
  const headers: Record<string, string> = {
    Accept: 'application/pdf, application/octet-stream, */*',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path), { ...options, method: 'GET', headers });

  if (!response.ok) {
    let body: ApiError | null = null;
    try {
      body = (await response.json()) as ApiError;
    } catch {
      body = null;
    }

    if (endsSession(response.status, body, token)) {
      clientOptions.onUnauthorized?.();
    }

    throw new ApiRequestError(response.status, body);
  }

  return { blob: await response.blob(), headers: response.headers ?? new Headers() };
}

export async function getBlob(
  path: string,
  options?: RequestInit,
): Promise<Blob> {
  return (await getBlobResponse(path, options)).blob;
}

export const get = <T>(path: string, options?: RequestInit) =>
  request<T>(path, { ...options, method: 'GET' });

export const post = <TBody, TResponse>(
  path: string,
  body?: TBody,
  options?: RequestInit,
) =>
  request<TResponse>(path, {
    ...options,
    method: 'POST',
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  });

export const put = <TBody, TResponse>(
  path: string,
  body?: TBody,
  options?: RequestInit,
) =>
  request<TResponse>(path, {
    ...options,
    method: 'PUT',
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  });

export const patch = <TBody, TResponse>(
  path: string,
  body?: TBody,
  options?: RequestInit,
) =>
  request<TResponse>(path, {
    ...options,
    method: 'PATCH',
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  });

export const del = <T>(path: string, options?: RequestInit) =>
  request<T>(path, { ...options, method: 'DELETE' });
