import { describe, expect, it } from 'vitest';

import {
  EMPTY_PURCHASE_FORM,
  purchaseFormSchema,
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
        quotation_id: 1,
      }),
    ).toContain('annual_budget_id');
  });

  it('desde 3 cotizaciones basta con presupuesto, cotizaciones y proveedor', () => {
    expect(
      issuePaths({
        ...EMPTY_PURCHASE_FORM,
        origin: 'multiple',
        annual_budget_id: 3,
        quotation_ids: [1, 2, 3],
        supplier_id: 2,
      }),
    ).toEqual([]);
  });

  it('con una cotización exige elegirla', () => {
    expect(issuePaths({ ...EMPTY_PURCHASE_FORM, annual_budget_id: 3 })).toContain('quotation_id');
    expect(issuePaths({ ...EMPTY_PURCHASE_FORM, annual_budget_id: 3, quotation_id: 4 })).toEqual(
      [],
    );
  });

  it('con varias cotizaciones exige 3 y proveedor', () => {
    const paths = issuePaths({
      ...EMPTY_PURCHASE_FORM,
      origin: 'multiple',
      annual_budget_id: 3,
      quotation_ids: [1, 2],
    });
    expect(paths).toEqual(expect.arrayContaining(['quotation_ids', 'supplier_id']));
  });
});
