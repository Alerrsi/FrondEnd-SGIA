import { describe, expect, it } from 'vitest';

import { fitSize } from './fit-size';

describe('fitSize (docs/ubicaciones-distribucion.md)', () => {
  it('en una caja ancha manda el alto', () => {
    expect(fitSize({ width: 900, height: 300 }, 2)).toEqual({ width: 600, height: 300 });
  });

  it('en una caja alta manda el ancho', () => {
    expect(fitSize({ width: 400, height: 900 }, 2)).toEqual({ width: 400, height: 200 });
  });

  it('sin medida no ajusta', () => {
    expect(fitSize({ width: 0, height: 300 }, 2)).toBeNull();
    expect(fitSize({ width: 300, height: 300 }, 0)).toBeNull();
  });
});
