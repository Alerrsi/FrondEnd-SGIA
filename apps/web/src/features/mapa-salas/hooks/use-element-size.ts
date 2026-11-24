import { useCallback, useEffect, useState } from 'react';

export interface ElementSize {
  width: number;
  height: number;
}

/**
 * Ancho y alto (`clientWidth`/`clientHeight`) de un elemento, al día con `ResizeObserver`. Se engancha con el `ref`
 * que devuelve (callback), así funciona aunque el elemento aparezca después del primer render. Sin medida
 * (pruebas, primer render) devuelve 0 × 0.
 */
export function useElementSize<T extends HTMLElement>() {
  const [node, setNode] = useState<T | null>(null);
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });
  const ref = useCallback((element: T | null) => setNode(element), []);

  useEffect(() => {
    if (!node) return;
    const measure = () => {
      const width = node.clientWidth;
      const height = node.clientHeight;
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return { ref, ...size };
}
