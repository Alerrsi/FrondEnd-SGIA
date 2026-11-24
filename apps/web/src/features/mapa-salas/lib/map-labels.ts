import type { Estante } from '@sgia/types';

/** Texto accesible de un estante: lo que el dibujo dice con formas y colores. */
export function estanteAriaLabel(estante: Estante, zonaNombre: string | null): string {
  const parts = [`Estante ${estante.codigo}`];
  if (estante.nombre) parts.push(estante.nombre);
  if (zonaNombre) parts.push(zonaNombre);
  const cajones = estante.cajones.length;
  parts.push(cajones === 1 ? '1 cajón' : `${cajones} cajones`);
  parts.push(estante.items_count === 1 ? '1 elemento' : `${estante.items_count} elementos`);
  const llenos = estante.cajones.filter((cajon) => cajon.lleno).length;
  if (llenos > 0) parts.push(llenos === 1 ? '1 cajón lleno' : `${llenos} cajones llenos`);
  if (estante.has_critical_stock) parts.push('con stock crítico');
  return parts.join(', ');
}

export function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}
