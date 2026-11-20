import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Píxeles de pantalla por centímetro del plano: ancho del `<svg>` dividido por el ancho del `viewBox`.
 * Sirve para que textos, radios y marcadores midan lo mismo en pantalla a cualquier escala o zoom.
 * El `<svg>` puede aparecer después del primer render (tras el esqueleto de carga): en cada render se comprueba si
 * cambió el elemento y se vuelve a observar. Sin medida (pruebas, primer render) devuelve 1.
 */
export function useMapScale(svgRef: RefObject<SVGSVGElement | null>, viewBoxWidth: number): number {
  const [width, setWidth] = useState(0);
  const observed = useRef<SVGSVGElement | null>(null);
  const observer = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (svg === observed.current) return;
    observer.current?.disconnect();
    observed.current = svg;
    if (!svg) return;
    const measure = () => setWidth(svg.getBoundingClientRect().width);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    observer.current = new ResizeObserver(measure);
    observer.current.observe(svg);
  });

  useEffect(() => () => observer.current?.disconnect(), []);

  return width > 0 && viewBoxWidth > 0 ? width / viewBoxWidth : 1;
}
