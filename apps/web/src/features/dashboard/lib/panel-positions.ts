import type { UserChartPosition } from '@sgia/types';

interface Positioned {
  id: number;
  position: number;
}

/** Mueve `sourceIndex` a `targetIndex` dentro de la lista visible. */
export function moveItem<T>(list: T[], sourceIndex: number, targetIndex: number): T[] {
  const next = [...list];
  const [moved] = next.splice(sourceIndex, 1);
  if (moved === undefined) return list;
  next.splice(targetIndex, 0, moved);
  return next;
}

/**
 * Reasigna posiciones al nuevo orden reutilizando las posiciones ya ocupadas por esos gráficos
 * (los ocultos conservan la suya, así nunca chocan). Devuelve solo los que cambian, como pide
 * `PUT /me/charts/positions`.
 */
export function buildPositionUpdates(
  previous: Positioned[],
  nextOrder: Positioned[],
): UserChartPosition[] {
  const slots = [...previous.map((c) => c.position), ...nextOrder.map((c) => c.position)];
  const unique = Array.from(new Set(slots)).sort((a, b) => a - b).slice(0, nextOrder.length);
  const current = new Map(
    [...previous, ...nextOrder].map((c) => [c.id, c.position] as const),
  );
  return nextOrder
    .map((chart, i) => ({ id: chart.id, position: unique[i] as number }))
    .filter((u) => current.get(u.id) !== u.position);
}
