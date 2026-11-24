import { useEffect, useState } from 'react';

import { nextTypewriterState, TYPEWRITER_START, typewriterDelay, type TypewriterState } from '@sgia/design-tokens';

/** Con la pestaña oculta no avanza: revisa de nuevo cada medio segundo. */
const HIDDEN_RETRY_MS = 500;

/**
 * Texto que se escribe, se borra y se vuelve a escribir en bucle (docs/saludo-animado.md). Con `enabled = false`
 * (movimiento reducido) devuelve el texto completo y quieto.
 */
export function useTypewriter(text: string, enabled: boolean): { shown: string; state: TypewriterState } {
  const [animated, setAnimated] = useState<{ text: string; state: TypewriterState }>({ text, state: TYPEWRITER_START });
  // Si cambia el texto, vuelve a empezar (se ajusta durante el render, sin efecto extra).
  const current = animated.text === text ? animated.state : TYPEWRITER_START;
  if (animated.text !== text) setAnimated({ text, state: TYPEWRITER_START });

  useEffect(() => {
    if (!enabled) return;
    let state = TYPEWRITER_START;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (typeof document !== 'undefined' && document.hidden) {
        timer = setTimeout(tick, HIDDEN_RETRY_MS);
        return;
      }
      state = nextTypewriterState(state, text.length);
      setAnimated({ text, state });
      timer = setTimeout(tick, typewriterDelay(state));
    };
    timer = setTimeout(tick, typewriterDelay(state));
    return () => clearTimeout(timer);
  }, [text, enabled]);

  if (!enabled) return { shown: text, state: { count: text.length, phase: 'holding' } };
  return { shown: text.slice(0, current.count), state: current };
}
