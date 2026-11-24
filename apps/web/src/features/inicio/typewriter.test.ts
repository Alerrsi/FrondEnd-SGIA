import { describe, expect, it } from 'vitest';

import { nextTypewriterState, TYPEWRITER_START, typewriterDelay, type TypewriterState } from '@sgia/design-tokens';

function run(length: number, steps: number): TypewriterState[] {
  const out: TypewriterState[] = [];
  let state = TYPEWRITER_START;
  for (let i = 0; i < steps; i++) {
    state = nextTypewriterState(state, length);
    out.push(state);
  }
  return out;
}

describe('nextTypewriterState (docs/saludo-animado.md)', () => {
  it('escribe, queda quieto, borra, espera y vuelve a escribir', () => {
    expect(run(3, 9).map((s) => `${s.phase}:${s.count}`)).toEqual([
      'typing:1',
      'typing:2',
      'holding:3',
      'deleting:2',
      'deleting:1',
      'waiting:0',
      'typing:1',
      'typing:2',
      'holding:3',
    ]);
  });

  it('una letra y texto vacío no se traban', () => {
    expect(run(1, 4).map((s) => `${s.phase}:${s.count}`)).toEqual(['holding:1', 'waiting:0', 'holding:1', 'waiting:0']);
    expect(nextTypewriterState(TYPEWRITER_START, 0)).toEqual({ count: 0, phase: 'holding' });
  });

  it('escribe más lento de lo que borra y se queda casi tres segundos completo', () => {
    expect(typewriterDelay({ count: 1, phase: 'typing' })).toBeGreaterThan(typewriterDelay({ count: 1, phase: 'deleting' }));
    expect(typewriterDelay({ count: 3, phase: 'holding' })).toBe(2800);
  });
});
