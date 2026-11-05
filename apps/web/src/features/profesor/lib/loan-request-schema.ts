import { z } from 'zod';
import type { CreatePrestamoPayload } from '@sgia/types';

import { todayIso } from '@/features/profesor/lib/dates';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const timeField = (label: string) =>
  z.string().min(1, `Indica la hora de ${label}.`).regex(TIME_REGEX, 'Usa el formato HH:MM.');

const idField = (message: string) => z.number({ error: message }).int().positive(message);

/**
 * Validación de UX de la solicitud remota (`POST /api/loans/requests`). El profesor no se envía:
 * el backend lo toma del token. El stock lo vuelve a validar el backend.
 */
export const loanRequestSchema = z
  .object({
    career_id: idField('Selecciona la carrera.'),
    subject: z.string().trim().min(1, 'Indica la asignatura.').max(255, 'Máximo 255 caracteres.'),
    loan_date: z
      .string()
      .min(1, 'Indica la fecha de la actividad.')
      .refine((v) => v >= todayIso(), 'La fecha no puede ser pasada.'),
    start_time: timeField('inicio'),
    end_time: timeField('término'),
    storeroom_id: idField('Selecciona el pañol.'),
    location_id: idField('Selecciona el laboratorio.'),
    /** Vencimiento opcional; vacío = el mismo día de la actividad (lo asume el backend). */
    due_date: z.string().optional(),
    notes: z.string().max(1000, 'Máximo 1000 caracteres.').optional(),
    items: z
      .array(
        z.object({
          product_id: z.number().int().positive(),
          name: z.string(),
          available: z.number(),
          quantity: z
            .number({ error: 'Indica la cantidad.' })
            .int('Debe ser un número entero.')
            .min(1, 'La cantidad mínima es 1.'),
        }),
      )
      .min(1, 'Agrega al menos un insumo.')
      .superRefine((items, ctx) => {
        items.forEach((item, index) => {
          if (Number.isFinite(item.quantity) && item.quantity > item.available) {
            ctx.addIssue({
              code: 'custom',
              path: [index, 'quantity'],
              message: `Solo hay ${item.available} disponibles.`,
            });
          }
        });
      }),
  })
  .refine(
    (v) =>
      !TIME_REGEX.test(v.start_time) || !TIME_REGEX.test(v.end_time) || v.end_time > v.start_time,
    {
      path: ['end_time'],
      error: 'La hora de término debe ser posterior a la de inicio.',
      // Sin esto Zod omite la regla mientras otro campo del formulario tenga errores.
      when: () => true,
    },
  )
  .refine((v) => !v.due_date || !v.loan_date || v.due_date >= v.loan_date, {
    path: ['due_date'],
    error: 'El vencimiento no puede ser anterior a la fecha de la actividad.',
    when: () => true,
  });

export { todayIso };
export type LoanRequestValues = z.infer<typeof loanRequestSchema>;
export type LoanRequestItem = LoanRequestValues['items'][number];

export function initialLoanRequestValues(storeroomId?: number | null): LoanRequestValues {
  return {
    career_id: Number.NaN,
    subject: '',
    loan_date: todayIso(),
    start_time: '',
    end_time: '',
    storeroom_id: storeroomId ?? Number.NaN,
    location_id: Number.NaN,
    due_date: '',
    notes: '',
    items: [],
  };
}

/** Campos del formulario que pueden recibir un `422` del backend. */
export const LOAN_REQUEST_SERVER_FIELDS = [
  'career_id',
  'subject',
  'loan_date',
  'start_time',
  'end_time',
  'storeroom_id',
  'location_id',
  'due_date',
  'notes',
] as const;

export function toLoanRequestPayload(values: LoanRequestValues): CreatePrestamoPayload {
  return {
    career_id: values.career_id,
    subject: values.subject.trim(),
    loan_date: values.loan_date,
    start_time: values.start_time,
    end_time: values.end_time,
    storeroom_id: values.storeroom_id,
    location_id: values.location_id,
    due_date: values.due_date || undefined,
    notes: values.notes?.trim() || undefined,
    items: values.items.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
    })),
  };
}
