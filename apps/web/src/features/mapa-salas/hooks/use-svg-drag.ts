import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';

import { CLICK_THRESHOLD_PX, toSvgPoint, type AffineMatrix, type Rect } from '../lib/map-geometry';

export interface DragSession {
  /** Elemento que se mueve en pantalla escribiendo sus atributos (no pasa por React). */
  element: SVGGElement;
  /** Rectángulo al empezar, en cm. */
  origin: Rect;
  /** `move` desplaza; `resize` cambia ancho y alto desde la esquina inferior derecha. */
  mode: 'move' | 'resize';
  /** Tamaño mínimo al redimensionar, en cm. */
  minSize?: number;
  /** Escribe el rectángulo en el DOM; `invalid` marca que no se puede soltar ahí. */
  apply: (element: SVGGElement, rect: Rect, invalid: boolean) => void;
  /** Ajusta a la rejilla (el resultado es lo que se guardaría). */
  snapRect: (rect: Rect) => Rect;
  /** Motivo por el que no se puede soltar, o `null`. */
  validate: (rect: Rect) => string | null;
  onCommit: (rect: Rect) => void;
  onInvalidDrop?: (reason: string) => void;
  /** Soltar sin moverse (menos de 4 px de pantalla). */
  onClick?: () => void;
}

const IDENTITY: AffineMatrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

function inverseScreenMatrix(svg: SVGSVGElement | null): AffineMatrix {
  const matrix = svg?.getScreenCTM?.();
  return matrix ? matrix.inverse() : IDENTITY;
}

/**
 * Arrastre con Pointer Events sobre el plano SVG. Mientras se mueve no hay `setState`: el rectángulo se escribe
 * en el DOM dentro de `requestAnimationFrame`. React solo se entera al soltar (`onCommit`). `Escape` cancela.
 */
export function useSvgDrag(svgRef: RefObject<SVGSVGElement | null>) {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => () => cleanupRef.current?.(), []);

  return useCallback(
    (event: ReactPointerEvent<SVGGElement>, session: DragSession) => {
      if (event.button !== 0) return;
      event.stopPropagation();
      cleanupRef.current?.();

      const { element, origin, mode, apply, snapRect, validate } = session;
      const inverse = inverseScreenMatrix(svgRef.current);
      const start = toSvgPoint(event.clientX, event.clientY, inverse);
      const startClient = { x: event.clientX, y: event.clientY };
      const pointerId = event.pointerId;
      let current = origin;
      let moved = false;
      let frame = 0;

      try {
        (event.currentTarget as Element).setPointerCapture?.(pointerId);
      } catch {
        // Sin captura (navegadores antiguos o pruebas): los eventos de ventana alcanzan igual.
      }

      const paint = () => {
        frame = 0;
        apply(element, current, validate(snapRect(current)) !== null);
      };

      const finish = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onCancel);
        window.removeEventListener('keydown', onKey);
        if (frame) cancelAnimationFrame(frame);
        delete element.dataset.dragging;
        delete element.dataset.invalid;
        cleanupRef.current = null;
      };

      const restore = () => {
        apply(element, origin, false);
        finish();
      };

      function onMove(e: PointerEvent) {
        if (e.pointerId !== pointerId) return;
        if (!moved && Math.hypot(e.clientX - startClient.x, e.clientY - startClient.y) < CLICK_THRESHOLD_PX) return;
        moved = true;
        element.dataset.dragging = 'true';
        const point = toSvgPoint(e.clientX, e.clientY, inverse);
        const dx = point.x - start.x;
        const dy = point.y - start.y;
        const min = session.minSize ?? 1;
        current =
          mode === 'move'
            ? { ...origin, x: origin.x + dx, y: origin.y + dy }
            : { ...origin, w: Math.max(min, origin.w + dx), h: Math.max(min, origin.h + dy) };
        if (typeof requestAnimationFrame === 'undefined') paint();
        else if (!frame) frame = requestAnimationFrame(paint);
      }

      function onUp(e: PointerEvent) {
        if (e.pointerId !== pointerId) return;
        if (!moved) {
          finish();
          session.onClick?.();
          return;
        }
        const target = snapRect(current);
        const reason = validate(target);
        if (reason !== null) {
          restore();
          session.onInvalidDrop?.(reason);
          return;
        }
        apply(element, target, false);
        finish();
        if (target.x !== origin.x || target.y !== origin.y || target.w !== origin.w || target.h !== origin.h) {
          session.onCommit(target);
        }
      }

      function onCancel(e: PointerEvent) {
        if (e.pointerId === pointerId) restore();
      }

      function onKey(e: KeyboardEvent) {
        if (e.key === 'Escape') restore();
      }

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onCancel);
      window.addEventListener('keydown', onKey);
      cleanupRef.current = restore;
    },
    [svgRef],
  );
}
