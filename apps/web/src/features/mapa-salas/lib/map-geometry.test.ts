import { describe, expect, it } from 'vitest';
import type { Estante, Zona } from '@sgia/types';
import {
  clampToRoom,
  contains,
  estanteRect,
  firstFreeSlot,
  intersects,
  occupiedRect,
  placementError,
  roomRect,
  snap,
  toSvgPoint,
  zonaAt,
} from './map-geometry';

function estante(partial: Partial<Estante>): Estante {
  return {
    id: 1,
    location_id: 1,
    zona_id: null,
    codigo: 'EST-A1',
    nombre: null,
    descripcion: null,
    x: 0,
    y: 0,
    width: 200,
    depth: 60,
    rotation: 0,
    cajones: [],
    items_count: 0,
    has_critical_stock: false,
    ...partial,
  };
}

function zona(partial: Partial<Zona>): Zona {
  return { id: 1, location_id: 1, nombre: 'Zona A', x: 0, y: 0, width: 400, depth: 400, ...partial };
}

describe('map-geometry (REQ-22)', () => {
  it('ajusta a la rejilla de 10 cm', () => {
    expect(snap(104)).toBe(100);
    expect(snap(105)).toBe(110);
    expect(snap(-3) + 0).toBe(0);
  });

  it('gira 90° intercambiando largo y fondo', () => {
    expect(occupiedRect(10, 20, 200, 60, 0)).toEqual({ x: 10, y: 20, w: 200, h: 60 });
    expect(estanteRect(estante({ x: 10, y: 20, rotation: 90 }))).toEqual({ x: 10, y: 20, w: 60, h: 200 });
  });

  it('bordes que se tocan no se superponen', () => {
    expect(intersects({ x: 0, y: 0, w: 100, h: 40 }, { x: 100, y: 0, w: 100, h: 40 })).toBe(false);
    expect(intersects({ x: 0, y: 0, w: 100, h: 40 }, { x: 99, y: 39, w: 10, h: 10 })).toBe(true);
  });

  it('lleva el rectángulo dentro de la sala', () => {
    const room = roomRect(1000, 600);
    expect(contains(room, { x: 900, y: 540, w: 100, h: 60 })).toBe(true);
    expect(clampToRoom({ x: 950, y: -20, w: 100, h: 60 }, room)).toEqual({ x: 900, y: 0, w: 100, h: 60 });
  });

  it('explica por qué no se puede soltar', () => {
    const room = roomRect(1000, 600);
    const others = [estante({ id: 2, codigo: 'EST-B1', x: 300, y: 0 })];
    expect(placementError({ x: 950, y: 0, w: 200, h: 60 }, room, others)).toBe('El estante queda fuera de la sala.');
    expect(placementError({ x: 350, y: 30, w: 200, h: 60 }, room, others)).toBe('Se superpone con el estante EST-B1.');
    expect(placementError({ x: 500, y: 0, w: 200, h: 60 }, room, others)).toBeNull();
    // El propio estante no cuenta.
    expect(placementError({ x: 310, y: 0, w: 200, h: 60 }, room, others, 2)).toBeNull();
  });

  it('elige la zona más específica que contiene el centro', () => {
    const grande = zona({ id: 1, nombre: 'Zona A', width: 600, depth: 600 });
    const chica = zona({ id: 2, nombre: 'Zona A1', x: 100, y: 100, width: 100, depth: 100 });
    expect(zonaAt({ x: 150, y: 150 }, [grande, chica])?.id).toBe(2);
    expect(zonaAt({ x: 500, y: 500 }, [grande, chica])?.id).toBe(1);
    expect(zonaAt({ x: 700, y: 50 }, [grande, chica])).toBeNull();
  });

  it('convierte coordenadas de pantalla con la matriz inversa', () => {
    // Escala 0,5 cm por px y desplazamiento de 20 px.
    const inverse = { a: 2, b: 0, c: 0, d: 2, e: -40, f: -40 };
    expect(toSvgPoint(70, 120, inverse)).toEqual({ x: 100, y: 200 });
  });

  it('encuentra el primer hueco libre como el backend', () => {
    const area = roomRect(300, 200);
    expect(firstFreeSlot(area, 100, 40, [])).toEqual({ x: 0, y: 0 });
    expect(firstFreeSlot(area, 100, 40, [{ x: 0, y: 0, w: 105, h: 40 }])).toEqual({ x: 110, y: 0 });
    expect(firstFreeSlot(area, 100, 40, [{ x: 0, y: 0, w: 300, h: 40 }])).toEqual({ x: 0, y: 40 });
    expect(firstFreeSlot(area, 400, 40, [])).toBeNull();
  });
});
