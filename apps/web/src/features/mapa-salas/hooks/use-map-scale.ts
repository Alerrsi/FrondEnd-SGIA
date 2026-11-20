import { useEffect, useState, type RefObject } from 'react';

/**
 * Píxeles de pantalla por centímetro del plano: ancho del `<svg>` dividido por el ancho del `viewBox`.
 * Sirve para que textos, radios y marcadores midan lo mismo en pantalla a cualquier escala o zoom.
 * Sin medida (pruebas, primer render) devuelve 1.
 */
export function useMapScale(svgRef: RefObject<SVGSVGElement | null>, viewBoxWidth: number): number {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const measure = () => setWidth(svg.getBoundingClientRect().width);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(svg);
    return () => observer.disconnect();
  }, [svgRef]);

  return width > 0 && viewBoxWidth > 0 ? width / viewBoxWidth : 1;
}
