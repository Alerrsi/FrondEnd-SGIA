import { z } from 'zod';

export const MIN_QUOTATIONS = 3;

const itemSchema = z.object({
  product_id: z.number().int().positive().optional(),
  name: z.string().trim().min(1, 'Describe el ítem.'),
  quantity: z.number({ error: 'Indica la cantidad.' }).int().min(1, 'Mínimo 1.'),
  unit_price: z
    .number({ error: 'El precio unitario es obligatorio.' })
    .positive('El precio unitario es obligatorio.'),
});

/** Validación de UX del formulario de compra; el backend sigue siendo la fuente de verdad. */
export const purchaseFormSchema = z
  .object({
    origin: z.enum(['quotation', 'manual']),
    annual_budget_id: z
      .number({ error: 'Selecciona el presupuesto que financia la compra.' })
      .int()
      .positive('Selecciona el presupuesto que financia la compra.'),
    quotation_ids: z.array(z.number().int().positive()),
    supplier_id: z.number().int().positive().optional(),
    items: z.array(itemSchema),
    expected_at: z.string(),
    notes: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.origin === 'quotation') {
      if (values.quotation_ids.length < MIN_QUOTATIONS) {
        ctx.addIssue({
          code: 'custom',
          path: ['quotation_ids'],
          message: `Selecciona al menos ${MIN_QUOTATIONS} cotizaciones aceptadas.`,
        });
      }
      if (!values.supplier_id) {
        ctx.addIssue({
          code: 'custom',
          path: ['supplier_id'],
          message: 'Selecciona el proveedor adjudicado.',
        });
      }
      return;
    }
    if (!values.supplier_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['supplier_id'],
        message: 'Selecciona el proveedor adjudicado.',
      });
    }
    if (values.items.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['items'],
        message: 'Agrega al menos un ítem.',
      });
    }
  });

export type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;

export const EMPTY_PURCHASE_FORM: PurchaseFormValues = {
  origin: 'quotation',
  annual_budget_id: Number.NaN,
  quotation_ids: [],
  supplier_id: undefined,
  items: [],
  expected_at: '',
  notes: '',
};

export function purchaseTotal(items: PurchaseFormValues['items']): number {
  return items.reduce(
    (sum, it) =>
      sum +
      (Number.isFinite(it.quantity) ? it.quantity : 0) *
        (Number.isFinite(it.unit_price) ? it.unit_price : 0),
    0,
  );
}
