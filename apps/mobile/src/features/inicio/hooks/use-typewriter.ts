import { useEffect, useState } from 'react';
import { nextTypewriterState, TYPEWRITER_START, typewriterDelay, type TypewriterState } from '@sgia/design-tokens';

/** Medio ciclo del parpadeo del cursor (como `ui-caret` de la web, 1,06 s por ciclo). */
const CARET_HALF_MS = 530;

interface Animated {
  text: string;
  state: TypewriterState;
  /** Momento en que el nombre quedó completo (para el parpadeo). */
  holdStart: number;
}

/**
 * Nombre que se escribe, se borra y se vuelve a escribir en bucle (docs/saludo-animado.md), con el parpadeo del
 * cursor mientras está completo. Con `enabled = false` (reducir movimiento) devuelve el texto completo y quieto.
 */
export function useTypewriter(text: string, enabled: boolean): { shown: string; state: TypewriterState; caretOn: boolean } {
  const [animated, setAnimated] = useState<Animated>({ text, state: TYPEWRITER_START, holdStart: 0 });
  const [now, setNow] = useState(0);
  // Si cambia el texto, vuelve a empezar (se ajusta durante el render, sin efecto extra).
  if (animated.text !== text) setAnimated({ text, state: TYPEWRITER_START, holdStart: 0 });
  const state = animated.text === text ? animated.state : TYPEWRITER_START;

  useEffect(() => {
    if (!enabled) return;
    let current = TYPEWRITER_START;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      current = nextTypewriterState(current, text.length);
      setAnimated({ text, state: current, holdStart: current.phase === 'holding' ? Date.now() : 0 });
      timer = setTimeout(tick, typewriterDelay(current));
    };
    timer = setTimeout(tick, typewriterDelay(current));
    return () => clearTimeout(timer);
  }, [text, enabled]);

  // Parpadeo solo con el nombre completo: el intervalo solo actualiza la hora; al escribir o borrar queda fijo.
  const holding = enabled && state.phase === 'holding';
  useEffect(() => {
    if (!holding) return;
    const interval = setInterval(() => setNow(Date.now()), CARET_HALF_MS / 2);
    return () => clearInterval(interval);
  }, [holding]);

  if (!enabled) return { shown: text, state: { count: text.length, phase: 'holding' }, caretOn: false };
  const caretOn = !holding || Math.floor(Math.max(0, now - animated.holdStart) / CARET_HALF_MS) % 2 === 0;
  return { shown: text.slice(0, state.count), state, caretOn };
}
