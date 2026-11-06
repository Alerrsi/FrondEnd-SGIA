import { z } from 'zod';

export const MIN_QUOTATIONS = 3;

/** Validación de UX del formulario de compra; el backend sigue siendo la fuente de verdad. */
export const purchaseFormSchema = z
  .object({
    origin: z.enum(['single', 'multiple']),
    annual_budget_id: z
      .number({ error: 'Selecciona el presupuesto que financia la compra.' })
      .int()
      .positive('Selecciona el presupuesto que financia la compra.'),
    quotation_id: z.number().int().positive().optional(),
    // Obligatoria si respondieron menos de 3 proveedores: el backend decide y responde 422.
    quotation_justification: z.string(),
    quotation_ids: z.array(z.number().int().positive()),
    supplier_id: z.number().int().positive().optional(),
    expected_at: z.string(),
    notes: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.origin === 'single') {
      if (!values.quotation_id) {
        ctx.addIssue({
          code: 'custom',
          path: ['quotation_id'],
          message: 'Selecciona una cotización aceptada.',
        });
      }
      return;
    }
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
  });

export type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;

export const EMPTY_PURCHASE_FORM: PurchaseFormValues = {
  origin: 'single',
  annual_budget_id: Number.NaN,
  quotation_id: undefined,
  quotation_justification: '',
  quotation_ids: [],
  supplier_id: undefined,
  expected_at: '',
  notes: '',
};
