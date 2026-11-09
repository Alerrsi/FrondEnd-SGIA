import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError, configureApiClient, get, getBlob, post } from '@sgia/api-client';

const INACTIVE = {
  message: 'Tu cuenta ha sido desactivada. Contacta al administrador.',
  code: 'account_inactive',
};

function respondWith(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(body), { status })),
  );
}

describe('Cuenta desactivada (403 account_inactive)', () => {
  const onUnauthorized = vi.fn();
  let token: string | null;

  beforeEach(() => {
    onUnauthorized.mockClear();
    token = 'token-vigente';
    configureApiClient({
      baseUrl: '/api',
      onUnauthorized,
      tokenStorage: {
        getToken: () => token,
        setToken: () => undefined,
        clearToken: () => undefined,
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('cierra la sesión cuando un token ya emitido recibe account_inactive', async () => {
    respondWith(403, INACTIVE);

    await expect(get('/products')).rejects.toBeInstanceOf(ApiRequestError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('también cierra la sesión al descargar un archivo', async () => {
    respondWith(403, INACTIVE);

    await expect(getBlob('/loans/export')).rejects.toBeInstanceOf(ApiRequestError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('un 403 sin ese código es falta de permisos y no cierra la sesión', async () => {
    respondWith(403, { message: 'No autorizado.' });

    await expect(get('/users')).rejects.toBeInstanceOf(ApiRequestError);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('en el login, sin token, conserva el mensaje del servidor y no cierra sesión', async () => {
    token = null;
    respondWith(403, INACTIVE);

    await expect(post('/login', { email: 'a@sgia.cl' })).rejects.toThrow(INACTIVE.message);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
