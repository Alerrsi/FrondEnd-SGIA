/**
 * Pasos del nombre «escrito a máquina» del saludo de Inicio (docs/saludo-animado.md): escribe letra por letra,
 * queda quieto, borra, espera y vuelve a escribir. Función pura compartida por la web y la app móvil: cada
 * una solo agenda el siguiente paso con sus temporizadores.
 */
export type TypewriterPhase = 'waiting' | 'typing' | 'holding' | 'deleting';

export interface TypewriterState {
  /** Letras visibles. */
  count: number;
  phase: TypewriterPhase;
}

/** Milisegundos hasta el siguiente paso según la fase actual. */
export const TYPEWRITER_TIMING: Record<TypewriterPhase, number> = {
  waiting: 500,
  typing: 90,
  holding: 2800,
  deleting: 45,
};

export const TYPEWRITER_START: TypewriterState = { count: 0, phase: 'waiting' };

export function nextTypewriterState(state: TypewriterState, length: number): TypewriterState {
  if (length <= 0) return { count: 0, phase: 'holding' };
  switch (state.phase) {
    case 'waiting':
      return { count: 1, phase: length === 1 ? 'holding' : 'typing' };
    case 'typing': {
      const count = Math.min(length, state.count + 1);
      return { count, phase: count >= length ? 'holding' : 'typing' };
    }
    case 'holding':
      return { count: Math.max(0, length - 1), phase: length - 1 <= 0 ? 'waiting' : 'deleting' };
    case 'deleting': {
      const count = Math.max(0, state.count - 1);
      return { count, phase: count === 0 ? 'waiting' : 'deleting' };
    }
  }
}

export function typewriterDelay(state: TypewriterState): number {
  return TYPEWRITER_TIMING[state.phase];
}
