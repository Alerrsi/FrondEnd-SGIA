import type { ElementSize } from '../hooks/use-element-size';

/**
 * Mayor tamaño con la proporción `aspect` (ancho / alto) que cabe en `box`, en píxeles (con decimales).
 * `null` si la caja aún no tiene medida.
 */
export function fitSize(box: ElementSize, aspect: number): ElementSize | null {
  if (box.width <= 0 || box.height <= 0 || !(aspect > 0)) return null;
  const width = Math.min(box.width, box.height * aspect);
  return { width, height: width / aspect };
}
