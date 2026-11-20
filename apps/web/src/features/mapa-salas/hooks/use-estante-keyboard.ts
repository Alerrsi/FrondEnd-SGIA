import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { Estante, EstanteRotation } from '@sgia/types';

import { KEY_STEP_CM, KEY_STEP_CM_LARGE, occupiedRect, placementError, type Rect } from '../lib/map-geometry';

/** Posición en curso de un estante movido con teclado o con el `MovePad`, antes de guardarla. */
export interface EstanteDraft {
  id: number;
  x: number;
  y: number;
  rotation: EstanteRotation;
}

export interface UseEstanteKeyboardOptions {
  estantes: Estante[];
  room: Rect;
  onSave: (estante: Estante, draft: EstanteDraft) => void;
  onInvalid: (reason: string) => void;
  onDeselect?: () => void;
}

/** Espera tras la última tecla antes de guardar: varias flechas seguidas son un solo `PATCH`. */
export const KEYBOARD_SAVE_DELAY_MS = 400;

const ARROWS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/**
 * Mover (flechas, con `Shift` 50 cm) y girar (`R`) el estante enfocado en modo edición. El cambio se ve al
 * instante y se guarda 400 ms después de la última tecla; si no cabe, vuelve a su lugar con el motivo.
 */
export function useEstanteKeyboard({ estantes, room, onSave, onInvalid, onDeselect }: UseEstanteKeyboardOptions) {
  const [draft, setDraft] = useState<EstanteDraft | null>(null);
  const draftRef = useRef<EstanteDraft | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ estantes, room, onSave, onInvalid });
  latest.current = { estantes, room, onSave, onInvalid };

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const commit = useCallback(() => {
    timerRef.current = null;
    const current = draftRef.current;
    draftRef.current = null;
    setDraft(null);
    if (!current) return;
    const { estantes: all, room: bounds, onSave: save, onInvalid: invalid } = latest.current;
    const estante = all.find((item) => item.id === current.id);
    if (!estante) return;
    if (estante.x === current.x && estante.y === current.y && estante.rotation === current.rotation) return;
    const rect = occupiedRect(current.x, current.y, estante.width, estante.depth, current.rotation);
    const reason = placementError(rect, bounds, all, estante.id);
    if (reason) invalid(reason);
    else save(estante, current);
  }, []);

  const schedule = useCallback(
    (next: EstanteDraft) => {
      draftRef.current = next;
      setDraft(next);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(commit, KEYBOARD_SAVE_DELAY_MS);
    },
    [commit],
  );

  const base = useCallback(
    (estante: Estante): EstanteDraft =>
      draftRef.current?.id === estante.id
        ? draftRef.current
        : { id: estante.id, x: estante.x, y: estante.y, rotation: estante.rotation },
    [],
  );

  const nudge = useCallback(
    (estante: Estante, dx: number, dy: number) => {
      const from = base(estante);
      schedule({ ...from, x: Math.max(0, from.x + dx), y: Math.max(0, from.y + dy) });
    },
    [base, schedule],
  );

  const rotate = useCallback(
    (estante: Estante) => {
      const from = base(estante);
      schedule({ ...from, rotation: from.rotation === 90 ? 0 : 90 });
    },
    [base, schedule],
  );

  const handleKey = useCallback(
    (event: KeyboardEvent<SVGGElement>, estante: Estante) => {
      const arrow = ARROWS[event.key];
      if (arrow) {
        event.preventDefault();
        const step = event.shiftKey ? KEY_STEP_CM_LARGE : KEY_STEP_CM;
        nudge(estante, arrow[0] * step, arrow[1] * step);
      } else if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        rotate(estante);
      } else if (event.key === 'Escape') {
        onDeselect?.();
      }
    },
    [nudge, rotate, onDeselect],
  );

  return { draft, handleKey, nudge, rotate };
}
