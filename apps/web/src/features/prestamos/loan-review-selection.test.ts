import { describe, expect, it } from 'vitest';
import type { LoanReview, LoanReviewUnit } from '@sgia/types';

import {
  buildApprovePayload,
  initialSelection,
  isSelectionChanged,
  scanUnit,
  selectedUnits,
} from './lib/loan-review-selection';

function unit(id: number, code: string, sala: string, cajon: string): LoanReviewUnit {
  return {
    id,
    code,
    status: 'disponible',
    cajon: { id, codigo: cajon },
    location: { id, nombre: sala },
  };
}

const a = unit(1, 'EQP-A', 'Sala B', 'C-1');
const b = unit(2, 'EQP-B', 'Sala A', 'C-2');
const c = unit(3, 'EQP-C', 'Sala A', 'C-1');
const other = unit(9, 'MAQ-Z', 'Sala C', 'C-1');

const review: LoanReview = {
  loan_id: 1,
  code: 'REM-1',
  status: 'pendiente',
  can_approve: true,
  items: [
    {
      item_id: 10,
      product_id: 1,
      name: 'Router',
      quantity: 2,
      has_units: true,
      available_quantity: 3,
      shortage: 0,
      suggested_units: [a, b],
      available_units: [a, b, c],
    },
    {
      item_id: 11,
      product_id: 2,
      name: 'Maqueta',
      quantity: 1,
      has_units: true,
      available_quantity: 1,
      shortage: 0,
      suggested_units: [other],
      available_units: [other],
    },
    {
      item_id: 12,
      product_id: 3,
      name: 'Cable',
      quantity: 5,
      has_units: false,
      available_quantity: 9,
      shortage: 0,
      suggested_units: [],
      available_units: [],
    },
  ],
};

describe('loan-review-selection', () => {
  it('parte de la propuesta del sistema, solo en ítems con unidades', () => {
    expect(initialSelection(review)).toEqual({ 10: [1, 2], 11: [9] });
  });

  const router = review.items[0]!;

  it('acepta el código sin distinguir mayúsculas ni espacios', () => {
    expect(scanUnit(router, initialSelection(review), [], '  eqp-c ')).toEqual({ ok: true, unit: c });
  });

  it('acepta una unidad de la propuesta: así se confirma', () => {
    expect(scanUnit(router, initialSelection(review), [], 'EQP-B')).toEqual({ ok: true, unit: b });
  });

  it('rechaza un código vacío', () => {
    expect(scanUnit(router, initialSelection(review), [], '   ')).toEqual({
      ok: false,
      error: 'Indica el código de la unidad que se entrega.',
    });
  });

  it('rechaza el código de otro producto, aunque esté en la solicitud', () => {
    const result = scanUnit(router, initialSelection(review), [], 'MAQ-Z');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('no está disponible');
  });

  it('rechaza un código ya escaneado', () => {
    expect(scanUnit(router, initialSelection(review), [3], 'EQP-C')).toEqual({
      ok: false,
      error: 'El código EQP-C ya fue escaneado.',
    });
  });

  it('rechaza una unidad elegida en otro ítem', () => {
    expect(scanUnit(router, { 10: [1, 2], 11: [3] }, [], 'EQP-C')).toEqual({
      ok: false,
      error: 'El código EQP-C ya está elegido en esta solicitud.',
    });
  });

  it('ordena las unidades elegidas por sala y cajón', () => {
    const units = selectedUnits(review.items[0]!, { 10: [1, 2, 3] });
    expect(units.map((u) => u.code)).toEqual(['EQP-C', 'EQP-B', 'EQP-A']);
  });

  it('detecta cambios respecto de la propuesta, sin importar el orden', () => {
    expect(isSelectionChanged(review, { 10: [2, 1], 11: [9] })).toBe(false);
    expect(isSelectionChanged(review, { 10: [3, 2], 11: [9] })).toBe(true);
  });

  it('el payload lleva todas las unidades visibles y omite los insumos', () => {
    expect(buildApprovePayload(review, { 10: [3, 2], 11: [9] })).toEqual({
      items: [
        { item_id: 10, unit_ids: [3, 2] },
        { item_id: 11, unit_ids: [9] },
      ],
    });
  });

  it('sin ítems con unidades el payload va vacío', () => {
    const onlySupplies = { ...review, items: [review.items[2]!] };
    expect(buildApprovePayload(onlySupplies, {})).toEqual({});
  });
});
