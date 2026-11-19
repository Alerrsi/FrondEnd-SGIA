import { beforeEach, describe, expect, it, vi } from 'vitest';
import { devicesApi } from '@sgia/api-client';

const response = (status: number, body?: unknown) =>
  ({
    ok: status < 400,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => body,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  }) as Response;

describe('devicesApi (push del móvil)', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('registra el token con POST /devices y devuelve el id', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(response(201, { id: 7, platform: 'android' }));

    const device = await devicesApi.registerDevice('ExponentPushToken[abc]', 'android');

    expect(device.id).toBe(7);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toMatch(/\/devices$/);
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({ token: 'ExponentPushToken[abc]', platform: 'android' });
  });

  it('elimina el token con DELETE /devices/{id}', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(response(204));

    await devicesApi.unregisterDevice(7);

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toMatch(/\/devices\/7$/);
    expect(init?.method).toBe('DELETE');
  });
});
