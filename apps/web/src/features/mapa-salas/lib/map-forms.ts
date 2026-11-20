import { z } from 'zod';

import { normalizeCajonCode, CAJON_CODE_MAX } from '@/features/ubicaciones/lib/location-code';

// Formularios del mapa de salas (REQ-22). Mismos límites que la API (BackEnd-SGIA/docs/mapa-salas.md).

// Los campos numéricos se registran con `valueAsNumber`: vacío llega como `NaN` y cae en el mensaje de tipo.
const cm = (label: string, min: number, max: number) =>
  z
    .number({ error: `${label}: escribe un número` })
    .int(`${label}: en centímetros enteros`)
    .min(min, `${label}: mínimo ${min} cm`)
    .max(max, `${label}: máximo ${max} cm`);

const meters = (label: string, min: number, max: number) =>
  z
    .number({ error: `${label}: escribe un número` })
    .min(min, `${label}: mínimo ${min} m`)
    .max(max, `${label}: máximo ${max} m`);

export const estanteFormSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(1, 'El código del estante es obligatorio')
    .refine((value) => normalizeCajonCode(value) !== '', 'El código debe tener letras o números')
    .refine((value) => normalizeCajonCode(value).length <= CAJON_CODE_MAX, `Máximo ${CAJON_CODE_MAX} caracteres`),
  nombre: z.string().trim().max(80, 'Máximo 80 caracteres'),
  zona_id: z.string(),
  width: cm('Largo', 20, 2000),
  depth: cm('Fondo', 20, 2000),
  rotation: z.enum(['0', '90']),
});

export type EstanteFormValues = z.infer<typeof estanteFormSchema>;

export const zonaFormSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre de la zona es obligatorio').max(60, 'Máximo 60 caracteres'),
  width: meters('Ancho', 0.5, 100),
  depth: meters('Largo', 0.5, 100),
});

export type ZonaFormValues = z.infer<typeof zonaFormSchema>;

export const salaDimensionesSchema = z.object({
  width: meters('Ancho', 1, 100),
  height: meters('Largo', 1, 100),
});

export type SalaDimensionesValues = z.infer<typeof salaDimensionesSchema>;

/** Metros con un decimal a centímetros enteros. */
export function metersToCm(value: number): number {
  return Math.round(value * 100);
}

export function cmToMeters(value: number): number {
  return Math.round(value / 10) / 10;
}

export { normalizeCajonCode as normalizeEstanteCode };
