import { describe, expect, it } from 'vitest';

import { workspaceMode } from './workspace-mode';

describe('workspaceMode (docs/ubicaciones-distribucion.md)', () => {
  it('elige la distribución por el ancho del área', () => {
    expect(workspaceMode(390)).toBe('stack');
    expect(workspaceMode(639)).toBe('stack');
    expect(workspaceMode(640)).toBe('split');
    expect(workspaceMode(939)).toBe('split');
    expect(workspaceMode(940)).toBe('wide');
  });

  it('sin medida usa la distribución completa o la que ya había', () => {
    expect(workspaceMode(0)).toBe('wide');
    expect(workspaceMode(0, 'stack')).toBe('stack');
  });

  it('sube de inmediato y baja solo con 24 px de margen bajo el umbral', () => {
    expect(workspaceMode(640, 'stack')).toBe('split');
    // La barra de desplazamiento resta ~15 px: no basta para volver a apilar.
    expect(workspaceMode(625, 'split')).toBe('split');
    expect(workspaceMode(615, 'split')).toBe('stack');
    expect(workspaceMode(925, 'wide')).toBe('wide');
    expect(workspaceMode(900, 'wide')).toBe('split');
    expect(workspaceMode(500, 'wide')).toBe('stack');
  });
});
