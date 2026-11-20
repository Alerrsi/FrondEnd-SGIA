import type { Estante, EstanteRotation, Zona } from '@sgia/types';

// Geometría del plano (REQ-22). Todo en centímetros con el origen en la esquina superior izquierda de la sala;
// es el espejo de `RoomMapService` del backend, que sigue siendo la fuente de verdad (valida al guardar).

/** Rectángulo alineado a los ejes. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Point {
  x: number;
  y: number;
}

/** Matriz afín 2D como la de `DOMMatrix` / `SVGMatrix` (solo los campos que se usan). */
export interface AffineMatrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

/** Rejilla al soltar. */
export const SNAP_CM = 10;
/** Paso de las flechas del teclado (con `Shift`, `SNAP_CM_LARGE`). */
export const KEY_STEP_CM = 10;
export const KEY_STEP_CM_LARGE = 50;
/** Líneas guía en modo edición. */
export const GUIDE_CM = 50;
/** Movimiento de pantalla bajo el cual un arrastre cuenta como clic. */
export const CLICK_THRESHOLD_PX = 4;

/** Rectángulo ocupado: con rotación 90 se intercambian largo y fondo. */
export function occupiedRect(x: number, y: number, width: number, depth: number, rotation: EstanteRotation): Rect {
  return rotation === 90 ? { x, y, w: depth, h: width } : { x, y, w: width, h: depth };
}

export function estanteRect(estante: Pick<Estante, 'x' | 'y' | 'width' | 'depth' | 'rotation'>): Rect {
  return occupiedRect(estante.x, estante.y, estante.width, estante.depth, estante.rotation);
}

export function zonaRect(zona: Pick<Zona, 'x' | 'y' | 'width' | 'depth'>): Rect {
  return { x: zona.x, y: zona.y, w: zona.width, h: zona.depth };
}

export function roomRect(width: number, height: number): Rect {
  return { x: 0, y: 0, w: width, h: height };
}

/** Intersección con área positiva: bordes que se tocan no cuentan. */
export function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

export function contains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.w <= outer.x + outer.w &&
    inner.y + inner.h <= outer.y + outer.h
  );
}

export function snap(value: number, step = SNAP_CM): number {
  return Math.round(value / step) * step;
}

/** Lleva el rectángulo dentro de la sala sin cambiar su tamaño (si cabe). */
export function clampToRoom(rect: Rect, room: Rect): Rect {
  const x = Math.min(Math.max(rect.x, room.x), room.x + room.w - rect.w);
  const y = Math.min(Math.max(rect.y, room.y), room.y + room.h - rect.h);
  return { ...rect, x: Math.max(room.x, x), y: Math.max(room.y, y) };
}

/** Primer estante (distinto de `ignoreId`) que se superpone con `rect`. */
export function findOverlap(rect: Rect, estantes: Estante[], ignoreId?: number): Estante | undefined {
  return estantes.find((other) => other.id !== ignoreId && intersects(rect, estanteRect(other)));
}

/** Motivo por el que no se puede soltar el estante ahí, o `null` si se puede. */
export function placementError(rect: Rect, room: Rect, estantes: Estante[], ignoreId?: number): string | null {
  if (!contains(room, rect)) return 'El estante queda fuera de la sala.';
  const other = findOverlap(rect, estantes, ignoreId);
  return other ? `Se superpone con el estante ${other.codigo}.` : null;
}

export function center(rect: Rect): Point {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

/** Zona que contiene el punto; si hay varias superpuestas, la más chica (la más específica). */
export function zonaAt(point: Point, zonas: Zona[]): Zona | null {
  const hits = zonas.filter((zona) => {
    const r = zonaRect(zona);
    return point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h;
  });
  hits.sort((a, b) => a.width * a.depth - b.width * b.depth);
  return hits[0] ?? null;
}

/** Punto de pantalla a coordenadas del SVG con la inversa de `getScreenCTM()`. */
export function toSvgPoint(clientX: number, clientY: number, inverse: AffineMatrix): Point {
  return {
    x: inverse.a * clientX + inverse.c * clientY + inverse.e,
    y: inverse.b * clientX + inverse.d * clientY + inverse.f,
  };
}

/**
 * Primera posición libre en una rejilla de 10 cm (de arriba abajo y de izquierda a derecha). Solo prueba el borde
 * del área y los bordes de los obstáculos llevados a la rejilla: mismo resultado que recorrer cada punto.
 */
export function firstFreeSlot(area: Rect, w: number, h: number, obstacles: Rect[]): Point | null {
  if (w > area.w || h > area.h) return null;
  const candidates = (start: number, max: number, edges: number[]) =>
    [...new Set([start, ...edges.map((edge) => start + Math.ceil(Math.max(0, edge - start) / SNAP_CM) * SNAP_CM)])]
      .filter((value) => value <= max)
      .sort((a, b) => a - b);
  const xs = candidates(area.x, area.x + area.w - w, obstacles.map((r) => r.x + r.w));
  const ys = candidates(area.y, area.y + area.h - h, obstacles.map((r) => r.y + r.h));
  for (const y of ys) {
    for (const x of xs) {
      const rect = { x, y, w, h };
      if (!obstacles.some((obstacle) => intersects(rect, obstacle))) return { x, y };
    }
  }
  return null;
}

/** Ancho aproximado de un texto en Geist (para decidir si cabe dentro de un estante). */
export function estimateTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.6;
}

/** ¿Algún estante pisa la franja superior donde va el nombre de la zona? Entonces el nombre va abajo. */
export function zonaLabelAtBottom(zona: Zona, estantes: Estante[], fontSize: number): boolean {
  const band: Rect = { x: zona.x, y: zona.y, w: zona.width, h: fontSize * 2.4 };
  return estantes.some((estante) => intersects(band, estanteRect(estante)));
}
