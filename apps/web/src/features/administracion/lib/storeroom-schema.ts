import { z } from 'zod';

export const storeroomFormSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres.').max(120),
  code: z
    .string()
    .trim()
    .min(2, 'El código es obligatorio.')
    .max(30, 'Máximo 30 caracteres.')
    .regex(/^[A-Za-z0-9-]+$/, 'Solo letras, números y guiones.'),
  general_location: z.string().trim().max(200, 'Máximo 200 caracteres.'),
});

export type StoreroomFormValues = z.infer<typeof storeroomFormSchema>;
