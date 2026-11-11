import { describe, expect, it } from 'vitest';

import { purchaseRequestFormSchema } from './lib/purchase-request-form-schema';
import { isPurchaseRequestCode } from './lib/purchase-request-code';
import {
  itemsSubtotal,
  orderUploadSchema,
  quotationUploadSchema,
} from './lib/quotation-upload-schema';

const pdf = () => new File(['%PDF'], 'c.pdf', { type: 'application/pdf' });

describe('Esquema de la solicitud de compra', () => {
  const base = {
    annual_budget_id: 4,
    items: [{ product_id: 5, product_name: 'Switch', quantity: 2 }],
    notes: '',
  };

  it('acepta una solicitud válida', () => {
    expect(purchaseRequestFormSchema.safeParse(base).success).toBe(true);
  });

  it('exige presupuesto y al menos un producto', () => {
    const res = purchaseRequestFormSchema.safeParse({ ...base, annual_budget_id: Number.NaN, items: [] });
    expect(res.success).toBe(false);
    const paths = res.error?.issues.map((i) => i.path.join('.'));
    expect(paths).toContain('annual_budget_id');
    expect(paths).toContain('items');
  });

  it('rechaza cantidades no positivas y productos repetidos', () => {
    expect(
      purchaseRequestFormSchema.safeParse({
        ...base,
        items: [{ product_id: 5, product_name: 'Switch', quantity: 0 }],
      }).success,
    ).toBe(false);
    expect(
      purchaseRequestFormSchema.safeParse({
        ...base,
        items: [base.items[0], base.items[0]],
      }).success,
    ).toBe(false);
  });
});

describe('Esquema de cotización subida', () => {
  const base = {
    supplier_id: 3,
    file: pdf(),
    total: 1000,
    received_at: '',
    items: [{ purchase_request_item_id: 31, unit_price: 500 }],
  };

  it('acepta una cotización completa', () => {
    expect(quotationUploadSchema.safeParse(base).success).toBe(true);
  });

  it('exige archivo, proveedor, total positivo y precios', () => {
    expect(quotationUploadSchema.safeParse({ ...base, file: null }).success).toBe(false);
    expect(quotationUploadSchema.safeParse({ ...base, supplier_id: Number.NaN }).success).toBe(false);
    expect(quotationUploadSchema.safeParse({ ...base, total: 0 }).success).toBe(false);
    expect(
      quotationUploadSchema.safeParse({
        ...base,
        items: [{ purchase_request_item_id: 31, unit_price: Number.NaN }],
      }).success,
    ).toBe(false);
  });

  it('acepta Word/Excel en cotizaciones y rechaza otros formatos', () => {
    const txt = new File(['x'], 'c.txt', { type: 'text/plain' });
    const xlsx = new File(['x'], 'c.xlsx', { type: '' });
    expect(quotationUploadSchema.safeParse({ ...base, file: txt }).success).toBe(false);
    expect(quotationUploadSchema.safeParse({ ...base, file: xlsx }).success).toBe(true);
  });

  it('suma precio × cantidad como referencia del total', () => {
    expect(
      itemsSubtotal(
        [
          { purchase_request_item_id: 31, unit_price: 500 },
          { purchase_request_item_id: 32, unit_price: Number.NaN },
        ],
        new Map([
          [31, 3],
          [32, 2],
        ]),
      ),
    ).toBe(1500);
  });
});

describe('Esquema de la OC', () => {
  it('exige número y archivo', () => {
    expect(orderUploadSchema.safeParse({ order_number: '4500', file: pdf() }).success).toBe(true);
    expect(orderUploadSchema.safeParse({ order_number: '  ', file: pdf() }).success).toBe(false);
    expect(orderUploadSchema.safeParse({ order_number: '4500', file: null }).success).toBe(false);
    const xlsx = new File(['x'], 'oc.xlsx', { type: '' });
    expect(orderUploadSchema.safeParse({ order_number: '4500', file: xlsx }).success).toBe(false);
  });
});

describe('Código de solicitud', () => {
  it('reconoce SC-AAAA-NNNN sin importar mayúsculas', () => {
    expect(isPurchaseRequestCode('SC-2026-0001')).toBe(true);
    expect(isPurchaseRequestCode(' sc-2026-12345 ')).toBe(true);
    expect(isPurchaseRequestCode('OC-2026-0001')).toBe(false);
    expect(isPurchaseRequestCode('SC-26-1')).toBe(false);
  });
});
