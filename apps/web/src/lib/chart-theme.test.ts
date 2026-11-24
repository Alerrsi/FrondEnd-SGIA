import { describe, expect, it } from 'vitest';

import { chartTheme, chartTokens, integerTicks } from './chart-theme';

describe('chart-theme', () => {
  it('integerTicks: marcas enteras sin repetir, de 0 al primer múltiplo que cubre el máximo', () => {
    expect(integerTicks(3)).toEqual([0, 1, 2, 3]);
    expect(integerTicks(0)).toEqual([0, 1]);
    expect(integerTicks(12)).toEqual([0, 5, 10, 15]);
    expect(integerTicks(48)).toEqual([0, 10, 20, 30, 40, 50]);
  });

  it('chartTheme toma tinta, rejilla y paleta del sistema en claro y oscuro', () => {
    for (const dark of [false, true]) {
      const t = chartTokens(dark);
      expect(chartTheme(dark)).toMatchObject({ foreground: t.text, muted: t.muted, grid: t.grid, palette: t.categorical });
    }
  });
});
