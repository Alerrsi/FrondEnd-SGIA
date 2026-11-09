import type { AprobarPrestamoPayload, LoanReview, LoanReviewItem, LoanReviewUnit } from '@sgia/types';

/** Unidades elegidas por el pañol: ids de unidad por `item_id`. */
export type ReviewSelection = Record<number, number[]>;

export type ScanUnitResult = { ok: true; unit: LoanReviewUnit } | { ok: false; error: string };

/** La propuesta del sistema: el punto de partida y el destino de «Restablecer». */
export function initialSelection(review: LoanReview): ReviewSelection {
  const selection: ReviewSelection = {};
  for (const item of review.items) {
    if (item.has_units) selection[item.item_id] = item.suggested_units.map((unit) => unit.id);
  }
  return selection;
}

function normalizeCode(code: string): string {
  return code.trim().toLowerCase();
}

/**
 * Valida un código escaneado para un ítem. Debe ser una unidad disponible del ítem, no estar ya
 * escaneada y no estar elegida en otro ítem. Puede ser una unidad de la propuesta: así se confirma.
 */
export function scanUnit(
  item: LoanReviewItem,
  selection: ReviewSelection,
  scannedIds: number[],
  code: string,
): ScanUnitResult {
  const typed = code.trim();
  if (typed === '') return { ok: false, error: 'Indica el código de la unidad que se entrega.' };

  const unit = item.available_units.find(
    (candidate) => normalizeCode(candidate.code) === normalizeCode(typed),
  );
  if (!unit) {
    return {
      ok: false,
      error: `El código ${typed} no está disponible en este pañol para este producto.`,
    };
  }

  if (scannedIds.includes(unit.id)) {
    return { ok: false, error: `El código ${unit.code} ya fue escaneado.` };
  }

  const inOtherItem = Object.entries(selection).some(
    ([itemId, unitIds]) => Number(itemId) !== item.item_id && unitIds.includes(unit.id),
  );
  if (inOtherItem) {
    return { ok: false, error: `El código ${unit.code} ya está elegido en esta solicitud.` };
  }

  return { ok: true, unit };
}

/** Unidades elegidas de un ítem, ordenadas por sala y cajón para hacer un solo recorrido. */
export function selectedUnits(item: LoanReviewItem, selection: ReviewSelection): LoanReviewUnit[] {
  const known = new Map(
    [...item.available_units, ...item.suggested_units].map((unit) => [unit.id, unit]),
  );
  return (selection[item.item_id] ?? [])
    .map((id) => known.get(id))
    .filter((unit): unit is LoanReviewUnit => unit !== undefined)
    .sort(
      (a, b) =>
        (a.location?.nombre ?? '').localeCompare(b.location?.nombre ?? '', 'es') ||
        (a.cajon?.codigo ?? '').localeCompare(b.cajon?.codigo ?? '', 'es') ||
        a.code.localeCompare(b.code, 'es'),
    );
}

/** `true` si la unidad no es parte de lo que propuso el sistema para el ítem. */
export function isUnitChanged(item: LoanReviewItem, unitId: number): boolean {
  return !item.suggested_units.some((unit) => unit.id === unitId);
}

export function isSelectionChanged(review: LoanReview, selection: ReviewSelection): boolean {
  return review.items.some(
    (item) => item.has_units && (selection[item.item_id] ?? []).some((id) => isUnitChanged(item, id)),
  );
}

/** Cuerpo de la aprobación: todas las unidades visibles, cambiadas o no, para asignar lo que se vio. */
export function buildApprovePayload(
  review: LoanReview,
  selection: ReviewSelection,
): AprobarPrestamoPayload {
  const items = review.items
    .filter((item) => item.has_units)
    .map((item) => ({ item_id: item.item_id, unit_ids: selection[item.item_id] ?? [] }));

  return items.length > 0 ? { items } : {};
}
