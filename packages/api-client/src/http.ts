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
    super(body?.message ?? `Error ${status}`);
    this.status = status;
    this.body = body;
  }
}

/** Mensaje para el usuario: el primer error de validación o, si no hay, el del servidor. */
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

export async function getBlob(
  path: string,
  options?: RequestInit,
): Promise<Blob> {
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

  return response.blob();
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
