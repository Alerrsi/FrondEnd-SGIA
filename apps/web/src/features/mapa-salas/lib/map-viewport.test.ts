import { describe, expect, it } from 'vitest';

import { initialViewBox } from '../components/sala-svg';
import { clampViewBox, zoomViewBox } from '../hooks/use-map-viewport';

describe('Zoom del plano (REQ-22)', () => {
  const base = initialViewBox(1000, 600);

  it('acerca manteniendo fijo el punto bajo el puntero', () => {
    const view = zoomViewBox(base, base, 2, { x: 500, y: 300 });
    expect(view.w).toBeCloseTo(base.w / 2);
    // El ancla queda en la misma proporción del encuadre.
    expect((500 - view.x) / view.w).toBeCloseTo((500 - base.x) / base.w);
  });

  it('no aleja más allá de la sala completa ni acerca más de 8 veces', () => {
    expect(zoomViewBox(base, base, 0.5)).toEqual(base);
    expect(zoomViewBox(base, base, 100).w).toBeCloseTo(base.w / 8);
  });

  it('el desplazamiento no saca la vista de la sala', () => {
    const view = clampViewBox({ x: 5000, y: -900, w: base.w / 2, h: base.h / 2 }, base);
    expect(view.x + view.w).toBeCloseTo(base.x + base.w);
    expect(view.y).toBeCloseTo(base.y);
  });
});
