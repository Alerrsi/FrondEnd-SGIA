import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';

import { initialViewBox, type ViewBox } from '../components/sala-svg';
import { CLICK_THRESHOLD_PX, toSvgPoint, type AffineMatrix, type Point } from '../lib/map-geometry';

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 8;
const ZOOM_STEP = 1.5;

/** Mantiene el `viewBox` dentro del encuadre completo de la sala. */
export function clampViewBox(view: ViewBox, base: ViewBox): ViewBox {
  const w = Math.min(base.w, Math.max(base.w / MAX_ZOOM, view.w));
  const h = (w / base.w) * base.h;
  const x = Math.min(Math.max(view.x, base.x), base.x + base.w - w);
  const y = Math.min(Math.max(view.y, base.y), base.y + base.h - h);
  return { x, y, w, h };
}

/** Acerca o aleja `factor` veces manteniendo fijo `anchor` (punto del plano bajo el puntero o el centro). */
export function zoomViewBox(view: ViewBox, base: ViewBox, factor: number, anchor?: Point): ViewBox {
  const point = anchor ?? { x: view.x + view.w / 2, y: view.y + view.h / 2 };
  const w = view.w / factor;
  const h = view.h / factor;
  return clampViewBox(
    { x: point.x - ((point.x - view.x) / view.w) * w, y: point.y - ((point.y - view.y) / view.h) * h, w, h },
    base,
  );
}

const IDENTITY: AffineMatrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

/**
 * Zoom y desplazamiento del plano: cambian el `viewBox`, no el CSS, así líneas y textos siguen nítidos.
 * Botones, `Ctrl` + rueda (sobre el puntero) y arrastrar el fondo cuando hay zoom. El desplazamiento escribe
 * el `viewBox` en el DOM mientras se arrastra y lo confirma en React al soltar.
 */
export function useMapViewport(svgRef: RefObject<SVGSVGElement | null>, width: number, height: number) {
  const base = useMemo(() => initialViewBox(width, height), [width, height]);
  const [view, setView] = useState<ViewBox>(base);
  const viewRef = useRef(view);
  viewRef.current = view;

  useEffect(() => setView(base), [base]);

  const zoom = view.w > 0 ? base.w / view.w : 1;

  const zoomBy = useCallback((factor: number, anchor?: Point) => setView((current) => zoomViewBox(current, base, factor, anchor)), [base]);
  const zoomIn = useCallback(() => zoomBy(ZOOM_STEP), [zoomBy]);
  const zoomOut = useCallback(() => zoomBy(1 / ZOOM_STEP), [zoomBy]);
  const fit = useCallback(() => setView(base), [base]);

  // `Ctrl`/`⌘` + rueda: la rueda sola sigue desplazando la página. El `<svg>` puede montarse después del primer
  // render (esqueleto de carga): en cada render se comprueba si cambió y se vuelve a enganchar.
  const zoomByRef = useRef(zoomBy);
  zoomByRef.current = zoomBy;
  const wheelTarget = useRef<{ svg: SVGSVGElement; off: () => void } | null>(null);
  useEffect(() => {
    const svg = svgRef.current;
    if (svg === (wheelTarget.current?.svg ?? null)) return;
    wheelTarget.current?.off();
    wheelTarget.current = null;
    if (!svg) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const matrix = svg.getScreenCTM?.();
      const anchor = toSvgPoint(event.clientX, event.clientY, matrix ? matrix.inverse() : IDENTITY);
      zoomByRef.current(event.deltaY < 0 ? 1.2 : 1 / 1.2, anchor);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    wheelTarget.current = { svg, off: () => svg.removeEventListener('wheel', onWheel) };
  });
  useEffect(() => () => wheelTarget.current?.off(), []);

  /** `onPointerDown` del `<svg>`: con zoom, arrastrar el fondo desplaza la vista. */
  const onPanStart = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg || event.button !== 0 || viewRef.current.w >= base.w) return;
      const start = { x: event.clientX, y: event.clientY };
      const origin = viewRef.current;
      const rect = svg.getBoundingClientRect();
      const cmPerPx = rect.width > 0 ? origin.w / rect.width : 1;
      let current = origin;
      let moved = false;
      let frame = 0;

      const paint = () => {
        frame = 0;
        svg.setAttribute('viewBox', `${current.x} ${current.y} ${current.w} ${current.h}`);
      };
      const onMove = (e: PointerEvent) => {
        if (!moved && Math.hypot(e.clientX - start.x, e.clientY - start.y) < CLICK_THRESHOLD_PX) return;
        moved = true;
        current = clampViewBox(
          { ...origin, x: origin.x - (e.clientX - start.x) * cmPerPx, y: origin.y - (e.clientY - start.y) * cmPerPx },
          base,
        );
        if (typeof requestAnimationFrame === 'undefined') paint();
        else if (!frame) frame = requestAnimationFrame(paint);
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        if (frame) cancelAnimationFrame(frame);
        if (moved) setView(current);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [svgRef, base],
  );

  return { view, zoom, zoomIn, zoomOut, fit, onPanStart, canZoomIn: zoom < MAX_ZOOM - 0.01, canZoomOut: zoom > MIN_ZOOM + 0.01 };
}
