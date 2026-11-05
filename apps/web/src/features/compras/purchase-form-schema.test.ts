import { describe, expect, it } from 'vitest';

import {
  EMPTY_PURCHASE_FORM,
  purchaseFormSchema,
  purchaseTotal,
} from '@/features/compras/lib/purchase-form-schema';

const issuePaths = (input: unknown) => {
  const result = purchaseFormSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => i.path.join('.'));
};

describe('purchaseFormSchema (REQ-08 + presupuesto)', () => {
  it('exige el presupuesto que financia la compra', () => {
    expect(
      issuePaths({
        ...EMPTY_PURCHASE_FORM,
        quotation_ids: [1, 2, 3],
        supplier_id: 2,
      }),
    ).toContain('annual_budget_id');
  });

  it('desde cotización basta con presupuesto y cotización', () => {
    expect(
      issuePaths({
        ...EMPTY_PURCHASE_FORM,
        annual_budget_id: 3,
        quotation_ids: [1, 2, 3],
        supplier_id: 2,
      }),
    ).toEqual([]);
  });

  it('en compra directa exige precio unitario en cada ítem', () => {
    const paths = issuePaths({
      ...EMPTY_PURCHASE_FORM,
      origin: 'manual',
      annual_budget_id: 3,
      supplier_id: 2,
      items: [
        { name: 'Cable UTP', quantity: 2, unit_price: Number.NaN },
        { name: 'Conector RJ45', quantity: 10, unit_price: 0 },
      ],
    });
    expect(paths).toContain('items.0.unit_price');
    expect(paths).toContain('items.1.unit_price');
  });

  it('en compra directa exige proveedor y al menos un ítem', () => {
    const paths = issuePaths({
      ...EMPTY_PURCHASE_FORM,
      origin: 'manual',
      annual_budget_id: 3,
    });
    expect(paths).toEqual(expect.arrayContaining(['supplier_id', 'items']));
  });

  it('purchaseTotal ignora los valores aún vacíos', () => {
    expect(
      purchaseTotal([
        { name: 'a', quantity: 2, unit_price: 1500 },
        { name: 'b', quantity: 1, unit_price: Number.NaN },
      ]),
    ).toBe(3000);
  });
});
