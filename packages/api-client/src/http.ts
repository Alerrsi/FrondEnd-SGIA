import type { ApiError } from '@sgia/types';

export interface TokenStorage {
  getToken(): string | null | Promise<string | null>;
  setToken(token: string): void | Promise<void>;
  clearToken(): void | Promise<void>;
}

export interface ApiClientOptions {
  baseUrl: string;
  tokenStorage?: TokenStorage;
}

const defaultOptions: ApiClientOptions = {
  baseUrl: '/api/v1',
};

let clientOptions: ApiClientOptions = defaultOptions;

export function configureApiClient(options: Partial<ApiClientOptions>): void {
  clientOptions = { ...defaultOptions, ...options };
}

async function resolveToken(): Promise<string | null> {
  if (!clientOptions.tokenStorage) return null;
  return clientOptions.tokenStorage.getToken();
}

function buildUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${clientOptions.baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
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
    throw new ApiRequestError(response.status, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
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
    body: body === undefined ? undefined : JSON.stringify(body),
  });

export const put = <TBody, TResponse>(
  path: string,
  body?: TBody,
  options?: RequestInit,
) =>
  request<TResponse>(path, {
    ...options,
    method: 'PUT',
    body: body === undefined ? undefined : JSON.stringify(body),
  });

export const patch = <TBody, TResponse>(
  path: string,
  body?: TBody,
  options?: RequestInit,
) =>
  request<TResponse>(path, {
    ...options,
    method: 'PATCH',
    body: body === undefined ? undefined : JSON.stringify(body),
  });

export const del = <T>(path: string, options?: RequestInit) =>
  request<T>(path, { ...options, method: 'DELETE' });