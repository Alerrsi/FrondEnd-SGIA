import type { CreatePurchaseRequestPayload, PurchaseRequest } from '@sgia/types';
import { z } from 'zod';

/** Validación de UX de la solicitud; el backend sigue siendo la fuente de verdad. */
export const purchaseRequestFormSchema = z.object({
  annual_budget_id: z
    .number({ error: 'Selecciona el presupuesto de la solicitud.' })
    .int()
    .positive('Selecciona el presupuesto de la solicitud.'),
  items: z
    .array(
      z.object({
        product_id: z.number().int().positive(),
        product_name: z.string(),
        quantity: z
          .number({ error: 'Indica la cantidad.' })
          .int('La cantidad debe ser un número entero.')
          .positive('La cantidad debe ser mayor a 0.'),
      }),
    )
    .min(1, 'Agrega al menos un producto.')
    .refine(
      (items) => new Set(items.map((i) => i.product_id)).size === items.length,
      'No repitas productos: ajusta la cantidad.',
    ),
  notes: z.string().max(1000, 'Máximo 1000 caracteres.'),
});

export type PurchaseRequestFormValues = z.infer<typeof purchaseRequestFormSchema>;

export function purchaseRequestFormDefaults(
  request: PurchaseRequest | null,
): PurchaseRequestFormValues {
  return {
    annual_budget_id: request?.annual_budget_id ?? Number.NaN,
    items: (request?.items ?? []).map((i) => ({
      product_id: i.product_id,
      product_name: i.product_name,
      quantity: i.quantity,
    })),
    notes: request?.notes ?? '',
  };
}

export function toPurchaseRequestPayload(
  values: PurchaseRequestFormValues,
): CreatePurchaseRequestPayload {
  return {
    annual_budget_id: values.annual_budget_id,
    items: values.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
    notes: values.notes.trim() || null,
  };
}
