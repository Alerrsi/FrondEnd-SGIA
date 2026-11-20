import type { Estante, EstanteContenido, SalaMapa, Zona } from '@sgia/types';

// Datos de prueba del mapa de salas (REQ-22): la «SALA 01» de la referencia, reducida.

export function makeEstante(partial: Partial<Estante> = {}): Estante {
  return {
    id: 1,
    location_id: 7,
    zona_id: 1,
    codigo: 'EST-A1',
    nombre: null,
    descripcion: null,
    x: 100,
    y: 100,
    width: 300,
    depth: 60,
    rotation: 90,
    cajones: [
      { id: 11, codigo: 'R1', barcode: 'L206-R1', products_count: 2, units_count: 0 },
      { id: 12, codigo: 'R2', barcode: 'L206-R2', products_count: 0, units_count: 3 },
    ],
    items_count: 5,
    has_critical_stock: false,
    ...partial,
  };
}

export const ZONA_A: Zona = { id: 1, location_id: 7, nombre: 'Zona A', x: 50, y: 50, width: 450, depth: 450 };
export const ZONA_B: Zona = { id: 2, location_id: 7, nombre: 'Zona B', x: 550, y: 50, width: 400, depth: 200 };

export function makeMapa(partial: Partial<SalaMapa> = {}): SalaMapa {
  return {
    location: {
      id: 7,
      code: 'L206',
      nombre: 'Laboratorio 206',
      tipo: 'sala',
      map_width_cm: 1000,
      map_height_cm: 600,
      has_dimensions: true,
    },
    zonas: [ZONA_A, ZONA_B],
    estantes: [
      makeEstante(),
      makeEstante({ id: 2, codigo: 'EST-A2', x: 200, has_critical_stock: true }),
      makeEstante({ id: 3, codigo: 'EST-B1', zona_id: 2, x: 600, y: 80, rotation: 0, width: 200, cajones: [] , items_count: 0 }),
    ],
    cajones_sin_estante_count: 0,
    ...partial,
  };
}

export const CONTENIDO: EstanteContenido = {
  estante: makeEstante(),
  zona: { id: 1, nombre: 'Zona A' },
  location: { id: 7, code: 'L206', nombre: 'Laboratorio 206' },
  cajones: [
    {
      id: 11,
      codigo: 'R1',
      barcode: 'L206-R1',
      descripcion: 'Cables',
      productos: [
        { id: 40, name: 'Guantes de nitrilo', type: 'insumo', barcode: null, quantity: 3, stock_minimo: 5, is_critical: true },
        { id: 41, name: 'Alcohol isopropílico', type: 'insumo', barcode: null, quantity: 20, stock_minimo: 5, is_critical: false },
      ],
      unidades: [],
    },
    {
      id: 12,
      codigo: 'R2',
      barcode: 'L206-R2',
      descripcion: null,
      productos: [],
      unidades: [
        { product_id: 50, product_name: 'Multímetro', type: 'equipo', total: 3, by_status: { disponible: 2, prestado: 1, en_reparacion: 0 } },
      ],
    },
  ],
};
