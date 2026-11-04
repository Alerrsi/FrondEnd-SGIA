import { z } from 'zod';

import { validateRun } from '@/features/usuarios/lib/run';

/** RUT chileno con dígito verificador válido (acepta puntos y guion). */
export const rutSchema = z
  .string()
  .trim()
  .min(1, 'El RUT es obligatorio.')
  .refine(validateRun, 'Ingresa un RUT válido, ej. 12.345.678-5.');

export const studentFormSchema = z.object({
  rut: rutSchema,
  full_name: z.string().trim().max(150, 'Máximo 150 caracteres.'),
  email: z
    .string()
    .trim()
    .refine((v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Formato de correo inválido.'),
  career_id: z.number().int().positive().nullable(),
});

export type StudentFormValues = z.infer<typeof studentFormSchema>;
