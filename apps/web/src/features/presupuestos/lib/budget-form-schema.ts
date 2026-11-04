import { z } from 'zod';

import { formatCLP } from '@/features/compras/lib/format';

const amount = z
  .number({ error: 'Ingresa el monto inicial.' })
  .positive('El monto debe ser mayor a 0.')
  .max(9_999_999_999, 'Monto demasiado alto.');

export const createBudgetSchema = z.object({
  career_id: z.number({ error: 'Selecciona la carrera.' }).int().positive('Selecciona la carrera.'),
  year: z
    .number({ error: 'Ingresa el año.' })
    .int('El año debe ser entero.')
    .min(2000, 'Año fuera de rango.')
    .max(2100, 'Año fuera de rango.'),
  initial_amount: amount,
});

export type CreateBudgetValues = z.infer<typeof createBudgetSchema>;

/**
 * El nuevo monto debe cubrir lo ya consumido + reservado (validación de UX; el backend responde 422 igual).
 */
export function buildUpdateBudgetSchema(committed: number) {
  return z.object({
    initial_amount: amount.refine((v) => v >= committed, {
      message: `Debe cubrir lo consumido + reservado (${formatCLP(committed)}).`,
    }),
  });
}

export type UpdateBudgetValues = z.infer<ReturnType<typeof buildUpdateBudgetSchema>>;
