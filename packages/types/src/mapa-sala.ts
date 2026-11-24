import type { LocationEntity } from './producto';
import type { EquipmentUnitStatus } from './unidad';

// Mapa de salas (REQ-22, docs/mapa-salas.md). Medidas y posiciones en centímetros enteros desde la
// esquina superior izquierda de la sala. `width` es el largo del mueble y `depth` su fondo, sin rotar.

export type EstanteRotation = 0 | 90;

export interface Zona {
  id: number;
  location_id: number;
  nombre: string;
  x: number;
  y: number;
  width: number;
  depth: number;
}

/** Cajón dibujado como celda del estante. */
export interface EstanteCajonResumen {
  id: number;
  codigo: string;
  barcode: string | null;
  products_count: number;
  units_count: number;
  /** Cajón marcado como lleno: celda azul en el plano. */
  lleno: boolean;
}

export interface Estante {
  id: number;
  location_id: number;
  zona_id: number | null;
  /** Código corto y único en la sala (`EST-A1`). No es el `barcode` de los cajones. */
  codigo: string;
  nombre: string | null;
  descripcion: string | null;
  x: number;
  y: number;
  width: number;
  depth: number;
  rotation: EstanteRotation;
  cajones: EstanteCajonResumen[];
  /** Productos (insumos) + unidades de equipo guardados en sus cajones. */
  items_count: number;
  /** Algún insumo del estante está en o bajo su stock mínimo. */
  has_critical_stock: boolean;
}

export interface SalaMapaLocation extends Pick<LocationEntity, 'id' | 'code' | 'nombre' | 'tipo'> {
  map_width_cm: number;
  map_height_cm: number;
  /** `false` si la sala aún no tiene medidas: el backend entrega 1000 × 600 por defecto. */
  has_dimensions: boolean;
}

export interface SalaMapa {
  location: SalaMapaLocation;
  zonas: Zona[];
  estantes: Estante[];
  cajones_sin_estante_count: number;
}

export interface EstanteContenidoProducto {
  id: number;
  name: string;
  type: string;
  barcode: string | null;
  quantity: number;
  stock_minimo: number;
  is_critical: boolean;
}

/** Unidades de un mismo producto en el cajón, contadas por estado. */
export interface EstanteContenidoUnidades {
  product_id: number;
  product_name: string;
  type: string;
  total: number;
  /** Siempre las tres claves; las unidades dadas de baja no se cuentan. */
  by_status: Record<Exclude<EquipmentUnitStatus, 'dado_de_baja'>, number>;
}

export interface EstanteContenidoCajon {
  id: number;
  codigo: string;
  barcode: string | null;
  descripcion: string | null;
  lleno: boolean;
  productos: EstanteContenidoProducto[];
  unidades: EstanteContenidoUnidades[];
}

export interface EstanteContenido {
  estante: Estante;
  zona: Pick<Zona, 'id' | 'nombre'> | null;
  location: Pick<LocationEntity, 'id' | 'code' | 'nombre'>;
  cajones: EstanteContenidoCajon[];
}

export interface EstanteQueryParams {
  location_id?: number;
  search?: string;
  per_page?: number;
}

export interface CreateEstantePayload {
  location_id: number;
  codigo: string;
  nombre?: string | null;
  descripcion?: string | null;
  zona_id?: number | null;
  width: number;
  depth: number;
  rotation?: EstanteRotation;
  /** Sin `x`/`y`, la API lo ubica en el primer hueco libre. */
  x?: number;
  y?: number;
}

/** Parcial; `location_id` no se puede cambiar. */
export type UpdateEstantePayload = Partial<Omit<CreateEstantePayload, 'location_id'>>;

export interface CreateZonaPayload {
  location_id: number;
  nombre: string;
  x: number;
  y: number;
  width: number;
  depth: number;
}

export type UpdateZonaPayload = Partial<Omit<CreateZonaPayload, 'location_id'>>;

export interface UpdateSalaDimensionesPayload {
  map_width_cm: number;
  map_height_cm: number;
}
