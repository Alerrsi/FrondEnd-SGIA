import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  configureApiClient,
  fetchCajones,
  fetchEstanteContenido,
  fetchSalaMapa,
  estanteKeys,
  salaMapaKeys,
  useUpdateCajon,
  useUpdateEstante,
} from '@sgia/api-client';
import type { SalaMapa } from '@sgia/types';

const MAP: SalaMapa = {
  location: {
    id: 7,
    code: 'L206',
    nombre: 'Laboratorio 206',
    tipo: 'sala',
    map_width_cm: 1000,
    map_height_cm: 600,
    has_dimensions: false,
  },
  zonas: [{ id: 1, location_id: 7, nombre: 'Zona A', x: 0, y: 0, width: 400, depth: 400 }],
  estantes: [
    {
      id: 3,
      location_id: 7,
      zona_id: 1,
      codigo: 'EST-A1',
      nombre: null,
      descripcion: null,
      x: 10,
      y: 20,
      width: 200,
      depth: 60,
      rotation: 0,
      cajones: [],
      items_count: 0,
      has_critical_stock: false,
    },
  ],
  cajones_sin_estante_count: 2,
};

function respond(status: number, body: unknown) {
  return vi.fn(async () => new Response(status === 204 ? null : JSON.stringify(body), { status }));
}

describe('Servicios y hooks del mapa de salas (REQ-22)', () => {
  beforeEach(() => {
    configureApiClient({
      baseUrl: '/api',
      onUnauthorized: vi.fn(),
      tokenStorage: { getToken: () => 'token', setToken: () => undefined, clearToken: () => undefined },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normaliza el plano de la sala', async () => {
    const fetchMock = respond(200, {
      data: { ...MAP, estantes: [{ ...MAP.estantes[0]!, rotation: '90', cajones: undefined }] },
    });
    vi.stubGlobal('fetch', fetchMock);

    const map = await fetchSalaMapa(7);

    expect(fetchMock).toHaveBeenCalledWith('/api/locations/7/map', expect.objectContaining({ method: 'GET' }));
    expect(map.location.code).toBe('L206');
    expect(map.estantes[0]?.rotation).toBe(90);
    expect(map.estantes[0]?.cajones).toEqual([]);
    expect(map.cajones_sin_estante_count).toBe(2);
  });

  it('normaliza el contenido con las tres claves de estado', async () => {
    vi.stubGlobal(
      'fetch',
      respond(200, {
        data: {
          estante: MAP.estantes[0]!,
          zona: { id: 1, nombre: 'Zona A' },
          location: { id: 7, code: 'L206', nombre: 'Laboratorio 206' },
          cajones: [
            {
              id: 9,
              codigo: 'R1',
              barcode: 'L206-R1',
              descripcion: null,
              productos: [],
              unidades: [{ product_id: 4, product_name: 'Multímetro', type: 'equipo', total: 2, by_status: { disponible: 2 } }],
            },
          ],
        },
      }),
    );

    const contenido = await fetchEstanteContenido(3);

    expect(contenido.cajones[0]?.unidades[0]?.by_status).toEqual({ disponible: 2, prestado: 0, en_reparacion: 0 });
    expect(contenido.zona?.nombre).toBe('Zona A');
  });

  it('envía los filtros de cajones por estante y sin estante', async () => {
    const fetchMock = respond(200, { data: [{ id: 1, codigo: 'R1', location_id: 7, estante_id: 3, estante: { id: 3, codigo: 'EST-A1' } }] });
    vi.stubGlobal('fetch', fetchMock);

    const page = await fetchCajones({ location_id: 7, sin_estante: true });
    await fetchCajones({ estante_id: 3 });

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/cajones?location_id=7&sin_estante=1', expect.anything());
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/cajones?estante_id=3', expect.anything());
    expect(page.data[0]?.estante).toEqual({ id: 3, codigo: 'EST-A1' });
  });

  it('conserva `lleno` del cajón en el listado y en el mapa (docs/cajones-llenos.md)', async () => {
    vi.stubGlobal('fetch', respond(200, { data: [{ id: 1, codigo: 'R1', location_id: 7, lleno: true }, { id: 2, codigo: 'R2', location_id: 7 }] }));
    const page = await fetchCajones({ location_id: 7 });
    expect(page.data.map((c) => c.lleno)).toEqual([true, false]);

    const raw = { ...MAP, estantes: [{ ...MAP.estantes[0]!, cajones: [{ id: 1, codigo: 'R1', barcode: null, products_count: 0, units_count: 0, lleno: true }] }] };
    vi.stubGlobal('fetch', respond(200, { data: raw }));
    expect((await fetchSalaMapa(7)).estantes[0]?.cajones[0]?.lleno).toBe(true);
  });

  it('useUpdateCajon envía `lleno` y refresca el mapa y el contenido de estantes', async () => {
    const fetchMock = respond(200, { data: { id: 1, codigo: 'R1', location_id: 7, lleno: true } });
    vi.stubGlobal('fetch', fetchMock);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    queryClient.setQueryData(salaMapaKeys.detail(7), MAP);
    queryClient.setQueryData(estanteKeys.contents(3), { cajones: [] });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useUpdateCajon(), { wrapper });

    await act(async () => {
      const cajon = await result.current.mutateAsync({ id: 1, payload: { lleno: true } });
      expect(cajon.lleno).toBe(true);
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/cajones/1', expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ lleno: true }) }));
    expect(queryClient.getQueryState(salaMapaKeys.detail(7))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(estanteKeys.contents(3))?.isInvalidated).toBe(true);
  });

  describe('useUpdateEstante', () => {
    function setup() {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
      queryClient.setQueryData(salaMapaKeys.detail(7), MAP);
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );
      const { result } = renderHook(() => useUpdateEstante(), { wrapper });
      const position = () => queryClient.getQueryData<SalaMapa>(salaMapaKeys.detail(7))?.estantes[0];
      return { result, position };
    }

    it('mueve el estante antes de la respuesta', async () => {
      let resolve: (value: Response) => void = () => undefined;
      vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((r) => (resolve = r))));
      const { result, position } = setup();

      act(() => {
        result.current.mutate({ id: 3, locationId: 7, payload: { x: 300, y: 100 } });
      });

      await waitFor(() => expect(position()?.x).toBe(300));
      expect(position()?.y).toBe(100);

      resolve(new Response(JSON.stringify({ data: { ...MAP.estantes[0]!, x: 300, y: 100 } }), { status: 200 }));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it('vuelve atrás si la API responde 422', async () => {
      vi.stubGlobal(
        'fetch',
        respond(422, { message: 'Se superpone con el estante EST-B1.', errors: { x: ['Se superpone con el estante EST-B1.'] } }),
      );
      const { result, position } = setup();

      act(() => {
        result.current.mutate({ id: 3, locationId: 7, payload: { x: 500 } });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe('Se superpone con el estante EST-B1.');
      expect(position()?.x).toBe(10);
    });
  });
});
