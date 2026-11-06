import { describe, expect, it } from 'vitest';
import type { InvoiceIntake, Producto } from '@sgia/types';

import {
  buildInvoiceReviewSchema,
  initialReviewValues,
  matchProduct,
  suggestProducts,
  toConfirmPayload,
} from '@/features/ingresos-factura/lib/invoice-review-schema';

const products = [
  { id: 1, nombre: 'Cable UTP Cat6', type: 'insumo' },
  { id: 2, nombre: 'Osciloscopio Rigol', type: 'equipo' },
] as Producto[];

const types = new Map(products.map((p) => [p.id, p.type ?? 'insumo'] as const));

const intake = {
  id: 5,
  annual_budget_id: 3,
  purchase_id: null,
  document_number: null,
  status: 'borrador',
  total_deducted: 0,
  has_file: true,
  user_id: 1,
  received_at: null,
  items: [],
  raw_ocr_payload: {
    invoice_number: 'F-881',
    supplier_name: null,
    supplier_id: null,
    ocr_available: true,
    items: [
      { name: 'cable utp cat6', quantity: 10, unit_price: 990 },
      { name: 'Producto sin match', quantity: 1, unit_price: 5000 },
    ],
  },
} as InvoiceIntake;

describe('Revisión de borrador de factura (REQ-17)', () => {
  it('asocia por nombre sin importar mayúsculas ni tildes', () => {
    expect(matchProduct('OSCILOSCÓPIO  rigol', products)?.id).toBe(2);
    expect(matchProduct('Otro', products)).toBeUndefined();
  });

  it('precarga número de factura e ítems desde el OCR', () => {
    const values = initialReviewValues(intake, products);
    expect(values.document_number).toBe('F-881');
    expect(values.items[0]?.product_id).toBe(1);
    expect(Number.isNaN(values.items[1]?.product_id)).toBe(true);
  });

  it('exige cajón solo para equipos y maquetas', () => {
    const schema = buildInvoiceReviewSchema(types);
    const result = schema.safeParse({
      document_number: 'F-881',
      items: [
        { product_id: 1, detected_name: null, quantity: 10, unit_price: 990 },
        { product_id: 2, detected_name: null, quantity: 2, unit_price: 350000 },
      ],
    });
    expect(result.success).toBe(false);
    const paths = result.success ? [] : result.error.issues.map((i) => i.path.join('.'));
    expect(paths).toEqual(['items.1.cajon_id']);
  });

  it('exige número de factura y producto asociado', () => {
    const schema = buildInvoiceReviewSchema(types);
    const result = schema.safeParse({
      document_number: ' ',
      items: [
        {
          product_id: Number.NaN,
          detected_name: 'x',
          quantity: 1,
          unit_price: 0,
        },
      ],
    });
    const paths = result.success ? [] : result.error.issues.map((i) => i.path.join('.'));
    expect(paths).toEqual(expect.arrayContaining(['document_number', 'items.0.product_id']));
  });

  it('el payload solo envía cajón para equipos', () => {
    const payload = toConfirmPayload(
      {
        document_number: ' F-881 ',
        items: [
          {
            product_id: 1,
            detected_name: 'cable',
            quantity: 10,
            unit_price: 990,
            cajon_id: 4,
          },
          {
            product_id: 2,
            detected_name: '',
            quantity: 2,
            unit_price: 350000,
            cajon_id: 7,
          },
        ],
      },
      types,
    );
    expect(payload).toEqual({
      document_number: 'F-881',
      items: [
        {
          product_id: 1,
          quantity: 10,
          unit_price: 990,
          detected_name: 'cable',
        },
        {
          product_id: 2,
          quantity: 2,
          unit_price: 350000,
          detected_name: null,
          cajon_id: 7,
        },
      ],
    });
  });
});

describe('matchProduct difuso', () => {
  const prods = [
    { id: 1, name: 'Pila Duracell AAA alcalina (pack 24)' },
    { id: 2, name: 'Pila Duracell AA alcalina (tira x 12)' },
  ] as never[];
  it('asocia ignorando mayúsculas, ortografía y diferencia AA/AAA', () => {
    expect(matchProduct('PILA DURACELL  AAA ALKALINA 2400', prods)?.id).toBe(1);
    expect(matchProduct('PILA DURACELL AA ALKALINA TIRA X 12', prods)?.id).toBe(2);
    expect(matchProduct('CARTON CORRUGADO', prods)).toBeUndefined();
    const c = [{ id: 7, name: 'Cartón corrugado 1,2x5' }] as never[];
    expect(matchProduct('CARTON CORRUGADO1.2x5', c)?.id).toBe(7);
  });
});

describe('suggestProducts', () => {
  const prods = [
    { id: 1, name: 'Cartón corrugado 1,2x5' },
    { id: 2, name: 'Cartón piedra' },
    { id: 3, name: 'Pila Duracell AA' },
    { id: 4, name: 'Cartón corrugado doble' },
    { id: 5, name: 'Papel corrugado' },
  ] as never[];
  it('devuelve hasta 3 parecidos, el más cercano primero, ignorando mayúsculas y tildes', () => {
    const ids = suggestProducts('CARTON CORRUGADO', prods).map((p) => p.id);
    expect(ids).toHaveLength(3);
    expect(ids.slice(0, 2).sort()).toEqual([1, 4]);
    expect(ids).not.toContain(3);
  });
  it('devuelve vacío si nada se parece', () => {
    expect(suggestProducts('Osciloscopio', prods)).toEqual([]);
    expect(suggestProducts('', prods)).toEqual([]);
  });
});
